//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "./interfaces/silicaAccount/ISilicaAccount.sol";
import "./Silica.sol";
import "./interfaces/hashvault/IHashVault.sol";
import "./libraries/UnorderedAddressSet.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./libraries/FullMath.sol";
import "./interfaces/hashvault/IUniswapV2Router02.sol";
import "hardhat/console.sol";

/**
 * @notice HashVault receives paymentToken and buy Silicas
 * @author Alkimiya Team
 */
contract HashVault is IHashVault, Initializable, ReentrancyGuard {
    using UnorderedAddressSetLib for UnorderedAddressSetLib.Set;
    UnorderedAddressSetLib.Set purchasedSilicaSet;

    uint128 internal constant FIXED_POINT_BASE = 10**6;
    uint128 internal constant DUST_AMOUNT = 1000000;
    IUniswapV2Router02 router;

    address public owner; // Owner of this contract
    IERC20 public paymentToken; // The payment token accepted in this contract
    IERC20 public rewardToken; // The reward token expects in this contract
    uint256 public dateOfStart; // The date when this hashvault starts
    uint256 public duration = 7 days; // The duration of each cycle
    uint256 public cooling = 3 days; // The duration of each cycle
    bool public sharesCalculated; // flag if the shares has been calculate for this cycle
    uint256 public adminFee = 2; // admin fee
    uint256 public maxDeposits; // max deposits supported by the vault
    uint256 public minDeposits; // min deposits supported by the vault
    bool public started = false;

    uint256 public totalDeposits; // holds the total deposits from buyers
    uint256 public adminBalance; // holds the total admin fee calculated over the payment
    uint256 totalReturnReward; // holds the total reward from silicas

    mapping(address => uint256) private buyersDeposits; // holds the deposit amount of each buyer
    mapping(address => uint256) private buyersPaymentShares; // holds the amount of payment to be send to the buyer
    mapping(address => uint256) private buyersRewardShares; // holds the amount of reward to be send to the buyer
    address[] buyers;

    modifier onlyBuyer() {
        require(buyersDeposits[msg.sender] > 0, "Only buyer");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyBeforeStarts() {
        require(
            started == false || dateOfStart > block.timestamp,
            "Only before starts"
        );
        _;
    }

    modifier onlyAfterStarts() {
        require(started || dateOfStart <= block.timestamp, "Only after starts");
        _;
    }

    modifier onlyBeforeEnds() {
        require((dateOfStart + duration) > block.timestamp, "Only before ends");
        _;
    }

    modifier onlyAfterCoolingEnds() {
        require(
            block.timestamp > (dateOfStart + duration + cooling),
            "Only after cooling ends"
        );
        _;
    }

    modifier onlyAfterEnds() {
        require(block.timestamp > (dateOfStart + duration), "Only after ends");
        _;
    }

    modifier onlyBeforeCalculateShares() {
        require(
            sharesCalculated == false,
            "Only before shares has been calculated"
        );
        _;
    }

    modifier onlyAfterCalculateShares() {
        require(sharesCalculated, "Only after shares has been calculated");
        _;
    }

    modifier onlyAfterLiquidateAllSilicas() {
        for (uint256 i = 0; i < uint256(purchasedSilicaSet.count()); i++) {
            Silica silica = Silica(payable(purchasedSilicaSet.keyAtIndex(i)));
            require(
                (silica.status() == Silica.Status.Defaulted) ||
                    (silica.status() == Silica.Status.Finished),
                "Only after all Silica has been liquidate"
            );
        }
        _;
    }

    receive() external payable {
        revert();
    }

    function initialize(
        address _owner,
        address _paymentToken,
        address _rewardToken,
        uint256 _dateOfStart,
        uint256 _duration,
        uint256 _adminFee,
        uint256 _cooling,
        uint256 _maxDeposits,
        uint256 _minDeposits,
        address _swapRouterAddress
    ) external override initializer {
        // require(
        //     _swapRouterAddress != address(0),
        //     "SwapRouter cannot be zero address"
        // );
        require(
            _paymentToken != address(0),
            "payment token address cannot be zero address"
        );
        require(_owner != address(0), "Owner address cannot be zero address");
        require(
            _dateOfStart > block.timestamp,
            "Date of start should be greater than today"
        );

        paymentToken = IERC20(_paymentToken);
        rewardToken = IERC20(_rewardToken);
        owner = payable(_owner);
        dateOfStart = _dateOfStart;
        if (_duration > 0) {
            duration = _duration;
        }
        if (_cooling > 0) {
            cooling = _cooling;
        }
        adminFee = _adminFee;
        maxDeposits = _maxDeposits;
        minDeposits = _minDeposits;
        router = IUniswapV2Router02(_swapRouterAddress);
    }

    function start() external override onlyOwner onlyBeforeStarts {
        require(
            minDeposits <= totalDeposits,
            "This vault didn't reached the min deposits to start"
        );
        dateOfStart = block.timestamp;
    }

    function deposit(uint256 depositAmount) external override onlyBeforeStarts {
        require(
            maxDeposits >= totalDeposits + depositAmount,
            "This vault reached the max deposits"
        );
        require(depositAmount > 0, "Value not permitted");

        _safeTransferFrom(
            paymentToken,
            msg.sender,
            address(this),
            depositAmount
        );

        // check if buyer exists
        if (buyersDeposits[msg.sender] == 0) {
            buyers.push(msg.sender);
        }
        uint256 adminFeeAmount = adminFeeCalculation(depositAmount);
        adminBalance += adminFeeAmount;
        buyersDeposits[msg.sender] += depositAmount - adminFeeAmount;
        totalDeposits += buyersDeposits[msg.sender];

        emit DepositConfirmed(
            msg.sender,
            depositAmount,
            block.timestamp,
            address(this)
        );
    }

    function purchaseSilica(address silicaAddress, uint256 amount)
        external
        override
        onlyOwner
        onlyAfterStarts
    {
        require(amount > 0, "Value not permitted");
        require(
            address(Silica(silicaAddress).paymentToken()) ==
                address(paymentToken),
            "Silica payment token is different from HashVault"
        );
        require(
            address(
                ISilicaAccount(Silica(silicaAddress).silicaAccount())
                    .getRewardTokenAddress()
            ) == address(rewardToken),
            "Silica payment token is different from HashVault"
        );

        // CANNOT APPROVE AMOUNT THAT BELONGS TO ADMINBALANCE (TOTALRETURNPAYMENT)
        paymentToken.approve(payable(silicaAddress), amount);
        Silica(silicaAddress).deposit(amount);
        if (!purchasedSilicaSet.exists(address(silicaAddress))) {
            purchasedSilicaSet.insert(address(silicaAddress));
        }

        emit PurchaseConfirmed(
            msg.sender,
            silicaAddress,
            amount,
            block.timestamp,
            address(this)
        );
    }

    function liquidateSilica(address silicaAddress)
        internal
        onlyAfterStarts
        onlyBeforeCalculateShares
    {
        console.log("========= LIQUIDATE =======");
        console.log("Payment Balance", paymentToken.balanceOf(address(this)));
        console.log("Reward  Balance", rewardToken.balanceOf(address(this)));
        console.log("Reward  Return ", totalReturnReward);

        Silica silica = Silica(payable(silicaAddress));
        if (silica.balanceOf(address(this)) > 0) {
            if (silica.status() == Silica.Status.Defaulted) {
                (, uint256 returnReward) = silica.buyerRedeemDefault();
                totalReturnReward += returnReward;
            } else if (silica.status() == Silica.Status.Finished) {
                totalReturnReward += silica.buyerRedeem();
            }
        }
        console.log("========= LIQUIDATE AFTER =======");
        console.log("Payment Balance", paymentToken.balanceOf(address(this)));
        console.log("Reward  Balance", rewardToken.balanceOf(address(this)));
        console.log("Reward  Return ", totalReturnReward);
    }

    function liquidateSingleSilica(address silicaAddress)
        external
        override
        onlyOwner
        onlyAfterStarts
    {
        liquidateSilica(payable(silicaAddress));
    }

    function liquidateAllSilicas() external override onlyOwner onlyAfterStarts {
        for (uint256 i = 0; i < uint256(purchasedSilicaSet.count()); i++) {
            liquidateSilica(payable(purchasedSilicaSet.keyAtIndex(i)));
        }
    }

    function swapRewards(uint256 amount)
        external
        override
        onlyOwner
        onlyAfterStarts
    {
        uint256[] memory amounts = swapTokens(
            address(rewardToken),
            address(paymentToken),
            amount
        );
        totalReturnReward -= amounts[0];

        // emit event swap Rewards, totalReturns values updated!
    }

    function calculateShares()
        external
        override
        onlyOwner
        onlyAfterEnds
        onlyBeforeCalculateShares
        onlyAfterLiquidateAllSilicas
    {
        uint256 totalPaymentShareAmount = paymentToken.balanceOf(
            address(this)
        ) - adminBalance;

        console.log("totalReturnReward %s", totalReturnReward);
        console.log("adminBalance %s", adminBalance);
        console.log("totalPayment %s", totalPaymentShareAmount);

        // cannot restart until all silica have
        // should we create a buyer struct?
        // (gas cost optimization/more concise code/storage)
        for (uint256 i = 0; i < buyers.length; i++) {
            if (buyersDeposits[buyers[i]] > 0) {
                uint256 rewardAmount = FullMath.mulDiv(
                    buyersDeposits[buyers[i]],
                    totalReturnReward,
                    totalDeposits
                );
                uint256 paymentAmount = FullMath.mulDiv(
                    buyersDeposits[buyers[i]],
                    totalPaymentShareAmount,
                    totalDeposits
                );

                // After the calculateShares this will be cleared:
                //  1 - user withdraw
                //  2 - restart rollout
                buyersPaymentShares[buyers[i]] = paymentAmount;
                buyersRewardShares[buyers[i]] = rewardAmount;
            }
        }

        sharesCalculated = true;
    }

    function withdraw()
        external
        override
        onlyBuyer
        onlyAfterEnds
        onlyAfterCalculateShares
        onlyAfterLiquidateAllSilicas
    {
        if (buyersRewardShares[msg.sender] > 0) {
            _safeTransfer(
                rewardToken,
                msg.sender,
                buyersRewardShares[msg.sender]
            );
            totalReturnReward -= buyersRewardShares[msg.sender];
            console.log(
                "Sent to %s reward token %s total left %s",
                msg.sender,
                buyersRewardShares[msg.sender],
                totalReturnReward
            );
        }

        if (buyersPaymentShares[msg.sender] > 0) {
            _safeTransfer(
                paymentToken,
                msg.sender,
                buyersPaymentShares[msg.sender]
            );
            console.log(
                "Sent to %s payment token %s",
                msg.sender,
                buyersPaymentShares[msg.sender]
            );
        }

        // ZERO OR REMOVE? should benchmark the gas!!
        buyersPaymentShares[msg.sender] = 0;
        buyersRewardShares[msg.sender] = 0;
        buyersDeposits[msg.sender] = 0;

        // call a event
    }

    function restart()
        external
        override
        onlyOwner
        onlyAfterEnds
        onlyAfterCoolingEnds
        onlyAfterLiquidateAllSilicas
    {
        uint256[] memory amounts = new uint256[](2);
        // 1. Swap rewards to paymentToken
        if (totalReturnReward > DUST_AMOUNT) {
            amounts = swapTokens(
                address(rewardToken),
                address(paymentToken),
                totalReturnReward
            );
        } else {
            // weird way to solve the DUST problem (if every single buyer withdraw the fund)
            // should split the functions to get a cleaner code.
            amounts[0] = 1;
            amounts[1] = 1;
        }
        console.log("total Return reward", totalReturnReward);
        console.log("admin balance      ", adminBalance);
        console.log(
            "total payment token",
            paymentToken.balanceOf(address(this))
        );

        // 2. Reset global values
        totalDeposits = 0;
        totalReturnReward = 0;

        // 3. recalculate the buyers Payment Balance after swap
        for (uint256 i = 0; i < buyers.length; i++) {
            if (buyersDeposits[buyers[i]] > 0) {
                console.log("=============");
                console.log(
                    "buyer payment before",
                    buyersPaymentShares[buyers[i]]
                );
                console.log(
                    "buyer reward before ",
                    buyersRewardShares[buyers[i]]
                );
                buyersPaymentShares[buyers[i]] += FullMath.mulDiv(
                    buyersRewardShares[buyers[i]], // buyer reward shares
                    amounts[1], // Total PaymentToken returned from swap
                    amounts[0] // Total RewardToken swapped
                );
                console.log(
                    "buyer payment after ",
                    buyersPaymentShares[buyers[i]]
                );

                //4. Reset buyers values
                buyersRewardShares[buyers[i]] = 0;
                buyersDeposits[buyers[i]] = 0;

                //5. Reinvest the remaining paymentToken // should split deposit to a internal function, should check MAX_CAPACITY.
                uint256 adminFeeAmount = adminFeeCalculation(
                    buyersPaymentShares[buyers[i]]
                );
                adminBalance += adminFeeAmount;
                buyersDeposits[buyers[i]] +=
                    buyersPaymentShares[buyers[i]] -
                    adminFeeAmount;

                buyersPaymentShares[buyers[i]] = 0;

                totalDeposits += buyersDeposits[buyers[i]];
            }
        }
        console.log("total deposits", totalDeposits);
        console.log("admin balance", adminBalance);

        sharesCalculated = false;
    }

    function withdrawAdmin() external override onlyOwner onlyAfterEnds {
        // TODO withdraw admin
        console.log("Admin %s withdraw payment %s", owner, adminBalance);
        _safeTransfer(IERC20(paymentToken), owner, adminBalance);
        adminBalance = 0;
    }

    /** @dev Internal method for safely transfering tokens
     *  from outer source into contract.
     */
    function _safeTransferFrom(
        IERC20 token,
        address sender,
        address recipient,
        uint256 amount
    ) private {
        bool sent = token.transferFrom(sender, recipient, amount);
        require(sent, "Token transfer failed");
    }

    /** @dev Internal method for safer transfering tokens
     *   from contract to outer recipient.
     */
    function _safeTransfer(
        IERC20 token,
        address recipient,
        uint256 amount
    ) private {
        bool sent = token.transfer(recipient, amount);
        require(sent, "Token transfer failed");
    }

    function swapTokens(
        address token0,
        address token1,
        uint256 amount
    ) internal returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;
        rewardToken.approve(address(router), amount);

        uint256[] memory amountOutMin = router.getAmountsOut(amount, path);

        amounts = router.swapExactTokensForTokens(
            amount,
            amountOutMin[1],
            path,
            address(this),
            block.timestamp + 1 hours
        );
        return amounts;
    }

    function adminFeeCalculation(uint256 depositAmount)
        internal
        view
        returns (uint256)
    {
        return FullMath.mulDiv(depositAmount, adminFee, 100);
    }

    function allocation() external view override returns (uint256) {
        return buyersDeposits[msg.sender];
    }
}
