const { network, ethers } = require("hardhat")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("ZurfPreSale Unit Tests", async function () {
          //set log level to ignore non errors
          ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)
          let USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
          let USDT_WHALE = "0x21Cb017B40abE17B6DFb9Ba64A3Ab0f24A7e60EA"
          let BIG_WHALE = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245"
          let WHALE_USER = "0x06959153B974D0D5fDfd87D561db6d8d4FA0bb0B"
          let ZURF_TRIGGER = "0x092E67E9dbc47101760143f95056569CB0b3324f"
          let ZRF = "0x232804231dE32551F13A57Aa3984900428aDf990"
          let VAULT = "0x6af633e3b334b89dec13B9148e1Da24785606816"
          let SELLER = "0x2a69869950Dc9068c39eBE18E6E4676E818ac6d1"
          let _OWNER = "0xC2628eDdDB676c4cAF68aAD55d2191F6c9668624"
          // We define a fixture to reuse the same setup in every test.
          // We use loadFixture to run this setup once, snapshot that state,
          // and reset Hardhat Network to that snapshot in every test.
          async function deployZurfPreSaleFixture() {
              const [deployer] = await ethers.getSigners()
              accounts = await ethers.getSigners() // could also do with getNamedAccounts

              anyProfileId = accounts[2]

              const ZurfPreSaleFactory = await ethers.getContractFactory("ZurfPreSale")

              const ZurfPreSale = await ZurfPreSaleFactory
                  .connect(deployer)
                  .deploy(ZRF, USDT)
              return { ZurfPreSale }
          }
          // Fixture correctly set up
          async function deployZurfPreSaleFixtureSetup() {
              const [deployer] = await ethers.getSigners()
              accounts = await ethers.getSigners(1) // could also do with getNamedAccounts

              anyProfileId = accounts[2]

              // advance were zrf was deployed
              const blockNumDeploy = await ethers.provider.getBlockNumber();
              const blockDeploy = await ethers.provider.getBlock(blockNumDeploy);
              const timestampDeploy = blockDeploy.timestamp;
              console.log("Timestamp Date in deploy: ", timestampDeploy)

              const ZurfPreSaleFactory = await ethers.getContractFactory("ZurfPreSale")
              const ZurfPreSale = await ZurfPreSaleFactory
                  .connect(deployer)
                  .deploy(ZRF, USDT)
              await ZurfPreSale.whitelistZurfTrigger(ZURF_TRIGGER)
              await ZurfPreSale.whitelistZurfTrigger(_OWNER)

              await ZurfPreSale.setMinPurchase(BigNumber.from(10).pow(8))
            //  console.log("minimum purchase in USDT: ",BigNumber.from(10).pow(8) )
              const tokenAmount = BigNumber.from(10).pow(22).mul(4669)
              await ZurfPreSale.setTokenAmount(tokenAmount)
              const tokenRate = 667
              const sellerFee = 5;
              await ZurfPreSale.setTokenRate(tokenRate)
              await ZurfPreSale.whitelistSeller(SELLER, sellerFee)

             

              Currency = await ethers.getContractAt("IERC20", USDT)
              token = await ethers.getContractAt("IERC20", ZRF)

              // Unlock USDT whale
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [WHALE_USER],
              })
              // Unlock whale
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [BIG_WHALE],
              })
              // Unlock ZURF_TRIGGER account
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [ZURF_TRIGGER],
              })
                  // Unlock owner account
                  await network.provider.request({
                    method: "hardhat_impersonateAccount",
                    params: [_OWNER],
                })
              
              // GET SIGNERS
              const usdtWhale = await ethers.getSigner(WHALE_USER)
              const Whale = await ethers.getSigner(BIG_WHALE)
              const zurfTrigger = await ethers.getSigner(ZURF_TRIGGER)
              const owner = await ethers.getSigner(_OWNER)

              // GET BALANCES
              const investorPreBalance = await Currency.balanceOf(Whale.address)
              const vaultPreBalance = await Currency.balanceOf(VAULT)
              const preSalePreBalance = await Currency.balanceOf(ZurfPreSale.address)
              const ownerZRFbalance = await token.balanceOf(_OWNER)
              console.log("ZRF Owner balance: ",ownerZRFbalance )


              const investors=[WHALE_USER, BIG_WHALE]

              return {
                  ZurfPreSale,
                  _OWNER,
                  sellerFee,
                  deployer,
                  usdtWhale,
                  owner,
                  tokenRate,
                  SELLER,
                  token,
                  Currency,
                  tokenAmount,
                  WHALE_USER,
                  investors,
                  USDT,
                  anyProfileId,
                  VAULT,
                  Whale,
                  zurfTrigger,
                  Currency,               
                  investorPreBalance,
                  preSalePreBalance,
                  vaultPreBalance,
              }
          }
         

          describe("Zurf Pre Sale Stage 02", async function () {
              describe("Buy Allocation", async function () {
                  it("Should revert if buying less than the minimum", async function () {
                      const { ZurfPreSale, Whale, SELLER } = await loadFixture(deployZurfPreSaleFixtureSetup)
                      let investment = BigNumber.from(10).pow(7)

                      await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment.toString(),
                        Whale
                    )
                      await expect(
                        ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                    ).to.be.rejectedWith("Not enough minimum buying amount USDT.")
                  })

                  it("Should revert if its not a whitelisted seller", async function () {
                      const { ZurfPreSale,Whale, SELLER } = await loadFixture(deployZurfPreSaleFixtureSetup)
                      const fakeSeller = "0x0000000000000000000000000000000000000001"

                      let investment = BigNumber.from(10).pow(8)
                    //  console.log("investment: ", investment)

                      await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment.toString(),
                        Whale
                    )
                      await expect(
                        ZurfPreSale.connect(Whale).buyAllocation(investment,fakeSeller)
                    ).to.be.rejectedWith("Seller not whitelisted.")
                  
                  })
                  it("Should revert if investing more than 70.000 USD", async function () {
                    const { ZurfPreSale, SELLER, Whale,tokenAmount } = await loadFixture(deployZurfPreSaleFixtureSetup)

                  //  let investment = BigNumber.from(10).pow(10).mul(8)
                    let investment = BigNumber.from(10).pow(10).mul(7).add(BigNumber.from(1)).mul(BigNumber.from(10).pow(7));
                  //  console.log("investment: ", investment)

                    const whalebalance = await Currency.balanceOf(Whale.address)
                   // console.log("whale balance: ", whalebalance)

                    await approveErc20(
                      USDT,
                      ZurfPreSale.address,
                      investment.toString(),
                      Whale
                  )
                    await expect(
                      ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                  ).to.be.rejectedWith("Insufficient Zurf tokens available for allocation.")
                    
                    // All token remain
                    const remainingTokens =  await ZurfPreSale.getRemainingTokens()
                    await expect(remainingTokens).to.equal(tokenAmount)

                    // No token allocated
                    const allocatedTokens =  await ZurfPreSale.getTotalAllocatedTokens()
                    await expect(allocatedTokens).to.equal(0)
                    

                })
                it("Should not count twice an investor", async function () {
                    const { ZurfPreSale, SELLER, Whale,tokenAmount,tokenRate } = await loadFixture(deployZurfPreSaleFixtureSetup)

                    let investment = BigNumber.from(10).pow(8)
                    let expectedZurfTokens = BigNumber.from(10).pow(12).mul(investment).mul(tokenRate)
                     // Get the investors count before the second investment

                    await approveErc20(
                      USDT,
                      ZurfPreSale.address,
                      investment.toString(),
                      Whale
                  )
                    await expect(
                      ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                  ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                  .withArgs(Whale.address,investment.toString(),expectedZurfTokens, SELLER)
                    
                   // 100 USDT x 10^12 x 667 tokens allocated
                   const allocatedTokens =  await ZurfPreSale.getTotalAllocatedTokens()
                   await expect(allocatedTokens).to.equal(expectedZurfTokens)

                    // Remaining tokens
                    let remainingZurfTokens = BigNumber.from(tokenAmount).sub(expectedZurfTokens)

                    const remainingTokens =  await ZurfPreSale.getRemainingTokens()
                    await expect(remainingTokens).to.equal(remainingZurfTokens)

                    // invest again

                    await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment.toString(),
                        Whale
                    )

                    await expect(
                        ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                    ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                    .withArgs(Whale.address,investment.toString(),expectedZurfTokens, SELLER)

                    // Get the investors count after the second investment
                    const investorsCountAfterInvestment = await ZurfPreSale.investorsCount();

                    // Assert that the investors count remains unchanged after the second investment
                    expect(investorsCountAfterInvestment).to.equal(1);

                })
                it("Should emit round finished if 70.000 USD invested", async function () {
                    const { ZurfPreSale, SELLER, Whale,tokenAmount } = await loadFixture(deployZurfPreSaleFixtureSetup)

                    let investment = BigNumber.from(10).pow(10).mul(7);

                    await approveErc20(
                      USDT,
                      ZurfPreSale.address,
                      investment.toString(),
                      Whale
                  )
                    await expect(
                      ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                  ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                  .withArgs(Whale.address,investment.toString(),tokenAmount, SELLER).and.to.emit(ZurfPreSale, "zurfSeed__RoundFinished");
                    
                    // All token remain
                    const remainingTokens =  await ZurfPreSale.getRemainingTokens()
                    await expect(remainingTokens).to.equal(0)

                    // No token allocated
                    const allocatedTokens =  await ZurfPreSale.getTotalAllocatedTokens()
                    await expect(allocatedTokens).to.equal(tokenAmount)
                    
                })
                it("Should emit round finished if more than one investor invested", async function () {
                    const { ZurfPreSale, SELLER, Whale, usdtWhale,tokenAmount, tokenRate } = await loadFixture(deployZurfPreSaleFixtureSetup)

                    let investment = BigNumber.from(10).pow(10).mul(7).div(2);
                    let expectedZurfTokens = BigNumber.from(10).pow(12).mul(investment).mul(tokenRate)

                    await approveErc20(
                      USDT,
                      ZurfPreSale.address,
                      investment.toString(),
                      Whale
                  )
                  await approveErc20(
                    USDT,
                    ZurfPreSale.address,
                    investment.toString(),
                    usdtWhale
                )

                await expect(
                    ZurfPreSale.connect(usdtWhale).buyAllocation(investment,SELLER)
                ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                .withArgs(usdtWhale.address,investment.toString(),expectedZurfTokens, SELLER)

                    await expect(
                      ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                  ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                  .withArgs(Whale.address,investment.toString(),expectedZurfTokens, SELLER).and.to.emit(ZurfPreSale, "zurfSeed__RoundFinished");
                    
                    // No token remains
                    const remainingTokens =  await ZurfPreSale.getRemainingTokens()
                    await expect(remainingTokens).to.equal(0)

                    // All token allocated
                    const allocatedTokens =  await ZurfPreSale.getTotalAllocatedTokens()
                    await expect(allocatedTokens).to.equal(tokenAmount)

                    // Get the investors count after the second investment
                    const investorsCountAfterInvestment = await ZurfPreSale.investorsCount();

                    // Assert that the investors count remains unchanged after the second investment
                    expect(investorsCountAfterInvestment).to.equal(2);
                    
                })
              })
              describe("Calculate Vestings", async function () {
                  it("Should correctly calculate the cliff start", async function () {
                      const { ZurfPreSale, Whale,usdtWhale, SELLER, tokenAmount, tokenRate } = await loadFixture(deployZurfPreSaleFixtureSetup)
                      

                      const sevenDays = 15 * 24 * 60 * 60;

                    const blockNumBefore = await ethers.provider.getBlockNumber();
                    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                    const timestampBefore = blockBefore.timestamp;
                    try {
                        await advanceTime(15);
                       // console.log('EVM timestamp advanced by 15 days.');
                      } catch (error) {
                       // console.error('Error while advancing time:', error);
                      }

                    const blockNumAfter = await ethers.provider.getBlockNumber();
                    const blockAfter = await ethers.provider.getBlock(blockNumAfter);
                    const timestampAfter = blockAfter.timestamp;

                    expect(blockNumAfter).to.equal(blockNumBefore+1);
                    expect(timestampAfter).to.equal(timestampBefore + sevenDays);
                      //invest what is missing
                      let investment = BigNumber.from(10).pow(10).mul(7);

                     await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment.toString(),
                        Whale
                    )
     
                      await expect(
                        ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                    ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                    .withArgs(Whale.address,investment.toString(),tokenAmount, SELLER).and.to.emit(ZurfPreSale, "zurfSeed__RoundFinished");
                      
                    //check that the cliff start is half of cliffend and starting time
                    // Get the sale end
                    const saleEnd = await ZurfPreSale.saleEnd();

                    // Assert that the sale end is the new timestamp
                    expect(saleEnd).to.equal(timestampAfter+2);

                    // Get the cliff start
                    const cliffStart = await ZurfPreSale.cliffStart();

                    // Assert that the sale end is the new timestamp
                    expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-2);

                  })
                  it("Should correctly calculate vesting months of normal buyer", async function () {
                    const { ZurfPreSale, Whale,usdtWhale, SELLER, tokenAmount, tokenRate } = await loadFixture(deployZurfPreSaleFixtureSetup)
                    // after the round is closed vesting months of a small buyer must be correct
                      const sevenDays = 45 * 24 * 60 * 60;

                      const blockNumBefore = await ethers.provider.getBlockNumber();
                      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                      const timestampBefore = blockBefore.timestamp;
                      //console.log("timestampBefore", timestampBefore)
                      try {
                          await advanceTime(45);
                         // console.log('EVM timestamp advanced by 15 days.');
                        } catch (error) {
                         // console.error('Error while advancing time:', error);
                        }
  
                      const blockNumAfter = await ethers.provider.getBlockNumber();
                      const blockAfter = await ethers.provider.getBlock(blockNumAfter);
                      const timestampAfter = blockAfter.timestamp;
  
                      expect(blockNumAfter).to.equal(blockNumBefore+1);
                      expect(timestampAfter).to.equal(timestampBefore + sevenDays);
                        //invest what is missing
                        let investment = BigNumber.from(10).pow(6).mul(7496);
                        let investment2 = BigNumber.from(10).pow(6).mul(62504);
                        const multiplier = BigNumber.from(10).pow(12); // BigNumber representation of 10^12
                        // Calculate the expected number of tokens for Investor 1
                        const expectedTokensInvestor1 = investment.mul(tokenRate).mul(multiplier);
                        const expectedTokensInvestor2 = investment2.mul(tokenRate).mul(multiplier);

                        //
                        //console.log("investment", investment)
                        //console.log("investment2", investment2)

  
                       await approveErc20(
                          USDT,
                          ZurfPreSale.address,
                          investment.toString(),
                          Whale
                      )

                      await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment2.toString(),
                        usdtWhale
                    )
       
                    await expect(
                        ZurfPreSale.connect(usdtWhale).buyAllocation(investment2,SELLER)
                    ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                    .withArgs(usdtWhale.address,investment2.toString(),expectedTokensInvestor2, SELLER);
                    
                        await expect(
                          ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                      ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                      .withArgs(Whale.address,investment.toString(),expectedTokensInvestor1, SELLER).and.to.emit(ZurfPreSale, "zurfSeed__RoundFinished");
                        
                      //check that the cliff start is half of cliffend and starting time
                      // Get the sale end
                      const saleEnd = await ZurfPreSale.saleEnd();
  
                      // Assert that the sale end is the new timestamp
                      expect(saleEnd).to.equal(timestampAfter+4);
  
                      // Get the cliff start
                      const cliffStart = await ZurfPreSale.cliffStart();
  
                      // Assert that the sale end is the new timestamp
                      expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-1);

                      // Calculate timestamp of 30 january 2026
                      const vestEnds = 1767328000;

                      // Calculate months between 30 january 2026 and round up the cliff start month
                      const monthsDifference = getMonthsDifference(vestEnds, cliffStart);
                      //console.log("Months between 30th January 2026 and cliff start:", monthsDifference);
                      // Get vesting months from the contract 
                      const allocation = await ZurfPreSale.allocations(Whale.address);
                      const vestedDuration = allocation.vestedDuration; 
                      //console.log("Months of vesting according to the contract normal buyer", vestedDuration.toString());
    
                  })
                  it("Should correctly calculate vesting months of large buyer", async function () {
                    const { ZurfPreSale, Whale,usdtWhale, SELLER, tokenAmount, tokenRate } = await loadFixture(deployZurfPreSaleFixtureSetup)
                    // after the round is closed vesting months of a large buyer must be correct                      
                    const sevenDays = 15 * 24 * 60 * 60;

                  const blockNumBefore = await ethers.provider.getBlockNumber();
                  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                  const timestampBefore = blockBefore.timestamp;
                  try {
                      await advanceTime(15);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    }

                  const blockNumAfter = await ethers.provider.getBlockNumber();
                  const blockAfter = await ethers.provider.getBlock(blockNumAfter);
                  const timestampAfter = blockAfter.timestamp;

                  expect(blockNumAfter).to.equal(blockNumBefore+1);
                  expect(timestampAfter).to.equal(timestampBefore + sevenDays);
                    //invest what is missing
                    // 7497 USD => >0.5%
                    // 7496 USD => <0.5%
                    let investment = BigNumber.from(10).pow(6).mul(7497);

                    let investment2 = BigNumber.from(10).pow(6).mul(62503);

                    const multiplier = BigNumber.from(10).pow(12); // BigNumber representation of 10^12
                    // Calculate the expected number of tokens for Investor 1
                    const expectedTokensInvestor1 = investment.mul(tokenRate).mul(multiplier);
                    const expectedTokensInvestor2 = investment2.mul(tokenRate).mul(multiplier);


                   await approveErc20(
                      USDT,
                      ZurfPreSale.address,
                      investment.toString(),
                      Whale
                  )
                  await approveErc20(
                    USDT,
                    ZurfPreSale.address,
                    investment2.toString(),
                    usdtWhale
                )
   
                    await expect(
                      ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                  ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                  .withArgs(Whale.address,investment.toString(),expectedTokensInvestor1, SELLER);
                  await expect(
                    ZurfPreSale.connect(usdtWhale).buyAllocation(investment2,SELLER)
                ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                .withArgs(usdtWhale.address,investment2.toString(),expectedTokensInvestor2, SELLER);
                
                  //check that the cliff start is half of cliffend and starting time
                  // Get the sale end
                  const saleEnd = await ZurfPreSale.saleEnd();

                  // Assert that the sale end is the new timestamp
                  expect(saleEnd).to.equal(timestampAfter+4);

                  // Get the cliff start
                  const cliffStart = await ZurfPreSale.cliffStart();

                  // Assert that the sale end is the new timestamp
                  expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-1);
               
                   // Get vesting months from the contract 
                   const allocation = await ZurfPreSale.allocations(Whale.address);
                   const vestedDuration = allocation.vestedDuration;    
                   expect(vestedDuration).to.equal(48)  
                    // Get vesting months from the contract 
                    //console.log("Months of vesting according to the contract large buyer", vestedDuration.toString());
                })
              })
              describe("Drop Tokens", async function () {
                  it("Should revert if not zurf trigger dropping", async function () {
                      const { ZurfPreSale, ZURF_TRIGGER, Whale, anyProfileI, delpoyer } = await loadFixture(deployZurfPreSaleFixtureSetup)
                      await expect(
                        ZurfPreSale.connect(Whale).dropTokens()
                    ).to.be.rejectedWith("Errors.Only whitelisted triggers can call this function.")
                      
                  })
                  it("Should drop the correct amount per drop", async function () {
                    const { ZurfPreSale, owner,_OWNER, deployer, token, zurfTrigger,usdtWhale, Whale, anyProfileI, tokenAmount, tokenRate } = await loadFixture(deployZurfPreSaleFixtureSetup)

                      // copia y pega test anterior
                      const sevenDays = 15 * 24 * 60 * 60;

                      const blockNumBefore = await ethers.provider.getBlockNumber();
                      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                      const timestampBefore = blockBefore.timestamp;
                      try {
                          await advanceTime(15);
                         // console.log('EVM timestamp advanced by 15 days.');
                        } catch (error) {
                         // console.error('Error while advancing time:', error);
                        }
    
                      const blockNumAfter = await ethers.provider.getBlockNumber();
                      const blockAfter = await ethers.provider.getBlock(blockNumAfter);
                      const timestampAfter = blockAfter.timestamp;
    
                      expect(blockNumAfter).to.equal(blockNumBefore+1);
                      expect(timestampAfter).to.equal(timestampBefore + sevenDays);
                        //invest what is missing
                        // 7497 USD => >0.5%
                        // 7496 USD => <0.5%
                        let investment = BigNumber.from(10).pow(6).mul(7496);
    
                        let investment2 = BigNumber.from(10).pow(6).mul(62504);
    
                        const multiplier = BigNumber.from(10).pow(12); // BigNumber representation of 10^12
                        // Calculate the expected number of tokens for Investor 1
                        const expectedTokensInvestor1 = investment.mul(tokenRate).mul(multiplier);
                        const expectedTokensInvestor2 = investment2.mul(tokenRate).mul(multiplier);
    
                       await approveErc20(
                          USDT,
                          ZurfPreSale.address,
                          investment.toString(),
                          Whale
                      )
                      await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment2.toString(),
                        usdtWhale
                    )
       
                        await expect(
                          ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                      ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                      .withArgs(Whale.address,investment.toString(),expectedTokensInvestor1, SELLER);

                        await expect(
                            ZurfPreSale.connect(usdtWhale).buyAllocation(investment2,SELLER)
                        ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                        .withArgs(usdtWhale.address,investment2.toString(),expectedTokensInvestor2, SELLER);
                        
                      //check that the cliff start is half of cliffend and starting time
                      // Get the sale end
                      const saleEnd = await ZurfPreSale.saleEnd();
    
                      // Assert that the sale end is the new timestamp
                      expect(saleEnd).to.equal(timestampAfter+4);
    
                      // Get the cliff start
                      const cliffStart = await ZurfPreSale.cliffStart();
    
                      // Assert that the sale end is the new timestamp
                      expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-1);
                   
                       // Get vesting months investor1 from the contract 
                       const allocationInvestor1 = await ZurfPreSale.allocations(Whale.address);
                       const vestedDurationInvestor1 = allocationInvestor1.vestedDuration;
                       console.log("Vesting duration inv1: ",vestedDurationInvestor1 )    
                       expect(vestedDurationInvestor1).to.equal(28)    
                        // Get vesting months investor 2 from the contract 
                       const allocationInvestor2 = await ZurfPreSale.allocations(usdtWhale.address);
                       const vestedDurationInvestor2 = allocationInvestor2.vestedDuration;
                       console.log("Vesting duration inv1: ",vestedDurationInvestor2 )    
                       expect(vestedDurationInvestor2).to.equal(48)

                       const expectedDropInvestor1 = expectedTokensInvestor1.div(vestedDurationInvestor1);
                       const expectedDropInvestor2 = expectedTokensInvestor2.div(vestedDurationInvestor2);
                       const expectedTotaldrop = expectedDropInvestor1.add(expectedDropInvestor2);
                       console.log("Expected drop inv1: ",expectedDropInvestor1 )    
                       console.log("Expected drop inv2: ",expectedDropInvestor2 )    


                      // avanza el tiempo el cliff + 1 mes -1 dia, para que falle
                      const blockNumBefore2 = await ethers.provider.getBlockNumber();
                      const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
                      const timestampBefore2 = blockBefore2.timestamp;
                      try {
                          await advanceTime(82);
                         // console.log('EVM timestamp advanced by 15 days.');
                        } catch (error) {
                         // console.error('Error while advancing time:', error);
                        }
    
                      const blockNumAfter2 = await ethers.provider.getBlockNumber();
                      const blockAfter2 = await ethers.provider.getBlock(blockNumAfter2);
                      const timestampAfter2 = blockAfter2.timestamp;
                      // llama droptokens y entrega cero
                      await expect(
                        ZurfPreSale.connect(owner).dropTokens()
                    ).to.emit(ZurfPreSale,"zurfSeed__DropExecuted")
                    .withArgs(0)
                        
                      // avanza 1 dia
                      try {
                        await advanceTime(10);
                       // console.log('EVM timestamp advanced by 15 days.');
                      } catch (error) {
                       // console.error('Error while advancing time:', error);
                      }

                         // Get vesting months investor 2 from the contract 
                    const investorAllocation = await ZurfPreSale.allocations(usdtWhale.address);
                    const claimableAmount = investorAllocation.claimedTokens;
                    console.log("Claimable amount tokens: ",claimableAmount ) 
                      await expect(
                        ZurfPreSale.connect(owner).dropTokens()
                    ).to.be.rejectedWith("Not Enough tokens to drop")
                    
                    // Transfer tokens from owner to ZurfPreSale
                    await token.connect(owner).transfer(ZurfPreSale.address, tokenAmount);
                       // lee cantidad de tokens en el presale despues
                    const presaleBalanceToken = await token.balanceOf(ZurfPreSale.address)
                    console.log("ZRF Tokens in presale after transfer: ", presaleBalanceToken)

                    const preZRFBalanceInv1 = await token.balanceOf(Whale.address)
                    console.log("ZRF Tokens in inv1: ", preZRFBalanceInv1)
                    const preZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                    console.log("ZRF Tokens in inv2: ", preZRFBalanceInv2)

                    // call drop
                    await expect(
                        ZurfPreSale.connect(owner).dropTokens()
                    ).to.emit(ZurfPreSale, "zurfSeed__DropExecuted").withArgs(expectedTotaldrop)

                    // Get vesting months investor 2 from the contract 
                    const investorAllocationToken = await ZurfPreSale.allocations(usdtWhale.address);
                    const claimableAmountToken = investorAllocationToken.claimedTokens;
                    console.log("Claimable amount tokens (USDTWhale): ",claimableAmountToken ) 

                      // verifca que el normal buyer tiene ahora allocated/months vested tokens
                      const postZRFBalanceInv1 = await token.balanceOf(Whale.address)
                      console.log("ZRF Tokens in inv1 post drop: ", postZRFBalanceInv1)
                      const postZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                      console.log("ZRF Tokens in inv2 post drop: ", postZRFBalanceInv2)
                      
                    
                  })
                  it("Should transfer fees to the seller", async function () {
                    const { ZurfPreSale, owner,Currency, ZURF_TRIGGER,tokenRate,sellerFee, Whale,tokenAmount, usdtWhale, delpoyer } = await loadFixture(deployZurfPreSaleFixtureSetup)
                  
                    // Transfer tokens from owner to ZurfPreSale
                    await token.connect(owner).transfer(ZurfPreSale.address, tokenAmount);
                    // lee cantidad de tokens en el presale despues
                     const presaleBalanceToken = await token.balanceOf(ZurfPreSale.address)
                     console.log("ZRF Tokens in presale after transfer: ", presaleBalanceToken)

                    // verifica que el seller recibió sellerFee, y que el presale tiene invested - fees
                    const sellerUSDTprebalance = await Currency.balanceOf(SELLER)
                    const presaleUSTDprebalance = await Currency.balanceOf(ZurfPreSale.address)
                    // copia y pega test anterior
                     const sevenDays = 15 * 24 * 60 * 60;

                    const blockNumBefore = await ethers.provider.getBlockNumber();
                    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                    const timestampBefore = blockBefore.timestamp;
                    try {
                        await advanceTime(15);
                       // console.log('EVM timestamp advanced by 15 days.');
                      } catch (error) {
                       // console.error('Error while advancing time:', error);
                      }
  
                    const blockNumAfter = await ethers.provider.getBlockNumber();
                    const blockAfter = await ethers.provider.getBlock(blockNumAfter);
                    const timestampAfter = blockAfter.timestamp;
  
                    expect(blockNumAfter).to.equal(blockNumBefore+1);
                    expect(timestampAfter).to.equal(timestampBefore + sevenDays);
                      //invest what is missing
                      // 7497 USD => >0.5%
                      // 7496 USD => <0.5%
                      let investment = BigNumber.from(10).pow(6).mul(7496);
  
                      let investment2 = BigNumber.from(10).pow(6).mul(62504);
  
                      const multiplier = BigNumber.from(10).pow(12); // BigNumber representation of 10^12
                      // Calculate the expected number of tokens for Investor 1
                      const expectedTokensInvestor1 = investment.mul(tokenRate).mul(multiplier);
                      const expectedTokensInvestor2 = investment2.mul(tokenRate).mul(multiplier);
  
                     await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment.toString(),
                        Whale
                    )
                    await approveErc20(
                      USDT,
                      ZurfPreSale.address,
                      investment2.toString(),
                      usdtWhale
                  )
     
                      await expect(
                        ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                    ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                    .withArgs(Whale.address,investment.toString(),expectedTokensInvestor1, SELLER);

                      await expect(
                          ZurfPreSale.connect(usdtWhale).buyAllocation(investment2,SELLER)
                      ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                      .withArgs(usdtWhale.address,investment2.toString(),expectedTokensInvestor2, SELLER);
                      
                    //check that the cliff start is half of cliffend and starting time
                    // Get the sale end
                    const saleEnd = await ZurfPreSale.saleEnd();
  
                    // Assert that the sale end is the new timestamp
                    expect(saleEnd).to.equal(timestampAfter+4);
  
                    // Get the cliff start
                    const cliffStart = await ZurfPreSale.cliffStart();
  
                    // Assert that the sale end is the new timestamp
                    // sustract 1 or 2 to keep up with interactions with the blockchain (approve or connect)
                    expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-2);
                 
                     // Get vesting months investor1 from the contract 
                     const allocationInvestor1 = await ZurfPreSale.allocations(Whale.address);
                     const vestedDurationInvestor1 = allocationInvestor1.vestedDuration;
                     console.log("Vesting duration inv1: ",vestedDurationInvestor1 )    
                     expect(vestedDurationInvestor1).to.equal(28)    
                      // Get vesting months investor 2 from the contract 
                     const allocationInvestor2 = await ZurfPreSale.allocations(usdtWhale.address);
                     const vestedDurationInvestor2 = allocationInvestor2.vestedDuration;
                     console.log("Vesting duration inv1: ",vestedDurationInvestor2 )    
                     expect(vestedDurationInvestor2).to.equal(48)

                     const expectedDropInvestor1 = expectedTokensInvestor1.div(vestedDurationInvestor1);
                     const expectedDropInvestor2 = expectedTokensInvestor2.div(vestedDurationInvestor2);
                     const expectedTotaldrop = expectedDropInvestor1.add(expectedDropInvestor2);
                     console.log("Expected drop inv1: ",expectedDropInvestor1 )    
                     console.log("Expected drop inv2: ",expectedDropInvestor2 )    


                    // avanza el tiempo el cliff + 1 mes -1 dia, para que falle
                    const blockNumBefore2 = await ethers.provider.getBlockNumber();
                    const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
                    const timestampBefore2 = blockBefore2.timestamp;
                    try {
                        await advanceTime(83);
                       // console.log('EVM timestamp advanced by 15 days.');
                      } catch (error) {
                       // console.error('Error while advancing time:', error);
                      }

                  const preZRFBalanceInv1 = await token.balanceOf(Whale.address)
                  console.log("ZRF Tokens in inv1: ", preZRFBalanceInv1)
                  const preZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                  console.log("ZRF Tokens in inv2: ", preZRFBalanceInv2)

                  // call drop
                  await expect(
                      ZurfPreSale.connect(owner).dropTokens()
                  ).to.emit(ZurfPreSale, "zurfSeed__DropExecuted").withArgs(expectedTotaldrop)

                  // Get vesting months investor 2 from the contract 
                  const investorAllocationToken = await ZurfPreSale.allocations(usdtWhale.address);
                  const claimableAmountToken = investorAllocationToken.claimedTokens;
                  console.log("Claimable amount tokens (USDTWhale): ",claimableAmountToken ) 

                    // verifca que el normal buyer tiene ahora allocated/months vested tokens
                    const postZRFBalanceInv1 = await token.balanceOf(Whale.address)
                    console.log("ZRF Tokens in inv1 post drop: ", postZRFBalanceInv1)
                    const postZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                    console.log("ZRF Tokens in inv2 post drop: ", postZRFBalanceInv2)

                   

                    const expectedSellerFees1 = investment.mul(sellerFee).div(100);
                    const expectedSellerFees2 = investment2.mul(sellerFee).div(100);
                    const totalExpectedSellerFees = expectedSellerFees1.add(expectedSellerFees2)
                    const totalExpectedPresaleBalance = investment.add(investment2).mul(100-sellerFee).div(100)

                    // Assert that the sale end is the new timestamp
                 
                    console.log("USDT in seller's wallet: ", sellerUSDTprebalance)
                    console.log("USDT in presale's wallet: ", presaleUSTDprebalance)

                    // verifica que el seller recibió sellerFee, y que el presale tiene invested - fees
                    const sellerUSDTpostbalance = await Currency.balanceOf(SELLER)
                    const presaleUSDTpostbalance = await Currency.balanceOf(ZurfPreSale.address)
                    console.log("USDT in seller's AFTER wallet: ", sellerUSDTpostbalance)
                    console.log("USDT in presale's AFTER wallet: ", presaleUSDTpostbalance)
                    expect(sellerUSDTpostbalance).to.equal(sellerUSDTprebalance+totalExpectedSellerFees);
                    expect(presaleUSDTpostbalance).to.equal(totalExpectedPresaleBalance);



                })
                it("Investor allocation over correcly", async function () {
                  const { ZurfPreSale, owner,_OWNER, deployer, token, zurfTrigger,usdtWhale, Whale, anyProfileI, tokenAmount, tokenRate } = await loadFixture(deployZurfPreSaleFixtureSetup)

                    // copia y pega test anterior
                    const sevenDays = 15 * 24 * 60 * 60;

                    const blockNumBefore = await ethers.provider.getBlockNumber();
                    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                    const timestampBefore = blockBefore.timestamp;
                    try {
                        await advanceTime(15);
                       // console.log('EVM timestamp advanced by 15 days.');
                      } catch (error) {
                       // console.error('Error while advancing time:', error);
                      }
  
                    const blockNumAfter = await ethers.provider.getBlockNumber();
                    const blockAfter = await ethers.provider.getBlock(blockNumAfter);
                    const timestampAfter = blockAfter.timestamp;
  
                    expect(blockNumAfter).to.equal(blockNumBefore+1);
                    expect(timestampAfter).to.equal(timestampBefore + sevenDays);
                      //invest what is missing
                      // 7497 USD => >0.5%
                      // 7496 USD => <0.5%
                      let investment = BigNumber.from(10).pow(6).mul(7496);
  
                      let investment2 = BigNumber.from(10).pow(6).mul(62504);
  
                      const multiplier = BigNumber.from(10).pow(12); // BigNumber representation of 10^12
                      // Calculate the expected number of tokens for Investor 1
                      const expectedTokensInvestor1 = investment.mul(tokenRate).mul(multiplier);
                      const expectedTokensInvestor2 = investment2.mul(tokenRate).mul(multiplier);
  
                     await approveErc20(
                        USDT,
                        ZurfPreSale.address,
                        investment.toString(),
                        Whale
                    )
                    await approveErc20(
                      USDT,
                      ZurfPreSale.address,
                      investment2.toString(),
                      usdtWhale
                  )
     
                      await expect(
                        ZurfPreSale.connect(Whale).buyAllocation(investment,SELLER)
                    ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                    .withArgs(Whale.address,investment.toString(),expectedTokensInvestor1, SELLER);

                      await expect(
                          ZurfPreSale.connect(usdtWhale).buyAllocation(investment2,SELLER)
                      ).to.emit(ZurfPreSale, "zurfSeed__NewInvestment")
                      .withArgs(usdtWhale.address,investment2.toString(),expectedTokensInvestor2, SELLER);
                      
                    //check that the cliff start is half of cliffend and starting time
                    // Get the sale end
                    const saleEnd = await ZurfPreSale.saleEnd();
  
                    // Assert that the sale end is the new timestamp
                    expect(saleEnd).to.equal(timestampAfter+4);
  
                    // Get the cliff start
                    const cliffStart = await ZurfPreSale.cliffStart();
  
                    // Assert that the sale end is the new timestamp
                    expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-1);
                 
                     // Get vesting months investor1 from the contract 
                     const allocationInvestor1 = await ZurfPreSale.allocations(Whale.address);
                     const vestedDurationInvestor1 = allocationInvestor1.vestedDuration;
                     console.log("Vesting duration inv1: ",vestedDurationInvestor1 )    
                     expect(vestedDurationInvestor1).to.equal(28)    
                      // Get vesting months investor 2 from the contract 
                     const allocationInvestor2 = await ZurfPreSale.allocations(usdtWhale.address);
                     const vestedDurationInvestor2 = allocationInvestor2.vestedDuration;
                     console.log("Vesting duration inv1: ",vestedDurationInvestor2 )    
                     expect(vestedDurationInvestor2).to.equal(48)

                     const expectedDropInvestor1 = expectedTokensInvestor1.div(vestedDurationInvestor1);
                     const expectedDropInvestor2 = expectedTokensInvestor2.div(vestedDurationInvestor2);
                     const expectedTotaldrop = expectedDropInvestor1.add(expectedDropInvestor2);
                     console.log("Expected drop inv1: ",expectedDropInvestor1 )    
                     console.log("Expected drop inv2: ",expectedDropInvestor2 )    


                    // avanza el tiempo el cliff + 1 mes -1 dia, para que falle
                    const blockNumBefore2 = await ethers.provider.getBlockNumber();
                    const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
                    const timestampBefore2 = blockBefore2.timestamp;
                    try {
                        await advanceTime(82);
                       // console.log('EVM timestamp advanced by 15 days.');
                      } catch (error) {
                       // console.error('Error while advancing time:', error);
                      }
  
                    const blockNumAfter2 = await ethers.provider.getBlockNumber();
                    const blockAfter2 = await ethers.provider.getBlock(blockNumAfter2);
                    const timestampAfter2 = blockAfter2.timestamp;
                    // llama droptokens y entrega cero
                    await expect(
                      ZurfPreSale.connect(owner).dropTokens()
                  ).to.emit(ZurfPreSale,"zurfSeed__DropExecuted")
                  .withArgs(0)
                      
                    // avanza 1 dia
                    try {
                      await advanceTime(1);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    }

                       // Get vesting months investor 2 from the contract 
                  const investorAllocation = await ZurfPreSale.allocations(usdtWhale.address);
                  const claimableAmount = investorAllocation.claimedTokens;
                  console.log("Claimable amount tokens: ",claimableAmount ) 
                    await expect(
                      ZurfPreSale.connect(owner).dropTokens()
                  ).to.be.rejectedWith("Not Enough tokens to drop")
                  
                  // Transfer tokens from owner to ZurfPreSale
                  await token.connect(owner).transfer(ZurfPreSale.address, tokenAmount);
                     // lee cantidad de tokens en el presale despues
                  const presaleBalanceToken = await token.balanceOf(ZurfPreSale.address)
                  console.log("ZRF Tokens in presale after transfer: ", presaleBalanceToken)

                  const preZRFBalanceInv1 = await token.balanceOf(Whale.address)
                  console.log("ZRF Tokens in inv1: ", preZRFBalanceInv1)
                  const preZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                  console.log("ZRF Tokens in inv2: ", preZRFBalanceInv2)

                  // call drop
                  await expect(
                      ZurfPreSale.connect(owner).dropTokens()
                  ).to.emit(ZurfPreSale, "zurfSeed__DropExecuted").withArgs(expectedTotaldrop)

                  // Get vesting months investor 2 from the contract 
                  const investorAllocationToken = await ZurfPreSale.allocations(usdtWhale.address);
                  const claimableAmountToken = investorAllocationToken.claimedTokens;
                  console.log("Claimable amount tokens (USDTWhale): ",claimableAmountToken ) 

                    // verifca que el normal buyer tiene ahora allocated/months vested tokens
                    const postZRFBalanceInv1 = await token.balanceOf(Whale.address)
                    console.log("ZRF Tokens in inv1 post drop: ", postZRFBalanceInv1)
                    const postZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                    console.log("ZRF Tokens in inv2 post drop: ", postZRFBalanceInv2)
                    
                    // avanza hasta el dia del ultimo drop del normal buyer
                    // 27 meses x 30 dias
                    try {
                    await advanceTime(810);
                    // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                    // console.error('Error while advancing time:', error);
                    }

                  // Get vesting months investor 2 from the contract 
                  const vestedTokensInv1 = await ZurfPreSale.calculateVestedAmount(Whale.address);
                  console.log("Vested amount of tokens (Whale): ",vestedTokensInv1) 

                // call drop
                       await expect(
                        ZurfPreSale.connect(owner).dropTokens()
                    ).to.emit(ZurfPreSale, "zurfSeed__DropExecuted")

                    const finalZRFBalanceInv1 = await token.balanceOf(Whale.address)
                    console.log("ZRF Tokens in inv1 finished: ", finalZRFBalanceInv1)

                    expect(finalZRFBalanceInv1).to.equal(expectedTokensInvestor1);

                    // avanza hasta el dia del ultimo drop del large buyer
                    // 20 meses x 30 dias (se avanza 1 mes al principio, más 27 meses)
                    try {
                        await advanceTime(600);
                        // console.log('EVM timestamp advanced by 15 days.');
                        } catch (error) {
                        // console.error('Error while advancing time:', error);
                        }

                    // Get vesting months investor from the contract 
                    const vestedTokensInv2 = await ZurfPreSale.calculateVestedAmount(usdtWhale.address);
                    console.log("Vested amount of tokens (usdtWhale): ",vestedTokensInv2) 

                    // call drop
                       await expect(
                        ZurfPreSale.connect(owner).dropTokens()
                    ).to.emit(ZurfPreSale, "zurfSeed__DropExecuted")

                    const finalZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                    console.log("ZRF Tokens in inv2 finished: ", finalZRFBalanceInv2)

                    expect(finalZRFBalanceInv2).to.equal(expectedTokensInvestor2);
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

// Function to advance the EVM timestamp by the specified number of days
async function advanceTime(days) {
    // Get the current block's timestamp
    const currentBlock = await ethers.provider.getBlock('latest');
    const currentTimestamp = currentBlock.timestamp;
  
    // Calculate the new timestamp with an additional 15 days (in seconds)
    const secondsInADay = 86400; // 24 hours * 60 minutes * 60 seconds
    const newTimestampInSeconds = currentTimestamp + days * secondsInADay;
  
    // Advance the EVM to the new timestamp by mining a new block
    await ethers.provider.send('evm_mine', [newTimestampInSeconds]);
  }

  function getMonthsDifference(startDate, endDate) {
    const start = new Date(startDate * 1000); // Convert Unix timestamp to milliseconds
    const end = new Date(endDate * 1000); // Convert Unix timestamp to milliseconds
  
    let yearsDiff = end.getUTCFullYear() - start.getUTCFullYear();
    let monthsDiff = end.getUTCMonth() - start.getUTCMonth();
  
    if (monthsDiff < 0) {
      yearsDiff -= 1;
      monthsDiff += 12;
    }
  
    return yearsDiff * 12 + monthsDiff;
  }