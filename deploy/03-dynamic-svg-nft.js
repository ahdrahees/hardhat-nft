const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const chainId = network.config.chainId
    let btcUsdPriceFeedAddress

    log("________________________________________________________________")

    if (developmentChains.includes(network.name)) {
        const btcUsdAggregator = await ethers.getContract("MockV3Aggregator")
        btcUsdPriceFeedAddress = btcUsdAggregator.address
    } else {
        btcUsdPriceFeedAddress = networkConfig[chainId].btcUsdPriceFeed
    }

    const lowSvg = await fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf-8" })
    const highSvg = await fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf-8" })

    const args = [btcUsdPriceFeedAddress, lowSvg, highSvg]

    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name)) {
        log("Verifying Contract ...")
        await verify(dynamicSvgNft.address, args)
        log("______________________________Verified_______________________________")
    }
}

module.exports.tags = ["all", "dynamicsvg", "main"]
