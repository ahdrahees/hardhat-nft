// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

pragma solidity 0.8.18;

contract BasicNft is ERC721 {
    uint256 private s_tokenCounter;
    // constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {} // Or we can directly pass args
    constructor() ERC721("Rindappan","RIN"){
        s_tokenCounter = 0;
    };

    function mintNft()public returns(uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter +1;
        return s_tokenCounter;
    };
    function getTokenCounter() public view  returns (uint256) {
        return s_tokenCounter;
    }
};
