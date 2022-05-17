// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DAI is ERC20 {
    constructor() ERC20("Test Dai", "t.DAI") {
        _mint(msg.sender, 9900000000000000000000000);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function getFaucet(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
