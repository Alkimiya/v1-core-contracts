// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./interfaces/token/ISilica.sol";
import "./interfaces/silicaAccount/ISilicaAccount.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/mint/SilicaMinter.sol";
import "./libraries/calc/MinerDefaultCalcs.sol";
import "./libraries/calc/BuyerRedeemCalcs.sol";
import "./libraries/calc/BuyerDefaultCalcs.sol";

/**
 * @title implementation of the Silica swap contract as a ERC20 token
 * @author Alkimiya team
 */
contract Silica is ERC20, Initializable, ISilica {
    //Contract Constants
    uint128 internal constant FIXED_POINT_SCALE_VALUE = 10**14;
    uint128 internal constant FIXED_POINT_BASE = 10**6;
    uint32 internal constant HAIRCUT_BASE_PCT = 80;
    uint32 internal constant SECONDS_PER_DAY = 24 * 60 * 60;
    uint8 internal constant CONTRACT_EXPIRE_DAYS = 2;

    uint128 public hashrate; // Hashrate listed in the contract for sale
    uint16 public contractPeriod; // The duration of the contract
    uint32 public deployTime; // The timestamp when the contract is deployed on network

    uint256 public reservedPrice; // The listed price for the contract

    uint256 public override amountLocked; //Amount locked up by contract
    uint256 public override amountDueAtContractEnd; //The reward due when the contract ends
    uint256 public override amountOwedNextUpdate; // The reward due for the next update
    uint256 public totalSold; // total hashrate sold
    uint256 public totalPayment; //total paid for this contract on start

    uint32 public startDay; // The starting date of this Silica contract
    uint32 public endDay; // The ending date of this Silica contract

    address public seller; // Seller address
    IERC20 public paymentToken; // The payment token accepted in this contract

    ISilicaAccount public silicaAccount; // The Silica account this contract belongs to

    //flags
    bool public isMinerDefaultPayoutComplete;

    enum Status {
        Open,
        Running,
        Expired,
        Defaulted,
        Finished
    }

    Status public status;

    modifier onlyTokenHolders() {
        require(balanceOf(msg.sender) > 0, "Not a buyer");
        _;
    }

    modifier onlySeller() {
        require(seller == msg.sender, "Only miner can call this function");
        _;
    }

    modifier onlySilicaAccount() {
        require(
            address(silicaAccount) == msg.sender,
            "Only SilicaAccount can call this function"
        );
        _;
    }

    constructor() ERC20("Silica", "SLC") {}

    function initialize(
        address _paymentToken,
        uint256 _hashrate,
        uint256 _contractPeriod,
        uint256 _reservedPrice,
        address _seller,
        uint256 _amountLockedOnCreate
    ) external override initializer {
        require(
            _paymentToken != address(0),
            "payment token address cannot be zero address"
        );
        require(_seller != address(0), "seller address cannot be zero address");

        paymentToken = IERC20(_paymentToken);
        contractPeriod = uint16(_contractPeriod);
        hashrate = uint128(_hashrate);
        reservedPrice = _reservedPrice;
        deployTime = uint32(block.timestamp);
        seller = payable(_seller);
        silicaAccount = ISilicaAccount(msg.sender);
        amountLocked = _amountLockedOnCreate;

        emit StatusChange(0);
    }

    /**
     * @notice Processes a buyer's bid to purchase `purchaseAmount` worth of hashrate.
     * If successful, Silica is minted and transferred to buyer.
     * @dev confirms the buyer's payment, mint the Silicas and transfer the tokens.
     */
    function deposit(uint256 purchaseAmount) external {
        require(purchaseAmount > 0, "Value not permitted");
        require(status == Status.Open, "Cannot bid this contract");
        require(
            totalPayment + purchaseAmount <= reservedPrice,
            "Not enough Silica"
        );

        uint256 mintAmount = SilicaMinter.calculateMintAmount(
            hashrate,
            purchaseAmount,
            reservedPrice
        );

        totalPayment += purchaseAmount;
        _mint(msg.sender, mintAmount);

        SafeERC20.safeTransferFrom(
            paymentToken,
            msg.sender,
            address(this),
            purchaseAmount
        );

        emit BidConfirmed(
            msg.sender,
            purchaseAmount,
            mintAmount,
            block.timestamp
        );
    }

    /**
     * @notice Transfer all rewards to miner from contract completion
     * @dev calculates the redeem for miner
     */
    function minerRedeem() external onlySeller returns (uint256) {
        require(
            status == Status.Finished,
            "Only finished contracts can be redeemed"
        );

        emit SellerRedeem(msg.sender, totalPayment);

        SafeERC20.safeTransfer(
            paymentToken,
            seller,
            paymentToken.balanceOf(address(this))
        );

        return totalPayment;
    }

    /**
     * @notice Buyer redeems the portion of their reward from the contract
     * when contract is completed.
     */
    function buyerRedeem() external onlyTokenHolders returns (uint256) {
        require(
            status == Status.Finished,
            "Only finished contracts can be redeemed"
        );

        uint256 tokenBalance = balanceOf(msg.sender);

        uint256 rewardAmountToBuyer = BuyerRedeemCalcs.getBuyerRedeem(
            tokenBalance,
            amountDueAtContractEnd,
            totalSold
        );

        amountLocked -= rewardAmountToBuyer;

        _burn(msg.sender, tokenBalance);

        emit BuyerRedeem(msg.sender, rewardAmountToBuyer, tokenBalance);

        silicaAccount.transferRewardToBuyer(msg.sender, rewardAmountToBuyer);

        return rewardAmountToBuyer;
    }

    /**
     * @notice Buyer calls to redeem from a defaulted contract
     */
    function buyerRedeemDefault()
        external
        onlyTokenHolders
        returns (uint256 tokensBurned, uint256 redeemedAmount)
    {
        require(status == Status.Defaulted, "Not in default");

        uint256 tokenBalance = balanceOf(msg.sender);

        uint256 haircut = calculateHaircut(endDay - startDay);

        uint256 rewardAmountToBuyer = BuyerDefaultCalcs
            .getRewardToBuyerOnBuyerDefault(
                tokenBalance,
                amountDueAtContractEnd,
                totalSold
            );

        uint256 paymentTokenToBuyer = BuyerDefaultCalcs
            .getBuyerPaymentTokenReturn(
                tokenBalance,
                totalPayment,
                totalSold,
                haircut
            );

        _burn(msg.sender, tokenBalance);
        amountLocked -= rewardAmountToBuyer;

        emit BuyerDefault(msg.sender, paymentTokenToBuyer, rewardAmountToBuyer);

        silicaAccount.transferRewardToBuyer(msg.sender, rewardAmountToBuyer);

        SafeERC20.safeTransfer(paymentToken, msg.sender, paymentTokenToBuyer);
        return (tokenBalance, rewardAmountToBuyer);
    }

    /**
     * @notice Seller calls to redeem from a defaulted contract
     */
    function sellerRedeemDefault()
        external
        onlySeller
        returns (uint256 redeemedAmount)
    {
        require(status == Status.Defaulted, "Not in default call");
        require(
            !isMinerDefaultPayoutComplete,
            "Miner cashed out from defaulting"
        );

        uint256 haircut = calculateHaircut(endDay - startDay);

        uint256 totalPaymentMiner = MinerDefaultCalcs
            .getRewardToMinerOnBuyerDefault(totalPayment, haircut);

        isMinerDefaultPayoutComplete = true;

        emit SellerDefault(msg.sender, totalPaymentMiner);

        SafeERC20.safeTransfer(paymentToken, seller, totalPaymentMiner);
        return totalPaymentMiner;
    }

    /**
     * @notice Override tryToExpireContract from ISilicaFunctions
     */
    function tryToExpireContract(uint32 day)
        external
        override
        onlySilicaAccount
        returns (bool, uint256)
    {
        require(
            status == Status.Open,
            "Silica - Tried to expire non-Open contract."
        );

        uint256 amountReleased = 0;
        bool isExpired = false;
        if (totalSupply() == 0) {
            if (day >= deployTime / SECONDS_PER_DAY + CONTRACT_EXPIRE_DAYS) {
                amountReleased = amountLocked;
                isExpired = true;
                amountLocked = 0;
                status = Status.Expired;

                emit StatusChange(2);
            }
        }

        return (isExpired, amountReleased);
    }

    /**
     * @notice Override tryToCompleteContract from ISilicaFunctions
     */
    function tryToCompleteContract(uint32 day, uint256 remainingExcess)
        external
        override
        onlySilicaAccount
        returns (bool, uint256)
    {
        require(
            status == Status.Running,
            "Silica - complete to expire non-Running contract"
        );

        if (endDay == day) {
            if (remainingExcess >= amountOwedNextUpdate) {
                uint256 amountOwedNextUpdateCopy = amountOwedNextUpdate;
                amountLocked += amountOwedNextUpdate;
                amountDueAtContractEnd = amountLocked;
                amountOwedNextUpdate = 0;
                status = Status.Finished;
                emit StatusChange(4);

                return (true, amountOwedNextUpdateCopy);
            }
        }
        return (false, 0);
    }

    /**
     * @notice Override fulfillUpdate from ISilicaFunctions
     */
    function fulfillUpdate(uint256 _networkHashrate, uint256 _networkReward)
        external
        override
        onlySilicaAccount
        returns (uint256)
    {
        require(
            status == Status.Running,
            "Silica - cannot progress non-running contracts"
        );

        uint256 amountFulfilled = amountOwedNextUpdate;
        amountLocked = amountLocked + amountFulfilled;
        amountOwedNextUpdate = (_networkReward * totalSold) / _networkHashrate;

        return amountFulfilled;
    }

    /**
     * @notice Override tryToStartContract from ISilicaFunctions
     * A contract should stay open or transition to running after created
     */
    function tryToStartContract(
        uint32 day,
        uint256 _networkHashrate,
        uint256 _networkReward
    ) external override onlySilicaAccount returns (bool, uint256) {
        require(
            status == Status.Open,
            "Silica - cannot start non-Open contract"
        );

        bool didTransition = false;
        uint256 refundAmount = 0;

        if (totalSupply() > 0) {
            if (
                day > deployTime / SECONDS_PER_DAY || 
                totalSupply() >= hashrate - hashrate / 100
            ) {
                startDay = day;
                endDay = day + uint32(contractPeriod);

                // This is the amount due today
                uint256 amountDueToday = (totalSupply() * _networkReward) /
                    _networkHashrate;

                if (amountDueToday < amountLocked) {
                    refundAmount = amountLocked - amountDueToday;
                } else {
                    refundAmount = 0;
                    amountOwedNextUpdate = amountDueToday - amountLocked;
                }

                amountLocked = amountLocked - refundAmount;

                totalSold = totalSupply();

                status = Status.Running;
                emit StatusChange(1);

                didTransition = true;
            }
        }

        return (didTransition, refundAmount);
    }

    /**
     * @notice Override defaultContract from ISilicaFunctions
     */
    function defaultContract(
        uint32 day,
        uint256 _networkHashrate,
        uint256 _networkReward
    ) external override onlySilicaAccount {
        require(status == Status.Running, "Cannot default non-active contract");
        status = Status.Defaulted;
        endDay = day;

        amountDueAtContractEnd = amountLocked;
        amountOwedNextUpdate = 0;

        emit StatusChange(3);
    }

    function decimals() public view virtual override returns (uint8) {
        return 9;
    }

    /**
     * @notice Returns haircut in fixed-point (base = 100000000 = 1).
     * @dev Granting 6 decimals precision. 1 - (0.8) * ((day - 1)/contract)^3
     */
    function calculateHaircut(uint256 day) public view returns (uint256) {
        uint256 contractPeriodCubed = uint256(contractPeriod)**3;
        uint256 multiplier = (((day - 1)**3) * FIXED_POINT_SCALE_VALUE) /
            (contractPeriodCubed);
        uint256 result = (FullMath.mulDiv(HAIRCUT_BASE_PCT, multiplier, 100)) /
            FIXED_POINT_BASE;
        return (FIXED_POINT_BASE * 100) - result;
    }
}
