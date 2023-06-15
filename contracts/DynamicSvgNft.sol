// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract DynamicSvgNft is ERC721 {
    // mint
    // store svg some where
    // some logic to say show x image or show y image
    uint256 private s_tokenCounter;
    string private i_highImageURI;
    string private i_lowImageURI;
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";

    AggregatorV3Interface internal immutable i_dataFeed;

    mapping(uint256 => int256) public s_tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
        i_lowImageURI = svgToImageURI(lowSvg);
        i_highImageURI = svgToImageURI(highSvg);
        i_dataFeed = AggregatorV3Interface(priceFeedAddress);
        // 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43 BTC/USD price feed sepolia
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg)))); // abi.encodePacked() converting svg into bytes form
        // concatinating two strings
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded)); // abi.encodePacked() returns a bytes type representing the tightly packed concatenation of those arguments. //abi.encodePacked() concatenate   base64EncodedSvgPrefix, svgBase64Encoded together into bytes form. and we are type casting back into string. // the abi.encodePacked function is used to concatenate and tightly pack multiple arguments into a single byte array.
        // solidity version above 0.8.12 we can use string.concat() to concatenate srtings. alternative to abi.encodePacked()
    }

    function mintNft(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);

        emit CreatedNFT(s_tokenCounter, highValue);
        s_tokenCounter += 1;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI Query for nonexistent token");

        // prefix for json base64 is  data:application/json;base64,
        (, int256 price, , , ) = i_dataFeed.latestRoundData();
        string memory imageURI = i_lowImageURI;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }
        // for example:- when user minting this Nft he set price high price is 30000 usd for btc. if the BTC price is equal or above high price then tokenURI dynamically changes according to price of BTC. when we call tokenURI IT will show new image. if price go below high price it will change tokenURI.
        // here we created this condition for tokenURI() to return tokenURI of the NFT. this make it dynamically changing

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '","description":"An NFT that changes based on the Chainlink Feed",',
                                '"attributes":[{"trait_type":"cool emoji","value":100}],"image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}

/* tokenURI()
1. create json object 
2. json object pass it into encodePacked() which will compress and convert it into bytes
3. then we type casted it with bytes()
4. Passed these bytes into Base64 encode() which will give string of Base64 convert json
5. and we concatinate it with _baseURI(), because inorder to work  Base64 string in browsers we need specify its prefix what type of base64 is this
. without this prefix it cannot work in browser. so we have to concatinate json object base64 prefic with value.
6. we abi.encodePacked() to concatinate both these.
7. convert(decode) this bytes back into string using string()
*/
