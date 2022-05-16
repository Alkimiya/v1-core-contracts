// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/**
 * @notice Silica
 * @author Alkimiya
 */

import "./interfaces/silicaAccount/ISilicaAccount.sol";
import "./interfaces/token/ISilicaAvax.sol";
import "./interfaces/IOraclePoS.sol";
import "./interfaces/IOracleRegistry.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/UnorderedAddressSet.sol";
import "./libraries/calc/AvaxRewardCalculator.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @notice SilicaAccount contract that receives ERC20 as reward
 * And transfers ERC20.
 * @author Alkimiya Team
 */
contract SilicaAccountAvax is ISilicaAccount, Initializable, ReentrancyGuard {
    using UnorderedAddressSetLib for UnorderedAddressSetLib.Set;
    UnorderedAddressSetLib.Set openContractSet;
    UnorderedAddressSetLib.Set runningContractSet;
    UnorderedAddressSetLib.Set defaultedContractSet;
    UnorderedAddressSetLib.Set finishedContractSet;
    UnorderedAddressSetLib.Set expiredContractSet;

    address private immutable oracleRegistryAddress;
    address public owner; // owner of this contract
    address public immutable avaxNativeSilicaMaster;
    uint32 public lastUpdateDay; // The last day on which this Account got update
    bool public shouldUpdate; // A flag that if this Account needs an update from Oracle
    uint16 public oracleType; // The type of the Oracle

    uint256 totalAmountLocked; // The total amount of reward that's locked in this account for the escrowing Silica contracts

    IERC20 rewardToken; // The reward token that this account receives

    mapping(address => bool) registry; // Permanent record of contracts that have been registered

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRegistered() {
        require(
            registry[msg.sender],
            "Silica contract must be registered to SilicaAccount"
        );
        _;
    }

    modifier requiresUpdate() {
        require(shouldUpdate == true, "SilicaAccount does not need to update");
        _;
    }

    modifier canCreateNewContract() {
        require(
            isUpdated() || shouldUpdate == false,
            "SilicaAccount must be updated before creating new contracts"
        );
        _;
    }

    constructor(address _avaxNativeSilicaMaster, address _oracleRegistryAddress) {
        require(
            _avaxNativeSilicaMaster != address(0),
            "AvaxNativeSilicaMaster cannot be zero address"
        );

        require(
            _oracleRegistryAddress != address(0),
            "Oracle address cannot be zero address"
        );

        avaxNativeSilicaMaster = _avaxNativeSilicaMaster;
        oracleRegistryAddress = _oracleRegistryAddress;
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function isERC20() external pure override returns (bool) {
        return true;
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function getRewardTokenAddress() external view override returns (address) {
        return address(rewardToken);
    }

    /**
     * @notice Check if a Silica contract is registered under this Account
     */
    function isRegistered(address addr) external view returns (bool) {
        return registry[addr];
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function transferRewardToBuyer(address _buyer, uint256 _amount)
        external
        override
        onlyRegistered
        nonReentrant
    {
        require(_buyer != address(0), "Cannot send reward to zero address");

        totalAmountLocked -= _amount;

        SafeERC20.safeTransfer(rewardToken, _buyer, _amount);
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function withdrawExcessReward(uint256 _amount)
        external
        override
        onlyOwner
        nonReentrant
    {
        require(
            _amount <= getAvailableBalance(),
            "Cannot withdraw more than available balance"
        );

        SafeERC20.safeTransfer(rewardToken, owner, _amount);

        emit WithdrawExcessReward(_amount);
    }

    function createSilicaAvaxContract(
        address _paymentToken,
        uint256 _price, //price per avax staked per day
        uint256 _stakedAmount,
        uint256 _period
    ) external onlyOwner canCreateNewContract nonReentrant returns (address) {
        require(_stakedAmount >= 25 * 10**18, "Cannot stake below minimum");
        require(_stakedAmount <= 720000000 * 10 ** 18, "Cannot stake above circulating supply");

        require(
            _stakedAmount <= type(uint256).max,
            "Stake amount exceeds max value"
        );
        require(_period > 0, "Period has to be greater than 0");
        require(_period <= 365, "Period exceeds max value");
        require(_price > 0, "Price has to be greater than 0");
        require(_price <= type(uint256).max, "Price cannot exceed max value");

        address oracleAddr = IOracleRegistry(oracleRegistryAddress).getOracleAddress(
            address(rewardToken),
            oracleType
        );
        IOraclePoS oraclePoS = IOraclePoS(oracleAddr);

        uint256 initCollateral = calculateInitialCollateralRequiredToCreateNewContract(
                oraclePoS,
                _stakedAmount
            );

        require(
            getAvailableBalance() >= initCollateral,
            "Insufficient funds to create new Silica contract"
        );

        totalAmountLocked += initCollateral;

        address newContractAddress = Clones.clone(avaxNativeSilicaMaster);

        registerSilica(newContractAddress);

        if (!shouldUpdate) {
            shouldUpdate = true;
            lastUpdateDay = oraclePoS.getLastIndexedDay();
        }

        ISilicaAvax(payable(newContractAddress)).initialize(
            _paymentToken,
            owner,
            _price,
            _stakedAmount,
            _period,
            initCollateral
        );

        emit NewSilicaContract(
            newContractAddress,
            owner,
            _paymentToken,
            _stakedAmount,
            _period,
            _price,
            oracleType
        );

        return newContractAddress;
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function triggerUpdate() external override requiresUpdate nonReentrant {
        uint32 nextUpdateDay = lastUpdateDay + 1;

        address oracleAddr = IOracleRegistry(oracleRegistryAddress).getOracleAddress(
            address(rewardToken),
            oracleType
        );
        IOraclePoS oraclePoS = IOraclePoS(oracleAddr);

        (
            ,
            ,
            uint256 currentSupply,
            uint256 supplyCap,
            uint256 maxStakingDuration,
            uint256 maxConsumptionRate,
            uint256 minConsumptionRate,
            uint256 mintingPeriod,
            uint256 scale,

        ) = oraclePoS.get(nextUpdateDay);

        if (openContractSet.count() > 0) {
            expireOpenContracts(nextUpdateDay);
        }

        if (runningContractSet.count() > 0) {
            closeCompletedContracts(nextUpdateDay);

            if (getAvailableBalance() < getTotalAmountOwedNextUpdate()) {
                defaultAllRunningContracts(
                    nextUpdateDay,
                    currentSupply,
                    supplyCap,
                    maxStakingDuration,
                    maxConsumptionRate,
                    minConsumptionRate,
                    mintingPeriod,
                    scale
                );
            } else {
                progressRunningContracts(
                    nextUpdateDay,
                    currentSupply,
                    supplyCap,
                    maxStakingDuration,
                    maxConsumptionRate,
                    minConsumptionRate,
                    mintingPeriod,
                    scale
                );
            }
        }

        if (openContractSet.count() > 0) {
            startOpenContracts(
                nextUpdateDay,
                currentSupply,
                supplyCap,
                maxStakingDuration,
                maxConsumptionRate,
                minConsumptionRate,
                mintingPeriod,
                scale
            );
        }

        if (openContractSet.count() == 0 && runningContractSet.count() == 0) {
            shouldUpdate = false;
        }
        lastUpdateDay = nextUpdateDay;

        emit SilicaAccountUpdate(msg.sender, nextUpdateDay);
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function getBalance() public view override returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function getAvailableBalance() public view override returns (uint256) {
        return rewardToken.balanceOf(address(this)) - getTotalAmountLocked();
    }

    /**
     * @notice Return the total amount of reward locked in this account
     */
    function getTotalAmountLocked() public view returns (uint256) {
        return totalAmountLocked;
    }

    /**
     * @notice Return the total amount of reward due for next update in this account
     */
    function getTotalAmountOwedNextUpdate() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < runningContractSet.count(); i++) {
            ISilicaAvax silicaAvax = ISilicaAvax(
                payable(runningContractSet.keyAtIndex(i))
            );
            total += silicaAvax.amountOwedNextUpdate();
        }

        return total;
    }

    /**
     * @notice Get the next update day
     */
    function getNextUpdateDay() public view override returns (uint256) {
        return lastUpdateDay + 1;
    }

    /**
     * @notice Return if the account is in sync with the Oracle
     */
    function isUpdated() public view returns (bool) {
        address oracleAddr = IOracleRegistry(oracleRegistryAddress).getOracleAddress(
            address(rewardToken),
            oracleType
        );
        return IOraclePoS(oracleAddr).getLastIndexedDay() == lastUpdateDay;
    }

    /**
     * @notice Get all the registed Silica contracts
     */
    function getAllContracts()
        public
        view
        returns (
            address[] memory,
            address[] memory,
            address[] memory,
            address[] memory,
            address[] memory
        )
    {
        return (
            openContractSet.keyList,
            runningContractSet.keyList,
            defaultedContractSet.keyList,
            finishedContractSet.keyList,
            expiredContractSet.keyList
        );
    }

    function initialize(
        address _owner,
        address _rewardTokenAddress,
        uint16 _oracleType
    ) public override initializer {
        require(
            _owner != address(0),
            "Owner of SilicaAccount cannot be zero address"
        );
        require(
            _rewardTokenAddress != address(0),
            "RewardTokenAddress cannot be zero address"
        );
        owner = _owner;
        rewardToken = IERC20(_rewardTokenAddress);
        oracleType = _oracleType;
    }

    /**
     * @dev Set open contracts expired if they are out of open window
     */
    function expireOpenContracts(uint32 nextUpdateDay) private {
        uint256 totalAmountLockedReleased;
        for (int256 i = 0; i < int256(openContractSet.count()); i++) {
            ISilicaAvax silicaAvax = ISilicaAvax(
                payable(openContractSet.keyAtIndex(uint256(i)))
            );
            (bool didExpire, uint256 amountLockedReleased) = silicaAvax
                .tryToExpireContract(nextUpdateDay);

            if (didExpire) {
                expiredContractSet.insert(address(silicaAvax));
                openContractSet.remove(address(silicaAvax));
                i--;
            }
            totalAmountLockedReleased += amountLockedReleased;
        }

        totalAmountLocked -= totalAmountLockedReleased;
    }

    /**
     * @dev Close the completed Silica contracts
     */
    function closeCompletedContracts(uint32 nextUpdateDay) private {
        uint256 excess = getAvailableBalance();

        uint256 additionalAmountLocked = 0;
        for (int256 i = 0; i < int256(runningContractSet.count()); i++) {
            ISilicaAvax silicaAvax = ISilicaAvax(
                payable(runningContractSet.keyAtIndex(uint256(i)))
            );
            (bool didComplete, uint256 amountPaid) = silicaAvax
                .tryToCompleteContract(nextUpdateDay, excess);

            if (didComplete) {
                i--;
                runningContractSet.remove(address(silicaAvax));
                finishedContractSet.insert(address(silicaAvax));
                excess -= amountPaid;
                additionalAmountLocked += amountPaid; // amountDueNextUpdate + amountPayedToFinishContract = amountDueAtContractEnd
            }
        }

        totalAmountLocked += additionalAmountLocked;
    }

    /**
     * @dev Set all the running contracts under this account to default
     */
    function defaultAllRunningContracts(
        uint32 nextUpdateDay,
        uint256 currentSupply,
        uint256 supplyCap,
        uint256 maxStakingDuration,
        uint256 maxConsumptionRate,
        uint256 minConsumptionRate,
        uint256 mintingPeriod,
        uint256 scale
    ) private {
        for (int256 i = 0; i < int256(runningContractSet.count()); i++) {
            ISilicaAvax silicaAvax = ISilicaAvax(
                payable(runningContractSet.keyAtIndex(uint256(i)))
            );
            silicaAvax.defaultContract(
                nextUpdateDay,
                currentSupply,
                supplyCap,
                maxStakingDuration,
                maxConsumptionRate,
                minConsumptionRate,
                mintingPeriod,
                scale
            );
            runningContractSet.remove(address(silicaAvax));
            defaultedContractSet.insert(address(silicaAvax));
            i--;
        }
    }

    // /**
    //  * @notice Start an open contract
    //  * @param nextUpdateDay the next day on which the contract needs to be updated
    //  * @param networkHashrate the network hashrate data from Oracle
    //  * @param networkReward the daily total network reward data from Oracle
    //  */
    function startOpenContracts(
        uint32 _nextUpdateDay,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale
    ) private {
        uint256 totalAmountRefunded = 0;

        for (int256 i = 0; i < int256(openContractSet.count()); i++) {
            ISilicaAvax silicaAvax = ISilicaAvax(
                payable(openContractSet.keyAtIndex(uint256(i)))
            );
            (bool success, uint256 refundAmount) = silicaAvax
                .tryToStartContract(
                    _nextUpdateDay,
                    _currentSupply,
                    _supplyCap,
                    _maxStakingDuration,
                    _maxConsumptionRate,
                    _minConsumptionRate,
                    _mintingPeriod,
                    _scale
                );

            if (success) {
                openContractSet.remove(address(silicaAvax));
                i--;
                runningContractSet.insert(address(silicaAvax));
                totalAmountRefunded += refundAmount;
            }
        }
        totalAmountLocked -= totalAmountRefunded;
    }

    // /**
    //  * @notice Update state of all contracts in running status
    //  * @param networkHashrate the network hashrate data from Oracle
    //  * @param networkReward the daily total network reward data from Oracle
    //  */
    function progressRunningContracts(
        uint256 _nextUpdateDay,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale
    ) private {
        uint256 totalAmountFulfilled;

        for (uint256 i = 0; i < runningContractSet.count(); i++) {
            ISilicaAvax silicaAvax = ISilicaAvax(
                payable(runningContractSet.keyAtIndex(i))
            );

            uint256 amountFulfilled = silicaAvax.fulfillUpdate(
                _nextUpdateDay,
                _currentSupply,
                _supplyCap,
                _maxStakingDuration,
                _maxConsumptionRate,
                _minConsumptionRate,
                _mintingPeriod,
                _scale
            );
            totalAmountFulfilled += amountFulfilled;
        }
        totalAmountLocked += totalAmountFulfilled;
    }

    /**
     * @notice Register a new Silica contracts to the registry
     */
    function registerSilica(address _contractAddress) private onlyOwner {
        require(!registry[_contractAddress], "Silica already registered");
        registry[_contractAddress] = true;
        openContractSet.insert(_contractAddress);
    }

    // /**
    //  * @notice return the cost to create a new Silica Contract
    //  * @param _hashrate the listed hashrate in the new Silica Contract
    //  * @param _networkHashrate network hashrate data from Oracle
    //  * @param _networkReward network daily total reward data from Oracle
    //  */
    function calculateInitialCollateralRequiredToCreateNewContract(
        IOraclePoS oraclePoS,
        uint256 stakedAmount
    ) internal view returns (uint256) {
        uint32 lastIndexedDay = oraclePoS.getLastIndexedDay();
        (
            ,
            ,
            uint256 currentSupply,
            uint256 supplyCap,
            uint256 maxStakingDuration,
            uint256 maxConsumptionRate,
            uint256 minConsumptionRate,
            uint256 mintingPeriod,
            uint256 scale,

        ) = oraclePoS.get(lastIndexedDay);

        return ((105 *
            AvaxRewardCalculator.calculateRewardDueNextUpdate(
                1,
                stakedAmount,
                currentSupply,
                supplyCap,
                maxStakingDuration,
                maxConsumptionRate,
                minConsumptionRate,
                mintingPeriod,
                scale
            )) / 100);
    }
}
