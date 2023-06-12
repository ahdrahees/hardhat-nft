// fullfill random words

const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip()
    : describe("RandomIpfsNft unit test", function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock, chainId, mintFee
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer // it is similar to this, const { deployer } = await getNamedAccounts() , but there is a difference here deployer declared in globaly as a variable (not as const)
              await deployments.fixture(["mocks", "randomIpfs"]) // fixture run our files contain "mocks" and "randomIpfs" tags. this will deploy both mock and RandomIpfsNft
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)

              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              chainId = network.config.chainId
              mintFee = await randomIpfsNft.getMintFee() // it should be on the beforeEach otherwise cause problem when we individualy run test by --grep
          })

          describe("constructor", function () {
              it("initilize the randomIpfsNft contract correctly", async function () {
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  mintFee = await randomIpfsNft.getMintFee()

                  assert.equal(tokenCounter.toString(), "0")
                  assert.equal(mintFee.toString(), networkConfig[chainId].mintFee)
              })
          })

          describe("requestNft", function () {
              it("reverts if you didn't pay mint fee", async function () {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NotEnoughEthSendMore"
                  )
              })
              it("reverts if you pay less than mint fee", async function () {
                  await expect(
                      randomIpfsNft.requestNft({ value: ethers.utils.parseEther("0.000001") })
                  ).to.be.revertedWith("RandomIpfsNft__NotEnoughEthSendMore")
              })

              it("it record the requestId and the minter address", async function () {
                  const txResponse = await randomIpfsNft.requestNft({ value: mintFee })
                  const txReceipt = await txResponse.wait(1)
                  //   NftRequest(uint256 indexed requestId, address indexed requester);
                  const requestId = txReceipt.events[1].args.requestId
                  const requester = txReceipt.events[1].args.requester

                  assert(requestId.toNumber() > 0)
                  assert.equal(requester, deployer)
              })

              it("emits an event on requesting Nft", async function () {
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequest"
                  )
              })
          })
          describe("fulfillRandomWords", function () {
              let tokenUris = [
                  "ipfs://QmRx8EwpCEYfq6sQ9by5D6shLHRBfMovPurP9v7rtHUgYv/",
                  "ipfs://QmPvmyYFJFGJP4CiWi3DxPSUQbdJVxaTkGEKRRCfvdrXx3/",
                  "ipfs://QmYLH53K5JaW8qHJoi1QXw1QQVhfMyU1tkP23zzsfnQRyX/",
              ]
              let requestId, tokenCounter
              beforeEach(async function () {
                  const txResponse = await randomIpfsNft.requestNft({ value: mintFee })
                  const txReceipt = await txResponse.wait(1)
                  requestId = txReceipt.events[1].args.requestId

                  tokenCounter = await randomIpfsNft.getTokenCounter()
              })
              it("mint a NFT after randomWords is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          console.log("Found the event!")
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI(tokenCounter)
                              //   const tokenUri = await randomIpfsNft.tokenURI("0")
                              assert(tokenUris.includes(tokenUri))

                              const newTokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenCounter.toNumber() + 1, newTokenCounter.toNumber())
                              //   assert.equal(newTokenCounter.sub(tokenCounter), 1)

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      try {
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestId,
                              randomIpfsNft.address
                          )
                      } catch (error) {
                          console.log(error)
                      }
                  })
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  const txResponse = await randomIpfsNft.requestNft({ value: mintFee })
                  const txReceipt = await txResponse.wait(1)
                  requestId = txReceipt.events[1].args.requestId
                  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
              })
              it("only allow the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await ethers.getContract(
                      "RandomIpfsNft",
                      attacker
                  )

                  await expect(attackerConnectedContract.withdraw()).to.be.reverted
              })
              it("allows the owner to withdraw balance of the contract", async function () {
                  const balanceOfContractBeforeWithdraw = await ethers.provider.getBalance(
                      randomIpfsNft.address
                  )
                  const balanceOfOwnerBeforeWithdraw = await ethers.provider.getBalance(deployer)
                  const txResponse = await randomIpfsNft.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // mul() is used to multiply two bignumber
                  const balanceOfContractAfterWithdraw = await ethers.provider.getBalance(
                      randomIpfsNft.address
                  )
                  const balanceOfOwnerAfterWithdraw = await ethers.provider.getBalance(deployer)

                  assert.equal(balanceOfContractAfterWithdraw.toString(), "0")
                  assert.equal(
                      balanceOfOwnerAfterWithdraw
                          .add(gasCost)
                          .sub(balanceOfOwnerBeforeWithdraw)
                          .toString(),
                      balanceOfContractBeforeWithdraw.toString()
                  )
              })
              it("call{} Failed to send Ether", async function () {
                  const withdrawTx = await randomIpfsNft.withdraw()
                  // Check if the transaction was successful
                  expect(withdrawTx)
                      .to.emit(randomIpfsNft, "RandomIpfsNft__FailedToWithdrawEth")
                      .withArgs()
              })
          })

          describe("getBreedFromModdedRng", function () {
              it("reverts when call without passing the value", async function () {
                  await expect(randomIpfsNft.getBreedFromModdedRng()).to.be.reverted
              })
              it("reverts when the range 0 to 99 out Of bounds, should revert if moddedRng > 99", async function () {
                  await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds"
                  )
              })
              it("returns 0 for POODLE if the argument range is between 0 to 10", async function () {
                  const breedIndex = await randomIpfsNft.getBreedFromModdedRng(4)
                  //   console.log(breedIndex)
                  assert.equal(breedIndex.toString(), "0")
              })
              it("returns 1 for DALMATIAN if the argument range is between 11 to 30", async function () {
                  const breedIndex = await randomIpfsNft.getBreedFromModdedRng(11)
                  //   console.log(breedIndex)
                  assert.equal(breedIndex.toString(), "1")
              })
              it("returns 2 for PARIAH if the argument range is between 31 to 99", async function () {
                  const breedIndex = await randomIpfsNft.getBreedFromModdedRng(56)
                  //   console.log(breedIndex)
                  assert.equal(breedIndex.toString(), "2")
              })
          })

          describe("getDogTokenURIs", function () {
              let tokenUris = [
                  "ipfs://QmRx8EwpCEYfq6sQ9by5D6shLHRBfMovPurP9v7rtHUgYv/",
                  "ipfs://QmPvmyYFJFGJP4CiWi3DxPSUQbdJVxaTkGEKRRCfvdrXx3/",
                  "ipfs://QmYLH53K5JaW8qHJoi1QXw1QQVhfMyU1tkP23zzsfnQRyX/",
              ]
              it("checks all the tokenUris are pressent in s_dogTokenURIs", async function () {
                  for (i = 0; i < 3; i++) {
                      const dogTokenUri = await randomIpfsNft.getDogTokenURIs(i)
                      assert(tokenUris.includes(dogTokenUri))
                  }
              })
          })
      })
