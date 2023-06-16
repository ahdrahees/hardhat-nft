const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
const fs = require("fs")

const LOW_SVG_URI =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8c3ZnIHdpZHRoPSIxMDI0cHgiIGhlaWdodD0iMTAyNHB4IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik01MTIgNjRDMjY0LjYgNjQgNjQgMjY0LjYgNjQgNTEyczIwMC42IDQ0OCA0NDggNDQ4IDQ0OC0yMDAuNiA0NDgtNDQ4Uzc1OS40IDY0IDUxMiA2NHptMCA4MjBjLTIwNS40IDAtMzcyLTE2Ni42LTM3Mi0zNzJzMTY2LjYtMzcyIDM3Mi0zNzIgMzcyIDE2Ni42IDM3MiAzNzItMTY2LjYgMzcyLTM3MiAzNzJ6Ii8+CiAgPHBhdGggZmlsbD0iI0U2RTZFNiIgZD0iTTUxMiAxNDBjLTIwNS40IDAtMzcyIDE2Ni42LTM3MiAzNzJzMTY2LjYgMzcyIDM3MiAzNzIgMzcyLTE2Ni42IDM3Mi0zNzItMTY2LjYtMzcyLTM3Mi0zNzJ6TTI4OCA0MjFhNDguMDEgNDguMDEgMCAwIDEgOTYgMCA0OC4wMSA0OC4wMSAwIDAgMS05NiAwem0zNzYgMjcyaC00OC4xYy00LjIgMC03LjgtMy4yLTguMS03LjRDNjA0IDYzNi4xIDU2Mi41IDU5NyA1MTIgNTk3cy05Mi4xIDM5LjEtOTUuOCA4OC42Yy0uMyA0LjItMy45IDcuNC04LjEgNy40SDM2MGE4IDggMCAwIDEtOC04LjRjNC40LTg0LjMgNzQuNS0xNTEuNiAxNjAtMTUxLjZzMTU1LjYgNjcuMyAxNjAgMTUxLjZhOCA4IDAgMCAxLTggOC40em0yNC0yMjRhNDguMDEgNDguMDEgMCAwIDEgMC05NiA0OC4wMSA0OC4wMSAwIDAgMSAwIDk2eiIvPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik0yODggNDIxYTQ4IDQ4IDAgMSAwIDk2IDAgNDggNDggMCAxIDAtOTYgMHptMjI0IDExMmMtODUuNSAwLTE1NS42IDY3LjMtMTYwIDE1MS42YTggOCAwIDAgMCA4IDguNGg0OC4xYzQuMiAwIDcuOC0zLjIgOC4xLTcuNCAzLjctNDkuNSA0NS4zLTg4LjYgOTUuOC04OC42czkyIDM5LjEgOTUuOCA4OC42Yy4zIDQuMiAzLjkgNy40IDguMSA3LjRINjY0YTggOCAwIDAgMCA4LTguNEM2NjcuNiA2MDAuMyA1OTcuNSA1MzMgNTEyIDUzM3ptMTI4LTExMmE0OCA0OCAwIDEgMCA5NiAwIDQ4IDQ4IDAgMSAwLTk2IDB6Ii8+Cjwvc3ZnPgo="
const HIGH_SVG_URI =
    "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgd2lkdGg9IjQwMCIgIGhlaWdodD0iNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgZmlsbD0ieWVsbG93IiByPSI3OCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgPGcgY2xhc3M9ImV5ZXMiPgogICAgPGNpcmNsZSBjeD0iNjEiIGN5PSI4MiIgcj0iMTIiLz4KICAgIDxjaXJjbGUgY3g9IjEyNyIgY3k9IjgyIiByPSIxMiIvPgogIDwvZz4KICA8cGF0aCBkPSJtMTM2LjgxIDExNi41M2MuNjkgMjYuMTctNjQuMTEgNDItODEuNTItLjczIiBzdHlsZT0iZmlsbDpub25lOyBzdHJva2U6IGJsYWNrOyBzdHJva2Utd2lkdGg6IDM7Ii8+Cjwvc3ZnPg=="

const HIGH_TOKEN_URI =
    "data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTVkcgTkZUIiwiZGVzY3JpcHRpb24iOiJBbiBORlQgdGhhdCBjaGFuZ2VzIGJhc2VkIG9uIHRoZSBDaGFpbmxpbmsgRmVlZCIsImF0dHJpYnV0ZXMiOlt7InRyYWl0X3R5cGUiOiJjb29sIGVtb2ppIiwidmFsdWUiOjEwMH1dLCJpbWFnZSI6ImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjJhV1YzUW05NFBTSXdJREFnTWpBd0lESXdNQ0lnZDJsa2RHZzlJalF3TUNJZ0lHaGxhV2RvZEQwaU5EQXdJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lQZ29nSUR4amFYSmpiR1VnWTNnOUlqRXdNQ0lnWTNrOUlqRXdNQ0lnWm1sc2JEMGllV1ZzYkc5M0lpQnlQU0kzT0NJZ2MzUnliMnRsUFNKaWJHRmpheUlnYzNSeWIydGxMWGRwWkhSb1BTSXpJaTgrQ2lBZ1BHY2dZMnhoYzNNOUltVjVaWE1pUGdvZ0lDQWdQR05wY21Oc1pTQmplRDBpTmpFaUlHTjVQU0k0TWlJZ2NqMGlNVElpTHo0S0lDQWdJRHhqYVhKamJHVWdZM2c5SWpFeU55SWdZM2s5SWpneUlpQnlQU0l4TWlJdlBnb2dJRHd2Wno0S0lDQThjR0YwYUNCa1BTSnRNVE0yTGpneElERXhOaTQxTTJNdU5qa2dNall1TVRjdE5qUXVNVEVnTkRJdE9ERXVOVEl0TGpjeklpQnpkSGxzWlQwaVptbHNiRHB1YjI1bE95QnpkSEp2YTJVNklHSnNZV05yT3lCemRISnZhMlV0ZDJsa2RHZzZJRE03SWk4K0Nqd3ZjM1puUGc9PSJ9"
const LOW_TOKEN_URI =
    "data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTVkcgTkZUIiwiZGVzY3JpcHRpb24iOiJBbiBORlQgdGhhdCBjaGFuZ2VzIGJhc2VkIG9uIHRoZSBDaGFpbmxpbmsgRmVlZCIsImF0dHJpYnV0ZXMiOlt7InRyYWl0X3R5cGUiOiJjb29sIGVtb2ppIiwidmFsdWUiOjEwMH1dLCJpbWFnZSI6ImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCemRHRnVaR0ZzYjI1bFBTSnVieUkvUGdvOGMzWm5JSGRwWkhSb1BTSXhNREkwY0hnaUlHaGxhV2RvZEQwaU1UQXlOSEI0SWlCMmFXVjNRbTk0UFNJd0lEQWdNVEF5TkNBeE1ESTBJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lQZ29nSUR4d1lYUm9JR1pwYkd3OUlpTXpNek1pSUdROUlrMDFNVElnTmpSRE1qWTBMallnTmpRZ05qUWdNalkwTGpZZ05qUWdOVEV5Y3pJd01DNDJJRFEwT0NBME5EZ2dORFE0SURRME9DMHlNREF1TmlBME5EZ3RORFE0VXpjMU9TNDBJRFkwSURVeE1pQTJOSHB0TUNBNE1qQmpMVEl3TlM0MElEQXRNemN5TFRFMk5pNDJMVE0zTWkwek56SnpNVFkyTGpZdE16Y3lJRE0zTWkwek56SWdNemN5SURFMk5pNDJJRE0zTWlBek56SXRNVFkyTGpZZ016Y3lMVE0zTWlBek56SjZJaTgrQ2lBZ1BIQmhkR2dnWm1sc2JEMGlJMFUyUlRaRk5pSWdaRDBpVFRVeE1pQXhOREJqTFRJd05TNDBJREF0TXpjeUlERTJOaTQyTFRNM01pQXpOekp6TVRZMkxqWWdNemN5SURNM01pQXpOeklnTXpjeUxURTJOaTQySURNM01pMHpOekl0TVRZMkxqWXRNemN5TFRNM01pMHpOeko2VFRJNE9DQTBNakZoTkRndU1ERWdORGd1TURFZ01DQXdJREVnT1RZZ01DQTBPQzR3TVNBME9DNHdNU0F3SURBZ01TMDVOaUF3ZW0wek56WWdNamN5YUMwME9DNHhZeTAwTGpJZ01DMDNMamd0TXk0eUxUZ3VNUzAzTGpSRE5qQTBJRFl6Tmk0eElEVTJNaTQxSURVNU55QTFNVElnTlRrM2N5MDVNaTR4SURNNUxqRXRPVFV1T0NBNE9DNDJZeTB1TXlBMExqSXRNeTQ1SURjdU5DMDRMakVnTnk0MFNETTJNR0U0SURnZ01DQXdJREV0T0MwNExqUmpOQzQwTFRnMExqTWdOelF1TlMweE5URXVOaUF4TmpBdE1UVXhMalp6TVRVMUxqWWdOamN1TXlBeE5qQWdNVFV4TGpaaE9DQTRJREFnTUNBeExUZ2dPQzQwZW0weU5DMHlNalJoTkRndU1ERWdORGd1TURFZ01DQXdJREVnTUMwNU5pQTBPQzR3TVNBME9DNHdNU0F3SURBZ01TQXdJRGsyZWlJdlBnb2dJRHh3WVhSb0lHWnBiR3c5SWlNek16TWlJR1E5SWsweU9EZ2dOREl4WVRRNElEUTRJREFnTVNBd0lEazJJREFnTkRnZ05EZ2dNQ0F4SURBdE9UWWdNSHB0TWpJMElERXhNbU10T0RVdU5TQXdMVEUxTlM0MklEWTNMak10TVRZd0lERTFNUzQyWVRnZ09DQXdJREFnTUNBNElEZ3VOR2cwT0M0eFl6UXVNaUF3SURjdU9DMHpMaklnT0M0eExUY3VOQ0F6TGpjdE5Ea3VOU0EwTlM0ekxUZzRMallnT1RVdU9DMDRPQzQyY3preUlETTVMakVnT1RVdU9DQTRPQzQyWXk0eklEUXVNaUF6TGprZ055NDBJRGd1TVNBM0xqUklOalkwWVRnZ09DQXdJREFnTUNBNExUZ3VORU0yTmpjdU5pQTJNREF1TXlBMU9UY3VOU0ExTXpNZ05URXlJRFV6TTNwdE1USTRMVEV4TW1FME9DQTBPQ0F3SURFZ01DQTVOaUF3SURRNElEUTRJREFnTVNBd0xUazJJREI2SWk4K0Nqd3ZjM1puUGdvPSJ9"
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("DynamicSvgNft Unit Test", function () {
          let dynamicSvgNft, deployer, mockV3Aggregator
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "dynamicsvg"])
              dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
          })

          describe("constructor", function () {
              it("set constructor correctly", async function () {
                  const priceFeed = await dynamicSvgNft.getPriceFeed()
                  const lowSvg = await dynamicSvgNft.getLowSvgImageURI()
                  const highSvg = await dynamicSvgNft.getHighSvgImageURI()
                  const tokenCounter = await dynamicSvgNft.getTokenCounter()

                  assert.equal(priceFeed, mockV3Aggregator.address)
                  assert.equal(lowSvg, LOW_SVG_URI)
                  assert.equal(highSvg, HIGH_SVG_URI)
                  assert.equal(tokenCounter, 0)
              })
          })

          describe("svgToImageURI", function () {
              let lowSvg
              beforeEach(async () => {
                  lowSvg = await fs.readFileSync("./images/dynamicNft/frown.svg", {
                      encoding: "utf-8",
                  })
              })
              it("Convert SVG to Base64 based Image URI", async () => {
                  const lowSvgImageURI = await dynamicSvgNft.svgToImageURI(lowSvg)

                  assert.equal(lowSvgImageURI, LOW_SVG_URI)
              })
          })

          describe("mintNft", function () {
              const highVlaue = ethers.utils.parseEther("30000") // High value of BTC set to 30000 $
              it("emits an event when nft is minted", async function () {
                  expect(await dynamicSvgNft.mintNft(highVlaue)).to.be.emit(
                      dynamicSvgNft,
                      "CreatedNFT"
                  )
              })
              it("tokenCounter will be updated", async function () {
                  const tokenCounterBeforeMinting = await dynamicSvgNft.getTokenCounter()
                  await dynamicSvgNft.mintNft(highVlaue)
                  const tokenCounterAfterMinting = await dynamicSvgNft.getTokenCounter()
                  assert.equal(
                      tokenCounterAfterMinting.toString(),
                      tokenCounterBeforeMinting.add(1).toString()
                  )
              })
          })

          describe("tokenURI", function () {
              beforeEach(async function () {
                  const highVlaue = ethers.utils.parseEther("30000")
                  await dynamicSvgNft.mintNft(highVlaue)
              })
              it("returns high tokenURI", async function () {
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenURI, HIGH_TOKEN_URI)
              })
              it("changes tokenURI when price is below high value", async function () {
                  const lowValue = ethers.utils.parseEther("20000")
                  await mockV3Aggregator.updateAnswer(lowValue) // we set BTC price 20000$ which is below high value 30000$
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenURI, LOW_TOKEN_URI)
              })
          })
      })
