// upload using NFT.STORAGE. It upload metadata and file together and return object contain {ipnft; url;}. url is the ipfs url of metadata
import { NFTStorage, File } from "nft.storage"
import mime from "mime"
import fs from "fs"
import path from "path"
require("dotenv").config()

const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY

async function storeNFT(imagePath, name, description) {
    // load the file from disk
    const fullImagesPath = path.resolve(imagePath)
    const file = fs.readdirSync(fullImagesPath)
    const responses = []
    const nftstorage = new NFTStorage({ token: NFT_STORAGE_API_KEY })

    num = 1
    for (fileIndex in file) {
        console.log(`Working on ${files[fileIndex]}`)
        const image = await fileFromPath(`${fullImagesPath}/${file[fileIndex]}`)

        // create a new NFTStorage client using our API key
        const replaceThis = `0${num}-`
        const name = file[fileIndex].replace(".jpeg", "").replace(replaceThis, "")
        const description = `An adorable ${name} puppy.`
        num++
        try {
            // call client.store, passing in the image & metadata
            const response = await nftstorage.store({
                image,
                name,
                description,
                // Currently doesn't support attributes
            })
            responses.push(response)
            // response.url is an IPFS URL of metadata
        } catch (error) {
            console.log(error)
        }
    }
    return responses
}

/**
 * A helper to read a file from a location on disk and return a File object.
 * Note that this reads the entire file into memory and should not be used for
 * very large files.
 * @param {string} filePath the path to a file to store
 * @returns {File} a File object containing the file content
 */
async function fileFromPath(filePath) {
    const content = await fs.promises.readFile(filePath)
    const type = mime.getType(filePath)
    return new File([content], path.basename(filePath), { type })
}

module.exports = {
    storeNFT,
}
