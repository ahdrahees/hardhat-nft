// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DynamicSvgNft is ERC721 {
    // mint
    // store svg some where
    // some logic to say show x image or show y image
    uint256 private s_tokenCounter;

    constructor() ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
    }
}
