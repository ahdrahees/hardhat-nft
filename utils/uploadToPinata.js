// Timestamp 21:38:00
require("dotenv").config()
const pinataSDK = require("@pinata/sdk")
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET)

const path = require("path")
const fs = require("fs")

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath) // this will give the path (eg:- a/f/b.js ) of the file we input
    const files = fs.readdirSync(fullImagesPath) // read entire directory
    console.log("Uploading to Pinata...")
    let responses = []
    for (fileIndex in files) {
        // console.log(`Working on ${fileIndex}...`)
        console.log(`Working on ${files[fileIndex]}`)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
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
