const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft"
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2")
let tokenUris = [
    "ipfs://QmRx8EwpCEYfq6sQ9by5D6shLHRBfMovPurP9v7rtHUgYv/",
    "ipfs://QmPvmyYFJFGJP4CiWi3DxPSUQbdJVxaTkGEKRRCfvdrXx3/",
    "ipfs://QmYLH53K5JaW8qHJoi1QXw1QQVhfMyU1tkP23zzsfnQRyX/",
]

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
    let vrfCoordinatorV2Mock

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
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

    args = [vrfCoordinatorV2Address, subscriptionId, keyHash, callbackGasLimit, tokenUris, mintFee]
    log("________________________________________________________________")

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address)
        console.log("Consumer is added")
    }

    if (!developmentChains.includes(network.name)) {
        log("Verifying Contract ...")
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
        replaceThis = `0${num}-` // Using template literals to concatenate into 01- , 02- , 03-
        // replaceThis = "0" + num + "-"    // Using concatenation operator (+): to concatenate into 01-

        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex]
            .replace(".jpeg", "")
            .replace(replaceThis, "") // now name will be POODLE or DALMATIAN or PARIAH

        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} puppy.`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}/`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        num++

        // store json to pinata / ipfs
        const metadataUpladedResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUpladedResponse.IpfsHash}/`)
    }
    console.log("Token URIs Uploaded! They are:", tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "randomIpfs", "main"]
