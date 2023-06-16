const { ethers } = require("hardhat")

const developmentChains = ["hardhat", "localhost", "ganache"]

const networkConfig = {
    31337: {
        name: "hardhat", // or local host
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000",
        mintFee: ethers.utils.parseEther("0.1"),
    },
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        subscriptionId: "1036",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei Key Hash
        callbackGasLimit: "500000",
        mintFee: ethers.utils.parseEther("0.1"),
        btcUsdPriceFeed: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    },
    137: {
        name: "polygon",
        vrfCoordinatorV2: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
        // subscriptionId: "",
        keyHash: "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93", // 200 gwei Key Hash
        callbackGasLimit: "500000",
        mintFee: ethers.utils.parseEther("1"),
        btcUsdPriceFeed: "0xc907E116054Ad103354f2D350FD2514433D57F6f",
    },
    1: {
        name: "mainnet",
        vrfCoordinatorV2: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
        // subscriptionId: "",
        keyHash: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef", // 200 gwei Key Hash
        callbackGasLimit: "500000",
        mintFee: ethers.utils.parseEther("0.01"),
        btcUsdPriceFeed: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    },
}

const DECIMALS = 18
const INITIAL_ANSWER = ethers.utils.parseEther("30000") // BTC/USD price

module.exports = {
    developmentChains,
    networkConfig,
    DECIMALS,
    INITIAL_ANSWER,
}
