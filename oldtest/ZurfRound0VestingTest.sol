// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/ZurfRound0Vesting.sol";
import "../contracts/CustomERC20.sol";  // Import the CustomERC20 contract you've created
contract ZurfRound0VestingTest is Test {
    CustomERC20 token;  // Use CustomERC20 instead of ERC20
    address owner = makeAddr("owner");
    event LogTokenBalance(string message, uint256 balance);


    address[] investors = [
        0x85CC29F41F6E9b8648442000bB1F87e7A12fd99E,
        0x89d36091F9ec93c98756eD90BCADd72A713759F7,
        0x9437Fe6385F3551850FD892D471FFbc818CF3116
    ];

    uint128[] zurfTokens = [
        155724,
        3854546,
        77091
    ];
    uint128 totalRoundTokens = 4087361 * 1e18 ;

    address triggerAddress = 0x092E67E9dbc47101760143f95056569CB0b3324f;

    uint40 cliffMonths = 0;
    uint40 vestingMonths = 29;
    uint40 vestingMonthsLargeInvestor = 48;

    ZurfRound0Vesting zurfVest;

    function setUp() public {
        // Deploy the CustomERC20 token contract
        token = new CustomERC20();
        // Transfer totalRoundTokens to the vesting contract
      
        // Deploy ZurfRound0Vesting contract
        zurfVest = new ZurfRound0Vesting(address(token));
        token.transfer(address(zurfVest), totalRoundTokens);

        // Whitelist the trigger (replace with the actual function call)
        zurfVest.whitelistZurfTrigger(triggerAddress);
        assert(zurfVest.s_triggerWhitelisted(triggerAddress));
      
        assert(token.balanceOf(address(zurfVest)) == totalRoundTokens);

       
    }

    // Test loading data into the contract
    function testLoadData() public {
      uint128 allocatedTokens;
        vm.prank(triggerAddress);
        // Store the current number of events emitted
        // uint256 initialEventCount = vm.eventsCount();
        zurfVest.loadVestingData(investors, zurfTokens, cliffMonths, vestingMonths, vestingMonthsLargeInvestor, false);
        // Calculate the number of events emitted after the function call
        for (uint256 i = 0; i < investors.length; i++) {
        // Get the investor's allocation struct from the ZurfRound0Vesting contract
        allocatedTokens = zurfVest.getMyAllocation(investors[i]);
        // Assert that the allocatedTokens match the corresponding zurfTokens in the array
        assert(allocatedTokens == zurfTokens[i]);
        }
    }
    function testdropBeforeVest() public {
         uint128 allocatedTokens;
        vm.prank(triggerAddress);
        // Store the current number of events emitted
        // uint256 initialEventCount = vm.eventsCount();
        zurfVest.loadVestingData(investors, zurfTokens, cliffMonths, vestingMonths, vestingMonthsLargeInvestor, false);
        // Calculate the number of events emitted after the function call
        for (uint256 i = 0; i < investors.length; i++) {
        // Get the investor's allocation struct from the ZurfRound0Vesting contract
        allocatedTokens = zurfVest.getMyAllocation(investors[i]);
        // Assert that the allocatedTokens match the corresponding zurfTokens in the array
        assert(allocatedTokens == zurfTokens[i]);
        }
        // avanza cliff+1 mes de vest - 1 dia
       // vm.warp(block.timestamp + (cliffMonths*30 days + 30 days)*86400);
        emit log_uint(block.timestamp);
        vm.prank(triggerAddress);
        zurfVest.dropTokens();

      // comprobar que si dropea tokens
       // Calculate the number of events emitted after the function call
        for (uint256 i = 0; i < investors.length; i++) {
        // Get the investor's allocation struct from the ZurfRound0Vesting contract
        allocatedTokens = zurfVest.getMyAllocation(investors[i]);
        // Assert that the allocatedTokens match the corresponding zurfTokens in the array
        assert(allocatedTokens == zurfTokens[i]);
        }
   // Check the balance of tokens in investors' wallets after dropTokens
    for (uint256 i = 0; i < investors.length; i++) {
        uint256 investorBalance = token.balanceOf(investors[i]);
        // Assert that the investor's balance has increased by the allocatedTokens amount
        assert(investorBalance > 0);
    }

      // avanzar 2 dias
      /* avanza cliff+1 mes de vest - 1 dia
        vm.warp(block.timestamp + 31*86400);
        emit log_uint(block.timestamp);
        vm.prank(triggerAddress);
        zurfVest.dropTokens();
      // comprobar que se dropea la cantidad correcta 
 // Calculate the number of events emitted after the function call
        for (uint256 i = 0; i < investors.length; i++) {
        // Get the investor's allocation struct from the ZurfRound0Vesting contract
        allocatedTokens = zurfVest.getMyAllocation(investors[i]);
        // Assert that the allocatedTokens match the corresponding zurfTokens in the array
        assert(allocatedTokens == zurfTokens[i]);*/
        
    }


    // Helper function to convert uint to string
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        temp = value;
        
        while (temp != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + temp % 10));
            temp /= 10;
        }
        
        return string(buffer);
    }
}
