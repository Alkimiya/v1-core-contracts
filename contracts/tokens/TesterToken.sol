// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TesterToken is ERC20 {
    uint8 public customDecimals;

    constructor(uint8 _decimals) ERC20("TesterToken", "TesterToken") {
        _mint(
            msg.sender,
            115792089237316195423570985008687907853269984665640564039457584007913129639935
        );
        customDecimals = _decimals;
    }

    function decimals() public view virtual override returns (uint8) {
        return customDecimals;
    }
}
