//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @notice Silica
 * @author Alkimiya
 */

import "./interfaces/silicaAccount/ISilicaAccount.sol";
import "./interfaces/token/ISilica.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IOracleRegistry.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/UnorderedAddressSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @notice SilicaAccount contract that receives ERC20 as reward
 * And transfers ERC20.
 * @author Alkimiya Team
 */
contract SilicaAccount is ISilicaAccount, Initializable, ReentrancyGuard {
    using UnorderedAddressSetLib for UnorderedAddressSetLib.Set;
    UnorderedAddressSetLib.Set openContractSet;
    UnorderedAddressSetLib.Set runningContractSet;
    UnorderedAddressSetLib.Set defaultedContractSet;
    UnorderedAddressSetLib.Set finishedContractSet;
    UnorderedAddressSetLib.Set expiredContractSet;

    address private immutable oracleRegistryAddress;
    address public owner; // owner of this contract
    address public immutable silicaMaster;
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

    constructor(address _silicaMaster, address _oracleRegistryAddress) {
        require(
            _silicaMaster != address(0),
            "SilicaMaster cannot be zero address"
        );
        require(
            _oracleRegistryAddress != address(0),
            "Oracle address cannot be zero address"
        );

        silicaMaster = _silicaMaster;
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

    /**
     * @notice Create a new Silica contract under this account
     * @param _paymentToken the type of payment Token the new Silica accepts
     * @param _hashrate the listed hashrate in the new Silica for sale
     * @param _period the duration of the new Silica
     * @param _reservedPrice the total price of the new Silica
     * @return address the address of new Silica
     */
    function createSilicaContract(
        address _paymentToken,
        uint256 _hashrate,
        uint256 _period,
        uint256 _reservedPrice
    ) external onlyOwner canCreateNewContract nonReentrant returns (address) {
        require(_hashrate >= 5000000000, "Hashrate below minimum");
        require(_hashrate <= type(uint128).max, "Hashrate exceeds max value");
        require(_period > 0, "period has to be greater than 0");
        require(_period <= type(uint16).max, "period exceeds max value");
        require(_reservedPrice > 0, "price has to be greater than 0");

        address oracleAddr = IOracleRegistry(oracleRegistryAddress).getOracleAddress(
            address(rewardToken),
            oracleType
        );
        IOracle oracle = IOracle(oracleAddr);
        uint32 lastIndexedDay = oracle.getLastIndexedDay();
        (
            uint256 networkHashrate,
            uint256 networkReward
        ) = getNetworkRewardAndHashrate(lastIndexedDay);

        uint256 costToCreateNewContract = calculateInitialCollateralRequiredToCreateNewContract(
                _hashrate,
                networkHashrate,
                networkReward
            );

        require(
            getAvailableBalance() >= costToCreateNewContract,
            "Insufficient funds to create new Silica contract"
        );

        totalAmountLocked += costToCreateNewContract;

        address newContractAddress = Clones.clone(silicaMaster);

        registerSilica(newContractAddress);

        if (!shouldUpdate) {
            shouldUpdate = true;
            lastUpdateDay = lastIndexedDay;
        }

        ISilica silica = ISilica(payable(newContractAddress));

        silica.initialize(
            _paymentToken,
            _hashrate,
            _period,
            _reservedPrice,
            owner,
            costToCreateNewContract
        );

        emit NewSilicaContract(
            newContractAddress,
            owner,
            _paymentToken,
            _hashrate,
            _period,
            _reservedPrice,
            oracleType
        );

        return address(silica);
    }

    /**
     * @notice Override function from ISilicaAccount
     */
    function triggerUpdate() external override requiresUpdate nonReentrant {
        uint32 nextUpdateDay = lastUpdateDay + 1;
        (
            uint256 networkHashrate,
            uint256 networkReward
        ) = getNetworkRewardAndHashrate(nextUpdateDay);

        if (openContractSet.count() > 0) {
            expireOpenContracts(nextUpdateDay);
        }

        if (runningContractSet.count() > 0) {
            closeCompletedContracts(nextUpdateDay);

            if (getAvailableBalance() < getTotalAmountOwedNextUpdate()) {
                defaultAllRunningContracts(
                    nextUpdateDay,
                    networkHashrate,
                    networkReward
                );
            } else {
                progressRunningContracts(networkHashrate, networkReward);
            }
        }

        if (openContractSet.count() > 0) {
            startOpenContracts(nextUpdateDay, networkHashrate, networkReward);
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
            ISilica silica = ISilica(payable(runningContractSet.keyAtIndex(i)));
            total += silica.amountOwedNextUpdate();
        }

        return total;
    }

    /**
     * @notice Get the network hashrate and total daily reward data from Oracle
     */
    function getNetworkRewardAndHashrate(uint256 day)
        public
        view
        returns (uint256 hashrate, uint256 reward)
    {
        address oracleAddr = IOracleRegistry(oracleRegistryAddress).getOracleAddress(
            address(rewardToken),
            oracleType
        );
        IOracle oracle = IOracle(oracleAddr);

        (, , uint256 networkHashrate, uint256 networkReward, , , ) = oracle.get(
            day
        );

        return (networkHashrate, networkReward);
    }

    /**
     * @notice Get the Basis Reward Index data from Oracle
     */
    function getDailyBasisReward(uint256 day) public view returns (uint256) {
        address oracleAddr = IOracleRegistry(oracleRegistryAddress).getOracleAddress(
            address(rewardToken),
            oracleType
        );
        IOracle oracle = IOracle(oracleAddr);
        (, , uint256 hashrate, uint256 reward, , , ) = oracle.get(day);

        return calculateDailyBasisReward(reward, hashrate);
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
        return IOracle(oracleAddr).getLastIndexedDay() == lastUpdateDay;
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
            ISilica silica = ISilica(
                payable(openContractSet.keyAtIndex(uint256(i)))
            );
            (bool didExpire, uint256 amountLockedReleased) = silica
                .tryToExpireContract(nextUpdateDay);

            if (didExpire) {
                expiredContractSet.insert(address(silica));
                openContractSet.remove(address(silica));
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
            ISilica silica = ISilica(
                payable(runningContractSet.keyAtIndex(uint256(i)))
            );
            (bool didComplete, uint256 amountPaid) = silica
                .tryToCompleteContract(nextUpdateDay, excess);

            if (didComplete) {
                i--;
                runningContractSet.remove(address(silica));
                finishedContractSet.insert(address(silica));
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
        uint256 networkHashrate,
        uint256 networkReward
    ) private {
        for (int256 i = 0; i < int256(runningContractSet.count()); i++) {
            ISilica silica = ISilica(
                payable(runningContractSet.keyAtIndex(uint256(i)))
            );
            silica.defaultContract(
                nextUpdateDay,
                networkHashrate,
                networkReward
            );
            runningContractSet.remove(address(silica));
            defaultedContractSet.insert(address(silica));
            i--;
        }
    }

    /**
     * @notice Start an open contract
     * @param nextUpdateDay the next day on which the contract needs to be updated
     * @param networkHashrate the network hashrate data from Oracle
     * @param networkReward the daily total network reward data from Oracle
     */
    function startOpenContracts(
        uint32 nextUpdateDay,
        uint256 networkHashrate,
        uint256 networkReward
    ) private {
        uint256 totalAmountRefunded = 0;

        for (int256 i = 0; i < int256(openContractSet.count()); i++) {
            ISilica silica = ISilica(
                payable(openContractSet.keyAtIndex(uint256(i)))
            );
            (bool success, uint256 refundAmount) = silica.tryToStartContract(
                nextUpdateDay,
                networkHashrate,
                networkReward
            );

            if (success) {
                openContractSet.remove(address(silica));
                i--;
                runningContractSet.insert(address(silica));
                totalAmountRefunded += refundAmount;
            }
        }
        totalAmountLocked -= totalAmountRefunded;
    }

    /**
     * @notice Update state of all contracts in running status
     * @param networkHashrate the network hashrate data from Oracle
     * @param networkReward the daily total network reward data from Oracle
     */
    function progressRunningContracts(
        uint256 networkHashrate,
        uint256 networkReward
    ) private {
        uint256 totalAmountFulfilled;

        for (uint256 i = 0; i < runningContractSet.count(); i++) {
            ISilica silica = ISilica(payable(runningContractSet.keyAtIndex(i)));
            uint256 amountFulfilled = silica.fulfillUpdate(
                networkHashrate,
                networkReward
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

    /**
     * @notice return the cost to create a new Silica Contract
     * @param _hashrate the listed hashrate in the new Silica Contract
     * @param _networkHashrate network hashrate data from Oracle
     * @param _networkReward network daily total reward data from Oracle
     */
    function calculateInitialCollateralRequiredToCreateNewContract(
        uint256 _hashrate,
        uint256 _networkHashrate,
        uint256 _networkReward
    ) internal pure returns (uint256) {
        return (_hashrate * _networkReward * 105) / _networkHashrate / 100;
    }

    /**
     * @notice return the daily basis reward
     * Index of mining reward per 1 Gh/s per day.
     */
    function calculateDailyBasisReward(uint256 reward, uint256 hashrate)
        internal
        pure
        returns (uint256)
    {
        return reward / hashrate;
    }
}
