const { network, ethers } = require("hardhat")
const { developmentChains, DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const _BASEFEE = ethers.utils.parseEther("0.25") // 0.25 Link for each randomWord request
    const _GASPRICELINK = 1000000000 // 1000000000 wei = 1 gwei
    const args = [_BASEFEE, _GASPRICELINK]
    if (developmentChains.includes(network.name)) {
        log("\nLocal network is detected! Deploying mocks....")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: args,
            log: true,
        })
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER],
            log: true,
        })
        log("___________________________Mock_deployed______________________")
    }
}

module.exports.tags = ["all", "mocks"]
