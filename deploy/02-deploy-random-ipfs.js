const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages } = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft"
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2")

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            valu: 100,
        },
    ],
}

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const chainId = network.config.chainId
    let subscriptionId, vrfCoordinatorV2Address

    let tokenUris
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        // create subscription
        const txResponse = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId

        // fund subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
        // console.log(subscriptionId.toString())
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"] // chainId is vairable, vrfCoordinatorV2 is the object property
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const keyHash = networkConfig[chainId]["keyHash"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const mintFee = networkConfig[chainId]["mintFee"]

    // args = [
    //     vrfCoordinatorV2Address,
    //     subscriptionId,
    //     keyHash,
    //     callbackGasLimit,
    //     // dogTokenURIs,
    //     mintFee,
    // ]
    // log("________________________________________________________________")
    // const randomIpfsNft = await deploy("RandomIpfsNft", {
    //     from: deployer,
    //     args: args,
    //     log: true,
    //     waitConfirmations: network.config.blockConfirmations || 1,
    // })

    if (!developmentChains.includes(network.name)) {
        log("Verifying")
        await verify(randomIpfsNft.address, args)
        log("______________________________Verified_______________________________")
    }
}

async function handleTokenUris() {
    tokenUris = []
    // storeimages in ipfs
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    // store metadata in ipfs
    num = 1
    for (imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".jpeg", "")

        replaceThis = "0" + num.toString() + "-"
        console.log(replaceThis)
        num++
    }

    return tokenUris
}

module.exports.tags = ["all", "randomIpfs", "main"]
