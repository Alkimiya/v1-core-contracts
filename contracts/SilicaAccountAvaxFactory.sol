// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/silicaAccount/ISilicaAccount.sol";
import "./interfaces/silicaAccountFactory/ISilicaAccountFactory.sol";

/**
 * @notice Factory contract for Silica Account
 * @author Alkimiya Team
 */
contract SilicaAccountAvaxFactory is Ownable, ISilicaAccountFactory {
    address public masterSilica;

    using Clones for address;

    constructor(address _masterSilica) {
        require(
            _masterSilica != address(0),
            "Silica Master AVAX address cannot be zero"
        );
        masterSilica = _masterSilica;
    }

    /**
     * @notice Returns the predicted (deterministic) address of the cloned contract.
     * This method only returns the address and does not create the actual clone.
     */
    function getDeterministicAddress(
        address sellerAddress,
        address erc20TokenAddress,
        uint16 oracleType
    ) external view override returns (address) {
        bytes32 salt = keccak256(
            abi.encode(sellerAddress, erc20TokenAddress, oracleType)
        );

        address master = masterSilica;

        return master.predictDeterministicAddress(salt);
    }

    /**
     * @notice Deploys a new clone of the 'master' contract. The address is computed deterministically and returned.
     * Method should revert if same seller-address + salt pair is used more than once.
     */
    function createSilicaAccount(address erc20TokenAddress, uint16 oracleType)
        external
        override
        returns (address)
    {
        bytes32 salt = keccak256(
            abi.encode(msg.sender, erc20TokenAddress, oracleType)
        );
        address payable newContractAddress = payable(
            masterSilica.cloneDeterministic(salt)
        );
        ISilicaAccount newSilicaAccount = ISilicaAccount(newContractAddress);
        newSilicaAccount.initialize(msg.sender, erc20TokenAddress, oracleType);

        emit NewSilicaAccount(
            msg.sender,
            newContractAddress,
            erc20TokenAddress,
            oracleType
        );
        return newContractAddress;
    }
}
