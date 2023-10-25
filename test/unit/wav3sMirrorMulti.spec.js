const { network, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("wav3sMirrorMulti Unit Tests", async function () {
          //set log level to ignore non errors
          ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)
          let USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
          let WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
          let USDT_WHALE = "0x21Cb017B40abE17B6DFb9Ba64A3Ab0f24A7e60EA"
          let BIG_WHALE = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245"
          let WHALE_USER = "0x06959153B974D0D5fDfd87D561db6d8d4FA0bb0B"
          let WAV3S_HUB = "0x092E67E9dbc47101760143f95056569CB0b3324f"
          let WAV3S_HUB2 = "0xD9D68C71dE6FB90a062c237438200614F1FB8339"
          let wav3s_fee = 5

          // We define a fixture to reuse the same setup in every test.
          // We use loadFixture to run this setup once, snapshot that state,
          // and reset Hardhat Network to that snapshot in every test.
          async function deploywav3sMirrorMultiFixture() {
              const [deployer] = await ethers.getSigners()
              accounts = await ethers.getSigners() // could also do with getNamedAccounts

              anyProfileId = accounts[2]

              const wav3sMirrorMultiFactory = await ethers.getContractFactory("wav3sMirrorMulti")

              const wav3sMirrorMulti = await wav3sMirrorMultiFactory
                  .connect(deployer)
                  .deploy(wav3s_fee/*, wEther, USDCoin, DAI*/)
              return { wav3sMirrorMulti, USDT,WMATIC }
          }
          // Fixture correctly set up
          async function deploywav3sMirrorMultiFixtureSetup() {
              const [deployer] = await ethers.getSigners()
              accounts = await ethers.getSigners(1) // could also do with getNamedAccounts

              anyProfileId = accounts[2]

              let multisig = "0x46E2444dA78e3bB9588e822fB40FcAF6087d1C97"
              let currencyAddress = WMATIC
              //let currencyAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
              let pubId = "0x1d"

              const wav3sMirrorMultiFactory = await ethers.getContractFactory("wav3sMirrorMulti")
              const wav3sMirrorMulti = await wav3sMirrorMultiFactory
                  .connect(deployer)
                  .deploy(wav3s_fee/*, wEther, USDCoin , DAI*/)
              await wav3sMirrorMulti.setMultisig(multisig)
              await wav3sMirrorMulti.whitelistWav3sTrigger(WAV3S_HUB)
              await wav3sMirrorMulti.whitelistCurrency(WMATIC, false)

              Currency = await ethers.getContractAt("IERC20", currencyAddress)
              // Unlock USDT whale
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [USDT_WHALE],
              })
              // Unlock whale
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [BIG_WHALE],
              })
              // Unlock wav3sHub account
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [WAV3S_HUB],
              })
              // Unlock wav3sHub2 account
              await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [WAV3S_HUB2],
              })
       
        
              const Whale = await ethers.getSigner(BIG_WHALE)

              const wav3sHub = await ethers.getSigner(WAV3S_HUB)
              const wav3sHub2 = await ethers.getSigner(WAV3S_HUB2)

              const preBalance = await Currency.balanceOf(Whale.address)
              //console.log("whale usdt prebalance", BigNumber.from(preBalance).toString())

              const multiPreBalance = await Currency.balanceOf(multisig)
              const wav3sPreBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

              const mirrorers=[WAV3S_HUB, WAV3S_HUB2, WHALE_USER]

              return {
                  wav3sMirrorMulti,
                  Currency,
                  WHALE_USER,
                  mirrorers,
                  currencyAddress,
                  anyProfileId,
                  multisig,
                  Whale,
                  wav3sHub,
                  Currency,
                  pubId,
                  wav3s_fee,
                  preBalance,
                  wav3sPreBalance,
                  multiPreBalance,
              }
          }
          // Fixture correctly set and Publication funded
          async function deploywav3sMirrorMultiFixturePubFunded() {
            const [deployer] = await ethers.getSigners()
            accounts = await ethers.getSigners(1) // could also do with getNamedAccounts

            anyProfileId = accounts[2]

            let multisig = "0x46E2444dA78e3bB9588e822fB40FcAF6087d1C97"
            let currencyAddress = WMATIC

            const wav3sMirrorMultiFactory = await ethers.getContractFactory("wav3sMirrorMulti")
            const wav3sMirrorMulti = await wav3sMirrorMultiFactory
                .connect(deployer)
                .deploy(wav3s_fee /*, wEther, USDCoin , DAI*/)
            await wav3sMirrorMulti.setMultisig(multisig)
            await wav3sMirrorMulti.whitelistWav3sTrigger(WAV3S_HUB)
            await wav3sMirrorMulti.whitelistCurrency(WMATIC)

            Currency = await ethers.getContractAt("IERC20", currencyAddress)
            // Unlock USDT whale
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [USDT_WHALE],
            })
            // Unlock whale
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [BIG_WHALE],
            })
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [WAV3S_HUB],
            })
    
            const Whale = await ethers.getSigner(BIG_WHALE)

            const wav3sHub = await ethers.getSigner(WAV3S_HUB)

            const preBalance = await Currency.balanceOf(Whale.address)
            const wav3sPreBalance = await Currency.balanceOf(wav3sMirrorMulti.address)
            const multiPreBalance = await Currency.balanceOf(multisig)

            const mirrorers=[WAV3S_HUB, WAV3S_HUB2, WHALE_USER]

            //new shit
            let total_fees_percentage = wav3s_fee 
            let preBudget = BigNumber.from(10).pow(6).mul(100+total_fees_percentage).div(100)
            let reward = BigNumber.from(10).pow(5)
            let pubId = "0x1d"
            let minFollowers = 10

            let profileAddress = Whale.address

            let total_fee_amount = (preBudget / (100 + total_fees_percentage)) * total_fees_percentage
            budget = preBudget - total_fee_amount

            let wav3sFees = BigNumber.from(total_fee_amount.toString()).mul(wav3s_fee).div(total_fees_percentage)

            let isWav3 = await wav3sMirrorMulti.isWav3(pubId)
            expect(isWav3).to.equal(false)
            //check the profile spent the budget
            await approveErc20(
                currencyAddress,
                wav3sMirrorMulti.address,
                preBudget.toString(),
                Whale
            )
            await expect(
                wav3sMirrorMulti
                    .connect(Whale)
                    .fundMirror(
                        preBudget.toString(),
                        reward.toString(),
                        profileAddress,
                        minFollowers,
                        currencyAddress
                    )
            )
                .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__PostFunded")
                .withArgs(
                  budget.toString(),
                  reward.toString(),
                  profileAddress,
                  currencyAddress,
                  1
                )

               // console.log("aqui22")
                tx = await wav3sMirrorMulti.connect(wav3sHub).setPubId(1,pubId)

            //check the profile spent the budget
            const postOwnerBalance = await Currency.balanceOf(Whale.address)

            let expectedOwnerpostOwnerBalance = preBalance.sub(preBudget)
            assert.equal(
                postOwnerBalance.toString(),
                expectedOwnerpostOwnerBalance.toString(),
                "Post owner balance should be equal to pre balance minus pre budget"
            )
            // check that wav3s balance is preWav3sBalance, plus the budget, minus the wav3s fees
            wav3spostOwnerBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

            let expectedWav3sBalance = wav3sPreBalance.add(preBudget).sub(wav3sFees)
            assert.equal(
                wav3spostOwnerBalance.toString(),
                expectedWav3sBalance.toString(),
                "Post wav3sMirrorMulti balance should be equal to pre balance plus preBudget minus wav3sFees"
            )
            // also check that wav3s fees were transfered to the multisig
            let expectedMultiBalance = multiPreBalance.add(wav3sFees)
            let multipostOwnerBalance = await Currency.balanceOf(multisig)
            assert.equal(
                multipostOwnerBalance.toString(),
                expectedMultiBalance.toString(),
                "Post Multi balance should be equal to pre balance plus wa3s fees"
            )
            // Check isWav3 works
            isWav3 = await wav3sMirrorMulti.isWav3(pubId)
            expect(isWav3).to.equal(true)
            // Check getMirrorBudget works

            mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(pubId)
          //  console.log("mirrorbudget", mirrorBudget.toString())

            expect(mirrorBudget).to.equal(budget.toString())

            return {
                wav3sMirrorMulti,
                currencyAddress,
                anyProfileId,
                profileAddress,
                mirrorers,
                minFollowers,
                postOwnerBalance,
                Whale,
                WAV3S_HUB,
                WAV3S_HUB2,
                WHALE_USER,
                Currency,
                budget,
                wav3sHub,
                reward,
                wav3s_fee,
                multipostOwnerBalance,
                preBudget,
                pubId,
                mirrorBudget,
                wav3spostOwnerBalance               
            }
          }
          // Fixture correctly set, Publication funded, 1 Mirror processed
          async function deploywav3sMirrorMultiFixturePubFundedLittleBudget() {
              const [deployer] = await ethers.getSigners()
              accounts = await ethers.getSigners(1) // could also do with getNamedAccounts

              anyProfileId = accounts[2]

              let fees = 5
              let multisig = "0x46E2444dA78e3bB9588e822fB40FcAF6087d1C97"
              let currencyAddress = WMATIC

              const wav3sMirrorMultiFactory = await ethers.getContractFactory("wav3sMirrorMulti")
              const wav3sMirrorMulti = await wav3sMirrorMultiFactory
                  .connect(deployer)
                  .deploy(fees)
              await wav3sMirrorMulti.setMultisig(multisig)
              await wav3sMirrorMulti.whitelistWav3sTrigger(WAV3S_HUB)
              await wav3sMirrorMulti.whitelistCurrency(WMATIC)

              const Currency = await ethers.getContractAt("IERC20", currencyAddress)
              // Unlock USDT whale
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [USDT_WHALE],
              })
              // Unlock big whale
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [BIG_WHALE],
              })
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [WAV3S_HUB],
              })
              const Whale = await ethers.getSigner(BIG_WHALE)
              const wav3sHub = await ethers.getSigner(WAV3S_HUB)

              const preBalance = await Currency.balanceOf(Whale.address)
              const wav3sPreBalance = await Currency.balanceOf(wav3sMirrorMulti.address)
              const multiPreBalance = await Currency.balanceOf(multisig)

              //Fund Mirror
            let total_fees_percentage = wav3s_fee
            let preBudget = BigNumber.from(10).pow(6).mul(100+total_fees_percentage).div(100)
            let reward = BigNumber.from(10).pow(6)
            let pubId = "0x1d"
            let minFollowers = 10

            let profileAddress = Whale.address

            let total_fee_amount = (preBudget / (100 + total_fees_percentage)) * total_fees_percentage
            budget = preBudget - total_fee_amount

            //console.log("prebudget", preBudget.toString())
            //console.log("budget", budget.toString())

            let wav3sFees = BigNumber.from(total_fee_amount.toString()).mul(wav3s_fee).div(total_fees_percentage)


            let isWav3 = await wav3sMirrorMulti.isWav3(pubId)
            expect(isWav3).to.equal(false)
            //check the profile spent the budget
            await approveErc20(
                currencyAddress,
                wav3sMirrorMulti.address,
                preBudget.toString(),
                Whale
            )

            await expect(
                wav3sMirrorMulti
                    .connect(Whale)
                    .fundMirror(
                        preBudget.toString(),
                        reward.toString(),
                        profileAddress,
                        minFollowers,
                        currencyAddress
                    )
            )
                .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__PostFunded")
                .withArgs(
                  budget.toString(),
                  reward.toString(),
                  profileAddress,
                  currencyAddress,
                  1
                )
                tx = await wav3sMirrorMulti.connect(wav3sHub).setPubId(1,pubId)
              //check the profile spent the budget
              const postBalance = await Currency.balanceOf(Whale.address)

              let expectedPostBalance = preBalance.sub(preBudget)
              assert.equal(
                  postBalance.toString(),
                  expectedPostBalance.toString(),
                  "Post balance should be equal to pre balance minus pre budget"
              )
              // check that wav3s balance is preWav3sBalance, plus the budget, minus the wav3s fees
              wav3sPostBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

              let expectedWav3sBalance = wav3sPreBalance.add(preBudget).sub(wav3sFees)
              assert.equal(
                  wav3sPostBalance.toString(),
                  expectedWav3sBalance.toString(),
                  "Post wav3sMirrorMulti balance should be equal to pre balance plus preBudget minus wav3sFees"
              )
              // also check that wav3s fees were transfered to the multisig
              let expectedMultiBalance = multiPreBalance.add(wav3sFees)
              let multiPostBalance = await Currency.balanceOf(multisig)
              assert.equal(
                  multiPostBalance.toString(),
                  expectedMultiBalance.toString(),
                  "Post Multi balance should be equal to pre balance plus wa3s fees"
              )
              // Check isWav3 works
              isWav3 = await wav3sMirrorMulti.isWav3(pubId)
              expect(isWav3).to.equal(true)
              // Check getMirrorBudget works

              mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(pubId)
              expect(mirrorBudget).to.equal(budget.toString())

              // ------------------------------------------------------------------------------------------//
              //
              //
              // Execute 1 processMirror

              currentBudget = mirrorBudget - reward

              const preMirrorerBalance = await Currency.balanceOf(anyProfileId.address)
              const preWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

              await expect(
                  wav3sMirrorMulti
                      .connect(wav3sHub)
                      .processMirror(pubId, anyProfileId.address.toString(), 10)
              )
                  .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__MirrorProcessed")
                  .withArgs(
                    currentBudget.toString(),
                    reward.toString(),
                      anyProfileId.address,
                      pubId
                  )
                  .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__PubFinished")
                  .withArgs(pubId)
              //check the profile received the reward
              const postMirrorerBalance = await Currency.balanceOf(anyProfileId.address)

              expectedPostBalance = preMirrorerBalance.add(reward)
              assert.equal(
                  postMirrorerBalance.toString(),
                  expectedPostBalance.toString(),
                  "Post balance should be equal to pre balance plus reward"
              )
              // check that wav3s balance is preWav3sBalance minus the reward
              postWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

              expectedWav3sBalance = preWav3sBalance.sub(reward)
              assert.equal(
                  postWav3sBalance.toString(),
                  expectedWav3sBalance.toString(),
                  "Post wav3sMirrorMulti balance should be equal to pre balance minus reward"
              )

              return {
                  wav3sMirrorMulti,
                  currencyAddress,
                  anyProfileId,
                  Whale,
                  Currency,
                  budget,
                  USDT,
                  deployer,
                  wav3sHub,
                  reward,
                  minFollowers,
                  fees,
                  multiPostBalance,
                  pubId,
                  mirrorBudget,
                  wav3sPostBalance,
              }
          }

          describe("Set up hub, whitelist app", async function () {
              describe("Set Hub", async function () {
                  it("Should emit event wav3sMirrorMulti__HubSet when setting wav3s hub address", async function () {
                      const { wav3sMirrorMulti } = await loadFixture(deploywav3sMirrorMultiFixture)
                      const deployer = await wav3sMirrorMulti.signer
                      const newWav3sHub = "0x0000000000000000000000000000000000000001"

                      await expect(wav3sMirrorMulti.whitelistWav3sTrigger(newWav3sHub)).not.to.be.reverted
                      await expect(wav3sMirrorMulti.whitelistWav3sTrigger(newWav3sHub))
                          .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__TriggerSet")
                          .withArgs(newWav3sHub, deployer.address)
                  })

                  it("Should revert when setting wav3s hub address with non owner", async function () {
                      const { wav3sMirrorMulti } = await loadFixture(deploywav3sMirrorMultiFixture)
                      const deployer = await wav3sMirrorMulti.signer
                      const newWav3sHub = "0x0000000000000000000000000000000000000001"

                      await expect(
                          wav3sMirrorMulti.connect(anyProfileId).whitelistWav3sTrigger(newWav3sHub)
                      ).to.be.rejectedWith("Only the owner can call this function.")
                  })
              })
              describe("Set Multisig", async function () {
                  it("Should emit event wav3sMirrorMulti__HubSet when setting wav3s hub address", async function () {
                      const { wav3sMirrorMulti } = await loadFixture(deploywav3sMirrorMultiFixture)
                      const deployer = await wav3sMirrorMulti.signer
                      const multisig = "0xC2628eDdDB676c4cAF68aAD55d2191F6c9668624"

                      await expect(wav3sMirrorMulti.setMultisig(multisig)).not.to.be.reverted
                      await expect(wav3sMirrorMulti.setMultisig(multisig))
                          .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__MsigSet")
                          .withArgs(multisig, deployer.address)
                      const multisigAddress = await wav3sMirrorMulti.getMultisig()
                      await expect(multisigAddress).to.equal(multisig)
                  })
                  it("Should revert when setting multisig address with non owner", async function () {
                      const { wav3sMirrorMulti } = await loadFixture(deploywav3sMirrorMultiFixture)
                      const deployer = await wav3sMirrorMulti.signer
                      const multisig = "0xC2628eDdDB676c4cAF68aAD55d2191F6c9668624"

                      await expect(
                          wav3sMirrorMulti.connect(anyProfileId).setMultisig(multisig)
                      ).to.be.rejectedWith("Only the owner can call this function.")
                  })
              })
              describe("Whitelist currency", async function () {
                  it("Should emit event when normal currency is whitelisted and currencyWhitelisted return (currency,false)", async function () {
                      const { wav3sMirrorMulti, WMATIC } = await loadFixture(deploywav3sMirrorMultiFixture)

                      await expect(wav3sMirrorMulti.whitelistCurrency(WMATIC, false)).not.to.be.reverted
                      await expect(wav3sMirrorMulti.whitelistCurrency(WMATIC, false))
                          .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CurrencyWhitelisted")
                          .withArgs(WMATIC, false)

                      const isWhitelisted = await wav3sMirrorMulti.currencyWhitelisted(WMATIC)
                      expect(isWhitelisted).to.equal(true)
                  })
                  it("Should emit event when super currency is whitelisted and currencyWhitelisted return (currency,true)", async function () {
                    const { wav3sMirrorMulti, USDT } = await loadFixture(deploywav3sMirrorMultiFixture)

                    await expect(wav3sMirrorMulti.whitelistCurrency(USDT, true)).not.to.be.reverted
                    await expect(wav3sMirrorMulti.whitelistCurrency(USDT, true))
                        .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CurrencyWhitelisted")
                        .withArgs(USDT, true)

                    const isWhitelisted = await wav3sMirrorMulti.superCurrencyWhitelisted(USDT)
                    expect(isWhitelisted).to.equal(true)
                })
                  it("Should emit error not owner and superCurrencyWhitelisted return false", async function () {
                      const { wav3sMirrorMulti } = await loadFixture(deploywav3sMirrorMultiFixture)
                      const appAddress = "0x0000000000000000000000000000000000000123"

                      await expect(
                          wav3sMirrorMulti.connect(anyProfileId).whitelistCurrency(USDT, true)
                      ).to.be.rejectedWith("Only the owner can call this function.")
                      const isWhitelisted = await wav3sMirrorMulti.superCurrencyWhitelisted(USDT)
                      expect(isWhitelisted).to.equal(false)
                  })
              })

              describe("Fund a post", async function () {
                  it("Should revert sender not owner", async function () {
                      const { wav3sMirrorMulti,currencyAddress ,WHALE_USER } =
                          await loadFixture(deploywav3sMirrorMultiFixtureSetup)
                      let budget = ethers.utils.parseEther("0.2") //calcular el iva wav3s
                      let reward = ethers.utils.parseEther("0.1")
                     // let pubId = "0x1d"
                      let profileAddress = WHALE_USER.toString()
                      let minFollowers = 0

                      await expect(
                          wav3sMirrorMulti.fundMirror(
                              budget,
                              reward,
                              profileAddress,
                              minFollowers,
                              currencyAddress
                          )
                      ).to.be.rejectedWith(
                          "Errors.wav3sMirrorMulti__fundMirror__SenderNotOwner()"
                      )
                  })
                  it("Should revert if reward is below minimum", async function () {
                    const { wav3sMirrorMulti, currencyAddress, Whale } =
                        await loadFixture(deploywav3sMirrorMultiFixtureSetup);
                
                    let total_fees_percentage = wav3s_fee;
                    let preBudget = BigNumber.from(10).pow(6).mul(100 + total_fees_percentage).div(100);
                    let reward = BigNumber.from(10).pow(4);
                    //let pubId = "0x1d";
                    let profileAddress = Whale.address;
                    let minFollowers = 0;

                    const maticValueInWei = ethers.utils.parseUnits("1", 18); // Assuming 18 decimal places for Matic

                    await approveErc20(
                        currencyAddress,
                        wav3sMirrorMulti.address,
                        preBudget.toString(),
                        Whale
                    );
                
                    await expect(
                        wav3sMirrorMulti
                            .connect(Whale)
                            .fundMirror(
                                preBudget,
                                reward,
                                profileAddress,
                                minFollowers,
                                currencyAddress,
                                { value: maticValueInWei } // Transfer 1 Matic along with the function call
                            )
                    ).to.be.rejectedWith(
                        "Errors.wav3sMirrorMulti__fundMirror__RewardBelowMinimum()"
                    );
                })
                
                  it("Should revert if budget is less than the reward", async function () {
                      const { wav3sMirrorMulti, currencyAddress, Whale} =
                          await loadFixture(deploywav3sMirrorMultiFixtureSetup)

                          let total_fees_percentage = wav3s_fee
                          let preBudget = BigNumber.from(10).pow(6).mul(100+total_fees_percentage).div(100)
                          let reward = BigNumber.from(10).pow(7)
                         // let pubId = "0x1d"
                          let minFollowers = 0

                          const maticValueInWei = ethers.utils.parseUnits("1", 18); // Assuming 18 decimal places for Matic

                          let profileAddress = Whale.address
      
                            await approveErc20(
                                currencyAddress,
                                wav3sMirrorMulti.address,
                                preBudget.toString(),
                                Whale
                            )

                      await expect(
                          wav3sMirrorMulti
                              .connect(Whale)
                              .fundMirror(
                                preBudget,
                                reward,
                                profileAddress,
                                minFollowers,
                                currencyAddress,
                                { value: maticValueInWei } // Transfer 1 Matic along with the function call
                                )
                      ).to.be.rejectedWith(
                        "Errors.wav3sMirrorMulti__fundMirror__NotEnoughBudgetForThatReward()"
                        )
                  })
                  it("Should revert if not enough balance Low-level call failed", async function () {
                      const { wav3sMirrorMulti, currencyAddress, Whale} =
                          await loadFixture(deploywav3sMirrorMultiFixtureSetup)

                      let minFollowers = 0
                      let total_fees_percentage = wav3s_fee
                      let preBudget = BigNumber.from(10).pow(20).mul(100+total_fees_percentage).div(100)
                      let reward = BigNumber.from(10).pow(5)
                     // let pubId = "0x1d"
                      let profileAddress = Whale.address
                console.log("aqui1")
                      await approveErc20(
                          currencyAddress,
                          wav3sMirrorMulti.address,
                          preBudget.toString(),
                          Whale
                      )
                      console.log("aqui2")

                      await expect(
                          wav3sMirrorMulti
                              .connect(Whale)
                              .fundMirror(
                                preBudget,
                                reward,
                                profileAddress,
                                minFollowers,
                                currencyAddress)
                      ).to.be.rejectedWith(
                          /SafeERC20: low-level call failed|ERC20: transfer amount exceeds balance/
                          /*
                          "SafeERC20: low-level call failed" ||
                              "ERC20: transfer amount exceeds balance"*/
                      )
                      console.log("aqui3")

                  })
                  it("Should revert post already set", async function () {
                      const {
                          wav3sMirrorMulti,
                          wav3sHub,
                          pubId                       
                      } = await loadFixture(deploywav3sMirrorMultiFixturePubFunded)

                     await expect(wav3sMirrorMulti.connect(wav3sHub).setPubId(1,pubId)).to.be.rejectedWith(
                            "Errors.wav3sMirrorMulti__setPubId__PostAlreadyFunded/Set()"
                     )
                  })
                  describe("Success", async function () {
                      it("Should fundMirror succesfully", async function () {
                          const {
                              wav3sMirrorMulti,
                              currencyAddress,
                              Whale,
                              preBalance,
                              wav3sPreBalance,
                              wav3sHub,
                              multiPreBalance,
                              multisig
                          } = await loadFixture(deploywav3sMirrorMultiFixtureSetup)

                        let total_fees_percentage = wav3s_fee
                        let preBudget = BigNumber.from(10).pow(6).mul(100+total_fees_percentage).div(100)
                        let reward = BigNumber.from(10).pow(5)
                        let pubId = "0x1d"
                        let minFollowers = 0

                        let profileAddress = Whale.address

                        let total_fee_amount = (preBudget / (100 + total_fees_percentage)) * total_fees_percentage
                        budget = preBudget - total_fee_amount

                        let wav3sFees = BigNumber.from(total_fee_amount.toString()).mul(wav3s_fee).div(total_fees_percentage)


                        let isWav3 = await wav3sMirrorMulti.isWav3(pubId)
                          expect(isWav3).to.equal(false)                     

                          await approveErc20(
                              currencyAddress,
                              wav3sMirrorMulti.address,
                              preBudget.toString(),
                              Whale
                          )

                          await expect(wav3sMirrorMulti
                          .connect(Whale)
                          .fundMirror(
                              preBudget,
                              reward,
                              profileAddress,
                              minFollowers,
                              currencyAddress)).to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__PostFunded")
                          .withArgs(
                            budget.toString(),
                            reward.toString(),
                            profileAddress,
                            currencyAddress,
                            1
                          )
                    
                           //check the profile spent the budget
                           const postOwnerBalance = await Currency.balanceOf(Whale.address)

                           let expectedpostOwnerBalance = preBalance.sub(preBudget)
                           assert.equal(
                               postOwnerBalance.toString(),
                               expectedpostOwnerBalance.toString(),
                               "Post balance should be equal to pre balance minus pre budget"
                           )
                           // Check that wav3s balance is preWav3sBalance, plus the budget, minus the wav3s and consumer app fees
                           wav3spostOwnerBalance = await Currency.balanceOf(wav3sMirrorMulti.address)
 
                           let expectedWav3sBalance = wav3sPreBalance.add(preBudget).sub(wav3sFees)
                           assert.equal(
                               wav3spostOwnerBalance.toString(),
                               expectedWav3sBalance.toString(),
                               "Post wav3sMirrorMulti balance should be equal to pre balance plus preBudget minus wav3sFees, minus consumerAppFees"
                           )
                           // Check that wav3s fees were transfered to the multisig
                           let expectedMultiBalance = multiPreBalance.add(wav3sFees)
                           let multipostOwnerBalance = await Currency.balanceOf(multisig)
                           assert.equal(
                               multipostOwnerBalance.toString(),
                               expectedMultiBalance.toString(),
                               "Post Multi balance should be equal to pre balance plus wa3s fees"
                           )
                
                           // Check isWav3 works

                           // pubid por hash
                           isWav3 = await wav3sMirrorMulti.isWav3(0)
                           expect(isWav3).to.equal(false)
                            // pubid por pubid
                            isWav31 = await wav3sMirrorMulti.isWav3(1)
                            expect(isWav3).to.equal(false)
                           // Check getMirrorBudget works
 
                           mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(0)
                           expect(mirrorBudget).to.equal(0)

                           // set pubid
                           // not working
                           tx = await wav3sMirrorMulti.connect(wav3sHub).setPubId(0,pubId)
                           expect(tx).not.to.be.reverted

                            // pubid por hash
                            isWav32 = await wav3sMirrorMulti.isWav3(0)
                            expect(isWav3).to.equal(false)
                            // Check getMirrorBudget works
                            // Check isWav3 works

                            // pubid por hash
                            isWav3 = await wav3sMirrorMulti.isWav3(pubId)
                            expect(isWav3).to.equal(true)
                            // Check getMirrorBudget works
 
                           //mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(socialGraph,pubId)
                           //expect(mirrorBudget).to.equal(budget.toString())
                      })
                  })
              })
              describe("Process a Mirror", async function () {
                  it("Fails if pub is not started", async function () {
                      const { wav3sMirrorMulti, wav3sHub, currencyAddress, pubId } =
                          await loadFixture(deploywav3sMirrorMultiFixtureSetup)
                      await expect(
                          wav3sMirrorMulti
                              .connect(wav3sHub)
                              .processMirror(pubId, currencyAddress, 10)
                      ).to.be.rejectedWith(
                          "Errors.wav3sMirrorMulti__process__PostNotInitiated(): Post is not funded yet"
                      )
                  })
                  it("Fails if its not wav3sHub calling", async function () {
                      const { wav3sMirrorMulti, currencyAddress, pubId, anyProfileId } =
                          await loadFixture(deploywav3sMirrorMultiFixturePubFunded)
                      await expect(
                          wav3sMirrorMulti
                              .connect(anyProfileId)
                              .processMirror(pubId, currencyAddress, 10)
                      ).to.be.rejectedWith("Errors.Only whitelisted triggers can call this function."
                    )
                  })
                  it("Should revert follower already mirrored", async function () {
                      const {
                          wav3sMirrorMulti,
                          feePerMirror,
                          reward,
                          pubId,
                          anyProfileId,
                          wav3sHub,
                          currencyAddress,
                          appAddress,
                      } = await loadFixture(deploywav3sMirrorMultiFixturePubFundedLittleBudget)
                      await expect(
                          wav3sMirrorMulti
                              .connect(wav3sHub)
                              .processMirror(pubId, anyProfileId.address.toString(), 10)
                      ).to.be.rejectedWith(
                        "Errors.wav3sMirrorMulti__process__FollowerAlreadyMirrored()"
                        )
                  })
                  it("Should revert not enough budget", async function () {
                      const { wav3sMirrorMulti, feePerMirror, Whale, pubId, wav3sHub, appAddress } =
                          await loadFixture(deploywav3sMirrorMultiFixturePubFundedLittleBudget)
                      await expect(
                          wav3sMirrorMulti
                              .connect(wav3sHub)
                              .processMirror(pubId, Whale.address.toString(), 10)
                      ).to.be.rejectedWith(
                        "Errors.wav3sMirrorMulti__process__NotEnoughBudgetForThatReward()"
                        )
                  })
                  it("Should revert not enough followers", async function () {
                      const { wav3sMirrorMulti, feePerMirror, Whale, pubId, wav3sHub, appAddress } =
                          await loadFixture(deploywav3sMirrorMultiFixturePubFunded)
                      await expect(
                          wav3sMirrorMulti
                              .connect(wav3sHub)
                              .processMirror(pubId, Whale.address.toString(), 2)
                      ).to.be.rejectedWith(
                          "Errors.wav3sMirrorMulti__process__NeedMoreFollowers()"
                      )
                  })
     
                  describe("Success", async function () {
                      it("Should processMirror succesfully", async function () {
                          const {
                              wav3sMirrorMulti,
                              feePerMirror,
                              reward,
                              pubId,
                              anyProfileId,
                              wav3sHub,
                              currencyAddress,
                              appAddress,
                          } = await loadFixture(deploywav3sMirrorMultiFixturePubFunded)

                          mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(pubId)
                          currentBudget = mirrorBudget - reward

                          const preMirrorerBalance = await Currency.balanceOf(anyProfileId.address)
                          const preWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

                          await expect(
                              wav3sMirrorMulti
                                  .connect(wav3sHub)
                                  .processMirror(
                                      pubId,
                                      anyProfileId.address.toString(),
                                      12                                  )
                          )
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__MirrorProcessed")
                              .withArgs(
                                currentBudget.toString(),
                                reward.toString(),
                                  anyProfileId.address,
                                  pubId
                              )

                          //check the profile received the reward
                          const postMirrorerBalance = await Currency.balanceOf(anyProfileId.address)

                          let expectedPostBalance = preMirrorerBalance.add(reward)
                          assert.equal(
                              postMirrorerBalance.toString(),
                              expectedPostBalance.toString(),
                              "Post balance should be equal to pre balance plus reward"
                          )
                          // check that wav3s balance is preWav3sBalance minus the reward
                          postWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

                          let expectedWav3sBalance = preWav3sBalance.sub(reward)
                          assert.equal(
                              postWav3sBalance.toString(),
                              expectedWav3sBalance.toString(),
                              "Post wav3sMirrorMulti balance should be equal to pre balance minus reward"
                          )

                      })
                  })
              })
              describe("Process a Withdraw", async function () {
                  it("Should revert sender not owner", async function () {
                      const { wav3sMirrorMulti, pubId, anyProfileId } = await loadFixture(
                          deploywav3sMirrorMultiFixturePubFunded
                      )

                      // should emit Events.wav3sMirrorMulti__PubWithdrawn(pubId, msg.sender);
                      await expect(
                          wav3sMirrorMulti.connect(anyProfileId).withdrawMirrorBudget(pubId)
                      ).to.be.rejectedWith(
                        "Errors.wav3sMirrorMulti__withdraw__NotSenderProfileToWithdraw()"
                        )
                  })

                  it("Should revert invalid pubId", async function () {
                      const { wav3sMirrorMulti, Whale, pubId } = await loadFixture(
                          deploywav3sMirrorMultiFixturePubFunded
                      )
                      // should emit Events.wav3sMirrorMulti__PubWithdrawn(pubId, msg.sender);
                      await expect(
                          wav3sMirrorMulti.connect(Whale).withdrawMirrorBudget("")
                      ).to.be.rejectedWith(
                          "Errors.wav3sMirrorMulti__withdraw__InvalidPubId()"
                      )
                  })

                  it("Should revert wav3 not initiated", async function () {
                      const { wav3sMirrorMulti, Whale, pubId } = await loadFixture(
                          deploywav3sMirrorMultiFixtureSetup
                      )
                      await expect(
                          wav3sMirrorMulti.connect(Whale).withdrawMirrorBudget(pubId)
                      ).to.be.rejectedWith(
                        "Errors.wav3sMirrorMulti__withdraw__PostNotInitiated()"
                        )
                  })
                  it("Should revert no budget to withdraw", async function () {
                      const { wav3sMirrorMulti, Whale, budget, pubId, profileAddress } =
                          await loadFixture(deploywav3sMirrorMultiFixturePubFundedLittleBudget)
                      await expect(
                          wav3sMirrorMulti.connect(Whale).withdrawMirrorBudget(pubId)
                      ).to.be.rejectedWith(
                        "Errors.wav3sMirrorMulti__withdraw__BudgetEmpty()"
                        )
                  })
                  describe("Success", async function () {
                      it("Should withdraw succesfully", async function () {
                          const {
                              wav3sMirrorMulti,
                              Whale,
                              budget,
                              pubId,
                              profileAddress,
                              reward,
                              minFollowers,
                          } = await loadFixture(deploywav3sMirrorMultiFixturePubFunded)

                          let isWav3 = await wav3sMirrorMulti.isWav3(pubId)
                          expect(isWav3).to.equal(true)

                          mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(pubId)
                          expect(mirrorBudget).to.equal(budget.toString())

                          // check pre balances
                          preProfileBalance = await Currency.balanceOf(Whale.address)
                          preWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

                          // Should allow profile to withdraw funds
                          // should emit Events.wav3sMirrorMulti__PubWithdrawn(pubId, msg.sender);
                          await expect(wav3sMirrorMulti.connect(Whale).withdrawMirrorBudget(pubId))
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__PubWithdrawn")
                              .withArgs(budget.toString(),pubId, profileAddress)

                          // publication from isWav3 always true
                          isWav3 = await wav3sMirrorMulti.isWav3(pubId)
                          expect(isWav3).to.equal(true)

                          // mirrorBudget should be 0 in the end
                          mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(pubId)
                          expect(mirrorBudget).to.equal(0)

                          // check post balances

                          postProfileBalance = await Currency.balanceOf(Whale.address)
                          postWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

                          // balance of wav3sMirrorMulti should decrease in the budget amount
                          let expectedWav3sBalance = preWav3sBalance.sub(budget.toString())
                          assert.equal(
                              postWav3sBalance.toString(),
                              expectedWav3sBalance.toString(),
                              "Post wav3sMirrorMulti balance should be equal to pre balance minus mirrorBudget"
                          )

                          // balance of profile should increase in the budget withdrawn
                          let expectedProfileBalance = preProfileBalance.add(budget.toString())
                          assert.equal(
                              postProfileBalance.toString(),
                              expectedProfileBalance.toString(),
                              "Post profile balance should be equal to pre balance plus mirrorBudget"
                          )

                          // Get the publication data after the withdrawMirrorBudget function is called
                          let postPubData = await wav3sMirrorMulti.getPubData(pubId)

                          // Check if the values in the publication data have been reset
                          assert.equal(
                              postPubData.budget,
                              0,
                              "The budget value should be reset to 0"
                          )
                          assert.equal(
                              postPubData.reward,
                              reward.toString(),
                              "The reward value should be reward"
                          )
                
                          assert.equal(
                              postPubData.minFollowers,
                              minFollowers,
                              "The minFollowers value should remain"
                          )
                          expect(isWav3).to.equal(true)
                      })
                  })
              })
              describe("Circuit braker", async function () {
                  describe("Should not allow", async function () {
                      //should revert not in emergency
                      it("Should revert not owner", async function () {
                          const { wav3sMirrorMulti, anyProfileId } = await loadFixture(
                              deploywav3sMirrorMultiFixtureSetup
                          )
                          await expect(
                              wav3sMirrorMulti.connect(anyProfileId).circuitBreaker()
                          ).to.be.rejectedWith("Only the owner can call this function.")
                      })
                      it("Should not allow to fund", async function () {
                          const {
                              wav3sMirrorMulti,
                              wav3sHub,
                              pubId,
                              preBudget,
                              reward,
                              currencyAddress,
                              profileAddress,
                              minFollowers,
                              appAddress,
                          } = await loadFixture(deploywav3sMirrorMultiFixturePubFunded)

                          await expect(wav3sMirrorMulti.circuitBreaker())
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                              .withArgs(true)

                          await expect(
                              wav3sMirrorMulti
                                  .connect(wav3sHub)
                                  .fundMirror(
                                    preBudget.toString(),
                                    reward.toString(),
                                    profileAddress,
                                    minFollowers,
                                    currencyAddress
                                  )
                          ).to.be.rejectedWith(
                              "Emergency stop is active, function execution is prevented."
                          )
                      })
                      it("Should not allow to processMirror", async function () {
                          const { wav3sMirrorMulti, wav3sHub, pubId, anyProfileId } =
                              await loadFixture(deploywav3sMirrorMultiFixtureSetup)

                          await expect(wav3sMirrorMulti.circuitBreaker())
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                              .withArgs(true)

                              await expect(
                                wav3sMirrorMulti
                                    .connect(wav3sHub)
                                    .processMirror(
                                        pubId,
                                        anyProfileId.address.toString(),
                                        12                                  )
                            ).to.be.rejectedWith(
                                "Emergency stop is active, function execution is prevented."
                            )
                      })
                      it("Should not allow to Withdraw ", async function () {
                          const { wav3sMirrorMulti, Whale, pubId, anyProfileId } = await loadFixture(
                              deploywav3sMirrorMultiFixtureSetup
                          )

                          await expect(wav3sMirrorMulti.circuitBreaker())
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                              .withArgs(true)
                          await expect(
                              wav3sMirrorMulti.connect(Whale).withdrawMirrorBudget(pubId)
                          ).to.be.rejectedWith(
                              "Emergency stop is active, function execution is prevented."
                          )
                      })
                      it("Should revert sender not owner", async function () {
                          const { wav3sMirrorMulti, pubId, anyProfileId } = await loadFixture(
                              deploywav3sMirrorMultiFixturePubFunded
                          )

                          // should emit Events.wav3sMirrorMulti__PubWithdrawn(pubId, msg.sender);
                          await expect(
                              wav3sMirrorMulti.connect(anyProfileId).withdrawMirrorBudget(pubId)
                          ).to.be.rejectedWith(
                              "Errors.wav3sMirrorMulti__withdraw__NotSenderProfileToWithdraw()"
                          )
                      })
                  })
                  describe("EmergencyWithdraw", async function () {
                      it("Should revert invalid pubId", async function () {
                          const { wav3sMirrorMulti, wav3sHub, pubId } = await loadFixture(
                              deploywav3sMirrorMultiFixturePubFunded
                          )
                          await expect(wav3sMirrorMulti.circuitBreaker())
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                              .withArgs(true)
                          // should emit Events.wav3sMirrorMulti__PubWithdrawn(pubId, msg.sender);
                          await expect(
                              wav3sMirrorMulti.connect(wav3sHub).withdrawPub("")
                          ).to.be.rejectedWith(
                              "Errors.wav3sMirrorMulti__EmergencyWithdraw__InvalidPubId()"
                          )
                      })

                      it("Should revert wav3 not initiated", async function () {
                          const { wav3sMirrorMulti, wav3sHub, pubId } = await loadFixture(
                              deploywav3sMirrorMultiFixtureSetup
                          )
                          await expect(wav3sMirrorMulti.circuitBreaker())
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                              .withArgs(true)

                          await expect(
                              wav3sMirrorMulti.connect(wav3sHub).withdrawPub(pubId)
                          ).to.be.rejectedWith(
                              "Errors.wav3sMirrorMulti__EmergencyWithdraw__Wav3NotInitiated()"
                          )
                      })
                      it("Should revert no budget to withdraw", async function () {
                          const { wav3sMirrorMulti, wav3sHub, pubId } = await loadFixture(
                              deploywav3sMirrorMultiFixturePubFundedLittleBudget
                          )

                          await expect(wav3sMirrorMulti.circuitBreaker())
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                              .withArgs(true)

                          await expect(
                              wav3sMirrorMulti.connect(wav3sHub).withdrawPub(pubId)
                          ).to.be.rejectedWith(
                              "Errors.wav3sMirrorMulti__EmergencyWithdraw__NotEnoughBudgetToWithdraw()"
                          )
                      })
                      describe("Success", async function () {
                          it("Should allow withdrawing pub in emergency to wav3sHub", async function () {
                              const {
                                  wav3sMirrorMulti,
                                  Whale,
                                  wav3sHub,
                                  budget,
                                  pubId,
                                  profileAddress,
                                  currencyAddress,
                                  reward,
                                  minFollowers,
                                  feePerMirror,
                              } = await loadFixture(deploywav3sMirrorMultiFixturePubFunded)

                              await expect(wav3sMirrorMulti.circuitBreaker())
                                  .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                                  .withArgs(true)

                              let isWav3 = await wav3sMirrorMulti.isWav3(pubId)
                              expect(isWav3).to.equal(true)

                              mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(pubId)
                              expect(mirrorBudget).to.equal(budget.toString())

                              // check pre balances
                              preWav3sHubBalance = await Currency.balanceOf(wav3sHub.address)
                              preWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)

                              // Should allow profile to withdraw funds
                              // should emit Events.wav3sMirrorMulti__PubWithdrawn(pubId, msg.sender);

                              await expect(wav3sMirrorMulti.connect(wav3sHub).withdrawPub(pubId))
                                  .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__EmergencyWithdraw")
                                  .withArgs(pubId, budget.toString(), wav3sHub.address)
                              // publication from isWav3 always true
                              isWav3 = await wav3sMirrorMulti.isWav3(pubId)
                              expect(isWav3).to.equal(true)

                              // mirrorBudget should be 0 after withdraw
                              mirrorBudget = await wav3sMirrorMulti.getMirrorBudget(pubId)
                              expect(mirrorBudget).to.equal(0)

                              // check post balances

                              postWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)
                              postWav3sHubBalance = await Currency.balanceOf(wav3sHub.address)

                              // balance of wav3sMirrorMulti should decrease in the budget amount
                              let expectedWav3sBalance = preWav3sBalance.sub(budget.toString())
                              assert.equal(
                                  postWav3sBalance.toString(),
                                  expectedWav3sBalance.toString(),
                                  "Post wav3sMirrorMulti balance should be equal to pre balance minus mirrorBudget"
                              )

                              // balance of wav3sHub should increase in the budget withdrawn
                              let expectedWav3sHubBalance = preWav3sHubBalance.add(
                                  budget.toString()
                              )
                              assert.equal(
                                  postWav3sHubBalance.toString(),
                                  expectedWav3sHubBalance.toString(),
                                  "Post wavesHub balance should be equal to pre balance plus mirrorBudget"
                              )

                              // Get the publication data after the withdrawMirrorBudget function is called
                              let postPubData = await wav3sMirrorMulti.getPubData(pubId)

                              // Check if the values in the publication data have been reset
                              assert.equal(
                                  postPubData.budget,
                                  0,
                                  "The budget value should be reset to 0"
                              )
                              assert.equal(
                                  postPubData.reward,
                                  reward.toString(),
                                  "The reward value should be reward"
                              )
                           
                              assert.equal(
                                  postPubData.minFollowers,
                                  minFollowers,
                                  "The minFollowers value should remain"
                              )
                              expect(isWav3).to.equal(true)
                          })
                      })
                  })
        
                  describe("Backdoor", async function () {
                      it("Should revert not in emergency", async function () {
                          const {
                              wav3sMirrorMulti,
                              wav3sHub,
                              budget,
                              postAppFees,
                              appAddress,
                              currencyAddress,
                          } = await loadFixture(deploywav3sMirrorMultiFixturePubFundedLittleBudget)
                          await expect(
                              wav3sMirrorMulti.connect(wav3sHub).backdoor()
                          ).to.be.rejectedWith("Not in Emergency, function execution is prevented.")
                      })
                      it("Should revert not owner", async function () {
                          const {
                              wav3sMirrorMulti,
                              wav3sHub,
                              anyProfileId,
                              postAppFees,
                              appAddress,
                              currencyAddress,
                          } = await loadFixture(deploywav3sMirrorMultiFixturePubFundedLittleBudget)
                          // Circuit break
                          await expect(wav3sMirrorMulti.circuitBreaker())
                              .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                              .withArgs(true)
                          await expect(
                              wav3sMirrorMulti.connect(anyProfileId).backdoor()
                          ).to.be.rejectedWith("Only the owner can call this function.")
                      })
                      describe("Succes", async function () {
                          it("Should transfer funds to owner", async function () {
                              const {
                                  wav3sMirrorMulti,
                                  wav3sHub,
                                  deployer,
                                  anyProfileId,
                                  postAppFees,
                                  appAddress,
                                  currencyAddress,
                              } = await loadFixture(
                                  deploywav3sMirrorMultiFixturePubFundedLittleBudget
                              )

                              await expect(wav3sMirrorMulti.circuitBreaker())
                                  .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__CircuitBreak")
                                  .withArgs(true)

                              preWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)
                              preOwnerBalance = await Currency.balanceOf(deployer.address)

                              await expect(wav3sMirrorMulti.backdoor())
                                  .to.emit(wav3sMirrorMulti, "wav3sMirrorMulti__backdoor")
                                  .withArgs(preWav3sBalance)

                              postWav3sBalance = await Currency.balanceOf(wav3sMirrorMulti.address)
                              postOwnerBalance = await Currency.balanceOf(deployer.address)

                              // balance of wav3sMirrorMulti should be 0
                              let expectedWav3sBalance = 0
                              assert.equal(
                                  postWav3sBalance.toString(),
                                  expectedWav3sBalance.toString(),
                                  "Post wav3sMirrorMulti balance should be equal to pre balance minus postAppFees"
                              )

                              // balance of owner should increase in wav3sBalance
                              let expectedOwnerBalance = preOwnerBalance.add(
                                  preWav3sBalance.toString()
                              )
                              assert.equal(
                                  postOwnerBalance.toString(),
                                  expectedOwnerBalance.toString(),
                                  "Post owner balance should be equal to pre balance plus wav3sMirrorMulti balance"
                              )
                          })
                      })
                  })
              })
          })
      })

async function approveErc20(
    erc20Address,
    spenderAddress, // pool in deposit
    amountToSpend,
    account //deployer in deposit
) {
    const erc20Token = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        erc20Address,
        account
    )
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    //console.log("Approved! ", ethers.utils.formatEther(amountToSpend))
}