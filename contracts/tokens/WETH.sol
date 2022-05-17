// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappedETH is ERC20 {
    constructor() ERC20("Test Wrapped ETH", "t.wETH") {
        _mint(msg.sender, 100000000000000000000000);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function getFaucet(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
