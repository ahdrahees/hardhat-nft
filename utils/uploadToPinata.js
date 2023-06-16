// Timestamp 21:38:00
require("dotenv").config()
const pinataSDK = require("@pinata/sdk")
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET)

const path = require("path")
const fs = require("fs")

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath) //path.resolve() find the actual path of directory which is from "/Users/heaven/study-sol/hardhat-nft/images/randomNft .// Note: we imput imagesFilePath which is "./images/randomNft"
    const files = fs.readdirSync(fullImagesPath) // Reads the contents of the entire directory.& returns an array contain file name of contents the directory
    // console.log(fullImagesPath)
    console.log("Uploading to Pinata...")
    let responses = []
    for (fileIndex in files) {
        // console.log(`Working on ${fileIndex}...`)
        console.log(`Working on ${files[fileIndex]}`)
        // console.log(`${fullImagesPath}/${files[fileIndex]}`)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`) // `${fullImagesPath}/${files[fileIndex]}` will give each image full file path eg: - "/Users/heaven/study-sol/hardhat-nft/images/randomNft/01-POODLE.jpeg"
        const options = {
            pinataMetadata: {
                name: files[fileIndex],
            },
        }
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile, options)
            responses.push(response)
        } catch (e) {
            console.log(e)
        }
    }
    // resoponse is  CID which returned from the pinFileToIPFS()
    return { responses, files }
}

async function storeTokenUriMetadata(metadata) {
    try {
        const options = {
            pinataMetadata: {
                name: `JSON-${metadata.name}`,
            },
        } // this will set uploading file name  as JSON + metadata.name in pinata website so easy to handle
        const response = await pinata.pinJSONToIPFS(metadata, options)
        return response
    } catch (error) {
        console.log(error)
    }
}

module.exports = { storeImages, storeTokenUriMetadata }
