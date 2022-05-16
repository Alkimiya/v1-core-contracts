// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WAVAX is ERC20 {
    constructor() ERC20("Test Wrapped AVAX", "t.wAVAX") {
        _mint(msg.sender, 2**255 - 1);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function getFaucet(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
