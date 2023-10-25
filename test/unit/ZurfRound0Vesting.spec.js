const { network, ethers } = require("hardhat")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("ZurfRound0Vesting Unit Tests", async function () {
          //set log level to ignore non errors
          ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

          let ZURF_TRIGGER = "0x092E67E9dbc47101760143f95056569CB0b3324f"
          let ZRF = "0x232804231dE32551F13A57Aa3984900428aDf990"
          let _OWNER = "0xC2628eDdDB676c4cAF68aAD55d2191F6c9668624"
          let WHALE_USER = "0x06959153B974D0D5fDfd87D561db6d8d4FA0bb0B"
          let BIG_WHALE = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245"

           // Define an array of addresses
           let investors = [
            "0x85cc29f41f6e9b8648442000bb1f87e7a12fd99e",
            "0x89d36091f9ec93c98756ed90bcadd72a713759f7",
            "0x9437fe6385f3551850fd892d471ffbc818cf3116",
          ];
         const zrfTokens1 = BigNumber.from(10).pow(18).mul(155724)
         const zrfTokens2 = BigNumber.from(10).pow(18).mul(3854546)
         const zrfTokens3 = BigNumber.from(10).pow(18).mul(77091)

          let zurfTokens = [
            zrfTokens1,
            zrfTokens2,
            zrfTokens3,
            ]
          
          let cliffMonths = 1;
          let vestingMonths = 29;
          let vestingMonthsLargeInvestor = 48;

          // We define a fixture to reuse the same setup in every test.
          // We use loadFixture to run this setup once, snapshot that state,
          // and reset Hardhat Network to that snapshot in every test.

          async function deployZurfRound0VestingFixture() {
              const [deployer] = await ethers.getSigners()
              accounts = await ethers.getSigners() // could also do with getNamedAccounts

              anyProfileId = accounts[2]

              const ZurfRound0VestingFactory = await ethers.getContractFactory("ZurfRound0Vesting")

              const ZurfRound0Vesting = await ZurfRound0VestingFactory
                  .connect(deployer)
                  .deploy(ZRF)
              return { ZurfRound0Vesting }
          }
          // Fixture correctly set up
          async function deployZurfRound0VestingFixtureSetup() {
              const [deployer] = await ethers.getSigners()
              accounts = await ethers.getSigners(1) // could also do with getNamedAccounts

              anyProfileId = accounts[2]
              Currency = ZRF;

              // advance were zrf was deployed
              const blockNumDeploy = await ethers.provider.getBlockNumber();
              const blockDeploy = await ethers.provider.getBlock(blockNumDeploy);
              const timestampDeploy = blockDeploy.timestamp;
              console.log("Timestamp Date in deploy: ", timestampDeploy)

              const ZurfRound0VestingFactory = await ethers.getContractFactory("ZurfRound0Vesting")
              const ZurfRound0Vesting = await ZurfRound0VestingFactory
                  .connect(deployer)
                  .deploy(ZRF)
              //await ZurfRound0Vesting.whitelistZurfTrigger(ZURF_TRIGGER)
              await ZurfRound0Vesting.whitelistZurfTrigger(WHALE_USER)
              await ZurfRound0Vesting.whitelistZurfTrigger(_OWNER)

              const tokenAmount = BigNumber.from(10).pow(18).mul(4087361)
              await ZurfRound0Vesting.setTokenAmount(tokenAmount)

              token = await ethers.getContractAt("IERC20", ZRF)

              // Unlock ZURF_TRIGGER account
              await network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [BIG_WHALE],
              })
              // Unlock owner account
              await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [_OWNER],
              })
              // Unlock USDT whale
              await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [WHALE_USER],
              })
              
              // GET SIGNERS
              const  notTrigger = await ethers.getSigner(BIG_WHALE)
              const zurfTrigger  = await ethers.getSigner(WHALE_USER)
              const owner = await ethers.getSigner(_OWNER)

              // GET BALANCES
              const investor1preBalance = await token.balanceOf(investors[0])
              const investor2preBalance = await token.balanceOf(investors[1])
              const investor3preBalance = await token.balanceOf(investors[2])

              const round0VesterPreBalance = await token.balanceOf(ZurfRound0Vesting.address)

              // Transfer tokens from owner to ZurfPreSale
              await token.connect(owner).transfer(ZurfRound0Vesting.address, tokenAmount);
                // lee cantidad de tokens en el presale despues
             const round0Vester = await token.balanceOf(ZurfRound0Vesting.address)
             console.log("ZRF Tokens in presale before transfer: ", round0VesterPreBalance)

             console.log("ZRF Tokens in presale after transfer: ", round0Vester)

             const preZRFBalanceInv1 = await token.balanceOf(investors[0])
             console.log("ZRF Tokens in inv1: ", preZRFBalanceInv1)
             const preZRFBalanceInv2 = await token.balanceOf(investors[1])
             console.log("ZRF Tokens in inv2: ", preZRFBalanceInv2)

              console.log("ZRF investor1preBalance: ",investor1preBalance.toString() )
              console.log("ZRF investor2preBalance: ",investor2preBalance.toString() )
              console.log("ZRF investor3preBalance: ",investor3preBalance.toString() )

              await ZurfRound0Vesting.connect(zurfTrigger).loadVestingData(investors, zurfTokens, 1, 29, 48, true)

              return {
                  ZurfRound0Vesting,
                  zurfTokens,
                  notTrigger,
                  _OWNER,
                  deployer,
                  owner,
                  token,
                  tokenAmount,
                  investors,
                  anyProfileId,
                  zurfTrigger,
              }
          }

          describe("Zurf Pre Sale Stage 02", async function () {
              describe("Load vesting data", async function () {
                it("Should inform correct number of investors and correct allocations", async function () {
                    const { ZurfRound0Vesting } = await loadFixture(deployZurfRound0VestingingFixtureSetup)

                    // read investorsCount
                    const investorsCount = await ZurfRound0Vesting.investorsCount();
                    // Verify that the number of investors is correct
                    assert.equal(investorsCount.toNumber(), 3, "El valor de investorsCount no es el esperado");

                    // read allocation investor1
                    const investor1Allocation = await ZurfRound0Vesting.allocations(investors[0]);
                    const inv1AllocatedTokens = investor1Allocation.allocatedTokens;
                    assert.equal(inv1AllocatedTokens.toString(), zurfTokens[0], "Incorrect allocation inv1");

                    // read allocation investor2
                    const investor2Allocation = await ZurfRound0Vesting.allocations(investors[1]);
                    const inv2AllocatedTokens = investor2Allocation.allocatedTokens;
                    assert.equal(inv2AllocatedTokens.toString(), zurfTokens[1], "Incorrect allocation inv2");

                    // read allocation investor3
                    const investor3Allocation = await ZurfRound0Vesting.allocations(investors[2]);
                    const inv3AllocatedTokens = investor3Allocation.allocatedTokens;
                    assert.equal(inv3AllocatedTokens.toString(), zurfTokens[2], "Incorrect allocation inv3");


                  })
              })
              
                describe("Claimable tokens change during the vesting period", async function () {

                  it("Should give 0 claimable tokens if cliff period is not over", async function () {
                      const { ZurfRound0Vesting,zurfTokens ,zurfTrigger} = await loadFixture(deployZurfRound0VestingFixtureSetup)
                  // Advance 1 month + 1 day
                  try {
                    await advanceTime(59);
                   // console.log('EVM timestamp advanced by n days.');
                  } catch (error) {
                   // console.error('Error while advancing time:', error);
                  }
                  // Check if claimable tokens are still 0
                  let lockedInv1 = await ZurfRound0Vesting.connect(zurfTrigger).getLocked(investors[0])
                  console.log("locked zrf of investor 1:",lockedInv1 )
                  console.log("total allocated inv1: ", zurfTokens[0])
                  await expect(lockedInv1).to.equal(zurfTokens[0])
                              
                  })
                  it("Should give the correct amount of claimable tokens after 1 month after the cliff", async function () {
                    const { ZurfRound0Vesting, zurfTrigger, zurfTokens, investors } = await loadFixture(deployZurfRound0VestingFixtureSetup)

                    try {
                      await advanceTime(60);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    } 
                       // Check if claimable tokens are still 0
                       const lockedInv1 = await ZurfRound0Vesting.connect(zurfTrigger).getLocked(investors[0])
                       console.log("Locked ZRF of investor 1:",lockedInv1 )
                       console.log("Total allocated inv1: ", zurfTokens[0])
                       await expect(lockedInv1).to.not.be.equal(zurfTokens[0])

                })
                it("Tokens can be dropped and allocations update", async function () {
                    const { ZurfRound0Vesting, zurfTrigger, investors,zurfTokens, token } = await loadFixture(deployZurfRound0VestingFixtureSetup)

                    try {
                      await advanceTime(60);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    } 
                       // Check if claimable tokens are still 0
                       // check balance of contract
                    const round0VestTokenpreBalance = await token.balanceOf(ZurfRound0Vesting.address)
                    console.log("ZRF Tokens in vesting contract before drop: ", round0VestTokenpreBalance)
                    await expect(ZurfRound0Vesting.connect(zurfTrigger).dropTokens()).to.emit(ZurfRound0Vesting,"zurfSeed__DropExecuted")/*.withArgs(140943482758620689655170)*/
                    
                    // check balance of contract
                    let round0VestTokenBalance = await token.balanceOf(ZurfRound0Vesting.address)
                    console.log("ZRF Tokens in vesting contract after  drop: ", round0VestTokenBalance)
                    // check claimable tokens investors
                    let vestedAmountInv1 = await ZurfRound0Vesting.calculateVestedAmount(investors[0])
                    console.log("vested amount inv 1: ", vestedAmountInv1)
                    console.log("expected amount inv 1: ", (zurfTokens[0]/29).toString())

                    // check balance of investors
                    let investor1TokenBalance = await token.balanceOf(investors[0])
                    console.log("ZRF in inv1 wallet: ", investor1TokenBalance);
                    // check balance of contract
                    let investor2TokenBalance = await token.balanceOf(investors[1])
                    console.log("ZRF in inv2 wallet: ", investor2TokenBalance)
                    // check balance of contract
                    let investor3TokenBalance = await token.balanceOf(investors[2])
                    console.log("ZRF in inv3 wallet: ", investor3TokenBalance)

                })
                it("After the cliff and vesting period, all should be transfered", async function () {
                    const { ZurfRound0Vesting, zurfTrigger, zurfTokens,investors } = await loadFixture(deployZurfRound0VestingFixtureSetup)

                    try {
                      await advanceTime(30*30);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    } 

                    await expect(ZurfRound0Vesting.connect(zurfTrigger).dropTokens()).to.emit(ZurfRound0Vesting,"zurfSeed__DropExecuted")/*.withArgs(140943482758620689655170)*/
       
                    // check balance of contract
                    round0VestTokenBalance = await token.balanceOf(ZurfRound0Vesting.address)
                    console.log("ZRF Tokens in vesting contract after last drop: ", round0VestTokenBalance)
                    // check claimable tokens investors
                    vestedAmountInv1 = await ZurfRound0Vesting.calculateVestedAmount(investors[0])
                    console.log("vested amount inv 1: ", vestedAmountInv1)
                    console.log("expected amount inv 1: ", zurfTokens[0])

                    // check balance of investors
                    investor1TokenBalance = await token.balanceOf(investors[0])
                    console.log("ZRF in inv1 wallet: ", investor1TokenBalance);
                    // check balance of contract
                    investor2TokenBalance = await token.balanceOf(investors[1])
                    console.log("ZRF in inv2 wallet: ", investor2TokenBalance)
                    // check balance of contract
                    investor3TokenBalance = await token.balanceOf(investors[2])
                    console.log("ZRF in inv3 wallet: ", investor3TokenBalance)

                    try {
                      await advanceTime(30);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    } 

                    await expect(ZurfRound0Vesting.connect(zurfTrigger).dropTokens()).to.emit(ZurfRound0Vesting,"zurfSeed__DropExecuted").withArgs(0)
       
                    // check balance of contract
                    round0VestTokenBalance = await token.balanceOf(ZurfRound0Vesting.address)
                    console.log("ZRF Tokens in vesting contract after last drop: ", round0VestTokenBalance)
                    // check claimable tokens investors
                    vestedAmountInv1 = await ZurfRound0Vesting.calculateVestedAmount(investors[0])
                    console.log("vested amount inv 1: ", vestedAmountInv1)
                    console.log("expected amount inv 1: ", zurfTokens[0])

                    // check balance of investors
                    investor1TokenBalance = await token.balanceOf(investors[0])
                    console.log("ZRF in inv1 wallet: ", investor1TokenBalance);
                    // check balance of contract
                    investor2TokenBalance = await token.balanceOf(investors[1])
                    console.log("ZRF in inv2 wallet: ", investor2TokenBalance)
                    // check balance of contract
                    investor3TokenBalance = await token.balanceOf(investors[2])
                    console.log("ZRF in inv3 wallet: ", investor3TokenBalance)
                    
                })
              })
              describe("Drop Tokens", async function () {
                  it("Should revert if not zurf trigger dropping", async function () {
                      const { ZurfRound0Vesting, notTrigger, Whale, anyProfileId, deployer } = await loadFixture(deployZurfRound0VestingFixtureSetup)
                      await expect(
                        ZurfRound0Vesting.connect(notTrigger).dropTokens()
                    ).to.be.rejectedWith("Errors.Only whitelisted triggers can call this function.")
                      
                  })
                  it("Should drop the correct amount per drop", async function () {
                    const { ZurfRound0Vesting, zurfTrigger, zurfTokens,investors } = await loadFixture(deployZurfRound0VestingFixtureSetup)
                    try {
                      await advanceTime(29*30);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    } 

                    await expect(ZurfRound0Vesting.connect(zurfTrigger).dropTokens()).to.emit(ZurfRound0Vesting,"zurfSeed__DropExecuted")/*.withArgs(140943482758620689655170)*/
       
                    // check balance of contract
                    round0VestTokenBalance = await token.balanceOf(ZurfRound0Vesting.address)
                    console.log("ZRF Tokens in vesting contract after last drop: ", round0VestTokenBalance)
                    // check claimable tokens investors
                    vestedAmountInv1 = await ZurfRound0Vesting.calculateVestedAmount(investors[0])
                    console.log("vested amount inv 1: ", vestedAmountInv1)
                    console.log("expected amount inv 1: ", zurfTokens[0])

                    // check balance of investors
                    investor1TokenBalance = await token.balanceOf(investors[0])
                    console.log("ZRF in inv1 wallet: ", investor1TokenBalance);
                    // check balance of contract
                    investor2TokenBalance = await token.balanceOf(investors[1])
                    console.log("ZRF in inv2 wallet: ", investor2TokenBalance)
                    // check balance of contract
                    investor3TokenBalance = await token.balanceOf(investors[2])
                    console.log("ZRF in inv3 wallet: ", investor3TokenBalance)
                      
                    
                  })
                  it("Should transfer fees to the seller", async function () {
                    const { ZurfRound0Vesting, owner,Currency, ZURF_TRIGGER,tokenRate,sellerFee, Whale,tokenAmount, usdtWhale, delpoyer } = await loadFixture(deployZurfRound0VestingFixtureSetup)
                  
                    // Transfer tokens from owner to ZurfRound0Vesting
                    await token.connect(owner).transfer(ZurfRound0Vesting.address, tokenAmount);
                    // lee cantidad de tokens en el presale despues
                     const presaleBalanceToken = await token.balanceOf(ZurfRound0Vesting.address)
                     console.log("ZRF Tokens in presale after transfer: ", presaleBalanceToken)

                    // verifica que el seller recibió sellerFee, y que el presale tiene invested - fees
                    const sellerUSDTprebalance = await Currency.balanceOf(SELLER)
                    const presaleUSTDprebalance = await Currency.balanceOf(ZurfRound0Vesting.address)
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
                        ZurfRound0Vesting.address,
                        investment.toString(),
                        Whale
                    )
                    await approveErc20(
                      USDT,
                      ZurfRound0Vesting.address,
                      investment2.toString(),
                      usdtWhale
                  )
     
                      await expect(
                        ZurfRound0Vesting.connect(Whale).buyAllocation(investment,SELLER)
                    ).to.emit(ZurfRound0Vesting, "zurfSeed__NewInvestment")
                    .withArgs(Whale.address,investment.toString(),expectedTokensInvestor1, SELLER);

                      await expect(
                          ZurfRound0Vesting.connect(usdtWhale).buyAllocation(investment2,SELLER)
                      ).to.emit(ZurfRound0Vesting, "zurfSeed__NewInvestment")
                      .withArgs(usdtWhale.address,investment2.toString(),expectedTokensInvestor2, SELLER);
                      
                    //check that the cliff start is half of cliffend and starting time
                    // Get the sale end
                    const saleEnd = await ZurfRound0Vesting.saleEnd();
  
                    // Assert that the sale end is the new timestamp
                    expect(saleEnd).to.equal(timestampAfter+4);
  
                    // Get the cliff start
                    const cliffStart = await ZurfRound0Vesting.cliffStart();
  
                    // Assert that the sale end is the new timestamp
                    // sustract 1 or 2 to keep up with interactions with the blockchain (approve or connect)
                    expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-2);
                 
                     // Get vesting months investor1 from the contract 
                     const allocationInvestor1 = await ZurfRound0Vesting.allocations(Whale.address);
                     const vestedDurationInvestor1 = allocationInvestor1.vestedDuration;
                     console.log("Vesting duration inv1: ",vestedDurationInvestor1 )    
                     expect(vestedDurationInvestor1).to.equal(28)    
                      // Get vesting months investor 2 from the contract 
                     const allocationInvestor2 = await ZurfRound0Vesting.allocations(usdtWhale.address);
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
                      ZurfRound0Vesting.connect(owner).dropTokens()
                  ).to.emit(ZurfRound0Vesting, "zurfSeed__DropExecuted").withArgs(expectedTotaldrop)

                  // Get vesting months investor 2 from the contract 
                  const investorAllocationToken = await ZurfRound0Vesting.allocations(usdtWhale.address);
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
                    const presaleUSDTpostbalance = await Currency.balanceOf(ZurfRound0Vesting.address)
                    console.log("USDT in seller's AFTER wallet: ", sellerUSDTpostbalance)
                    console.log("USDT in presale's AFTER wallet: ", presaleUSDTpostbalance)
                    expect(sellerUSDTpostbalance).to.equal(sellerUSDTprebalance+totalExpectedSellerFees);
                    expect(presaleUSDTpostbalance).to.equal(totalExpectedPresaleBalance);



                })
                it("Investor allocation over correcly", async function () {
                  const { ZurfRound0Vesting, owner,_OWNER, deployer, token, zurfTrigger,usdtWhale, Whale, anyProfileI, tokenAmount, tokenRate } = await loadFixture(deployZurfRound0VestingFixtureSetup)

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
                        ZurfRound0Vesting.address,
                        investment.toString(),
                        Whale
                    )
                    await approveErc20(
                      USDT,
                      ZurfRound0Vesting.address,
                      investment2.toString(),
                      usdtWhale
                  )
     
                      await expect(
                        ZurfRound0Vesting.connect(Whale).buyAllocation(investment,SELLER)
                    ).to.emit(ZurfRound0Vesting, "zurfSeed__NewInvestment")
                    .withArgs(Whale.address,investment.toString(),expectedTokensInvestor1, SELLER);

                      await expect(
                          ZurfRound0Vesting.connect(usdtWhale).buyAllocation(investment2,SELLER)
                      ).to.emit(ZurfRound0Vesting, "zurfSeed__NewInvestment")
                      .withArgs(usdtWhale.address,investment2.toString(),expectedTokensInvestor2, SELLER);
                      
                    //check that the cliff start is half of cliffend and starting time
                    // Get the sale end
                    const saleEnd = await ZurfRound0Vesting.saleEnd();
  
                    // Assert that the sale end is the new timestamp
                    expect(saleEnd).to.equal(timestampAfter+4);
  
                    // Get the cliff start
                    const cliffStart = await ZurfRound0Vesting.cliffStart();
  
                    // Assert that the sale end is the new timestamp
                    expect(cliffStart).to.equal(timestampBefore+(timestampAfter-timestampBefore)/2-1);
                 
                     // Get vesting months investor1 from the contract 
                     const allocationInvestor1 = await ZurfRound0Vesting.allocations(Whale.address);
                     const vestedDurationInvestor1 = allocationInvestor1.vestedDuration;
                     console.log("Vesting duration inv1: ",vestedDurationInvestor1 )    
                     expect(vestedDurationInvestor1).to.equal(28)    
                      // Get vesting months investor 2 from the contract 
                     const allocationInvestor2 = await ZurfRound0Vesting.allocations(usdtWhale.address);
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
                      ZurfRound0Vesting.connect(owner).dropTokens()
                  ).to.emit(ZurfRound0Vesting,"zurfSeed__DropExecuted")
                  .withArgs(0)
                      
                    // avanza 1 dia
                    try {
                      await advanceTime(1);
                     // console.log('EVM timestamp advanced by 15 days.');
                    } catch (error) {
                     // console.error('Error while advancing time:', error);
                    }

                       // Get vesting months investor 2 from the contract 
                  const investorAllocation = await ZurfRound0Vesting.allocations(usdtWhale.address);
                  const claimableAmount = investorAllocation.claimedTokens;
                  console.log("Claimable amount tokens: ",claimableAmount ) 
                    await expect(
                      ZurfRound0Vesting.connect(owner).dropTokens()
                  ).to.be.rejectedWith("Not Enough tokens to drop")
                  
                  // Transfer tokens from owner to ZurfRound0Vesting
                  await token.connect(owner).transfer(ZurfRound0Vesting.address, tokenAmount);
                     // lee cantidad de tokens en el presale despues
                  const presaleBalanceToken = await token.balanceOf(ZurfRound0Vesting.address)
                  console.log("ZRF Tokens in presale after transfer: ", presaleBalanceToken)

                  const preZRFBalanceInv1 = await token.balanceOf(Whale.address)
                  console.log("ZRF Tokens in inv1: ", preZRFBalanceInv1)
                  const preZRFBalanceInv2 = await token.balanceOf(usdtWhale.address)
                  console.log("ZRF Tokens in inv2: ", preZRFBalanceInv2)

                  // call drop
                  await expect(
                      ZurfRound0Vesting.connect(owner).dropTokens()
                  ).to.emit(ZurfRound0Vesting, "zurfSeed__DropExecuted").withArgs(expectedTotaldrop)

                  // Get vesting months investor 2 from the contract 
                  const investorAllocationToken = await ZurfRound0Vesting.allocations(usdtWhale.address);
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
                  const vestedTokensInv1 = await ZurfRound0Vesting.calculateVestedAmount(Whale.address);
                  console.log("Vested amount of tokens (Whale): ",vestedTokensInv1) 

                // call drop
                       await expect(
                        ZurfRound0Vesting.connect(owner).dropTokens()
                    ).to.emit(ZurfRound0Vesting, "zurfSeed__DropExecuted")

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
                    const vestedTokensInv2 = await ZurfRound0Vesting.calculateVestedAmount(usdtWhale.address);
                    console.log("Vested amount of tokens (usdtWhale): ",vestedTokensInv2) 

                    // call drop
                       await expect(
                        ZurfRound0Vesting.connect(owner).dropTokens()
                    ).to.emit(ZurfRound0Vesting, "zurfSeed__DropExecuted")

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