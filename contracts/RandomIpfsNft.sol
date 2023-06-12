// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
// we request to get random word from VRFCoordinatorV2 to our contract by calling requestNft() ( which is requestRandomWords()). that why we are using interface  of VRF Coordinator V2 and its contract Address passing constructor we can interact with the contract from our contract RandomIpfsNft
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NotEnoughEthSendMore();
error RandomIpfsNft__FailedToWithdrawEth();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, ConfirmedOwner {
    // when we mint a Nft, we will trigger a chainlink VRF call to get us a random number
    // using that number we will get a random Nft
    // POODLE, DALMATIAN, PARIAH

    // users have to pay to mint a nft
    // the owner of the contract can withdraw the ETH

    // Type declaration
    enum Breed {
        POODLE,
        DALMATIAN,
        PARIAH
    }

    // Chainlink VRF variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash; // AKA i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT variables
    uint256 private s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenURIs;
    uint256 private immutable i_mintFee;

    // Events
    event NftRequest(uint256 indexed requestId, address indexed requester);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        string[3] memory dogTokenURIs,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random NFT", "RAN") ConfirmedOwner(msg.sender) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
        s_tokenCounter = 0;
        s_dogTokenURIs = dogTokenURIs;
        i_mintFee = mintFee;
    }

    // requestRandomWords
    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NotEnoughEthSendMore();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequest(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address nftOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE; // get number between 0-99
        // 7 -> POODLE
        // 88 -> PARIAH
        // 15 -> DALMATIAN
        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(nftOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenURIs[uint256(dogBreed)]); // uint256(dogBreed) value will be 0 if it is POODLE or 1 if it is  DALMATIAN 0r 3 if PARIAH. // casting it back into uint256

        s_tokenCounter = s_tokenCounter + 1;
        emit NftMinted(dogBreed, nftOwner);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        // require(success, "Failed to withdraw Ether");
        if (!success) {
            revert RandomIpfsNft__FailedToWithdrawEth(); // gas efficient
        }
    }

    // This function give  which tokenUri index( which is the dogbreed) we are going to use based on the rarity of the nft and  moddedRng
    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            // here setting boundary condition for each breed moddedRng b/w 0-10, 11-30, 31-99
            if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum = chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds(); // if some reason we dont return anything just revert
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE]; // 10 % super rare POODLE, 40% (10+30) rare DALMATIAN, 60% common PARIAH
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenURIs(uint256 index) public view returns (string memory) {
        return s_dogTokenURIs[index];
    }
    // ERC721.sol can only store signel URI so we are using extension of that  contract which is ERC721URIStorage which can store multiple URIs
    // ERC721URIStorage has dedicated mapping tokenId to tokenURI, therefore each tokenId has different URIs
}
