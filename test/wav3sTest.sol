// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/wav3s.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../contracts/RaffleStateLibrary.sol";
import "../contracts/wav3sFunctions.sol";
import {Events} from "../contracts/wav3sEvents.sol";
import {Errors} from "../contracts/wav3sErrors.sol";
  // Import the CustomERC20 contract you've created
contract wav3sTest is Test {

    uint256 polygonFork;
    string MAINNET_RPC_URL = vm.envString("POLYGON_MAINNET_RPC_URL");
   
    address vrfCoordinatorV2 = 0xAE975071Be8F8eE67addBC1A82488F1C24858067;
    uint64  subscriptionId = 764;
    bytes32 gasLane = 0xd729dc84e21ae57ffb6be0053bf2b0668aa2aaf300a2a7b2ddf7dc0bb6e875a8;
    uint32 callbackGasLimit = 2500000;

    address multisig = 0xAc6C6aD61EA3d8fea0912d7b5ce9104cc89F8692;
    address consumerApp = 0x045705E0B16FA08695De4eF68798725Ac8035c76;
    address normalCurrency = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270; // WMATIC
    address USDTCurrency = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F; // USDT
    address superCurrency = 0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683; // SAND


    uint256[] budget = [1500000000000000000*110/100,2000000000000000000*110/100,3000000000000000000*110/100]; // 1.5 - 2 - 3
    uint256 totalBudgets = budget[0] + budget[1] + budget[2];
    uint256[] budget_sc = [1500000000000000000,2000000000000000000,3000000000000000000]; // 1.5 - 2 - 3
    uint256 totalBudgets_sc = budget_sc[0] + budget_sc[1] + budget_sc[2];
    uint256[] reward = [100000000000000000,1000000000000000000,200000000000000000]; // 0.1 - 1 - 0.2
    uint256[] raffleDuration = [ 0, 0, 0 ];
    uint256[] minFollowers = [2,3,4];
    address currency = normalCurrency;
    uint256 protocolFee = 5;
    uint256 consumerAppFee = 5;
    uint256 baseFee = 1000000000000000000;
    uint256 totalFees = consumerAppFee + protocolFee;
    //// USDT
    uint256[] budget_USDT = [1500000*110/100,2000000*110/100,3000000*110/100]; // 1.5 - 2 - 3
    uint256 totalBudgets_USDT = budget_USDT[0] + budget_USDT[1] + budget_USDT[2];
    uint256[] reward_USDT = [100000,1000000,200000]; // 0.1 - 1 - 0.2


    address bigWhale = 0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245;
    address bigWhale2 = 0x21Cb017B40abE17B6DFb9Ba64A3Ab0f24A7e60EA;
    address bigWhale3 = 0x06959153B974D0D5fDfd87D561db6d8d4FA0bb0B;

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

    wav3s wav3sInstance;
    wav3sFunctions wav3sFunction;
    address wav3sFunctionsAddress; // Declare a state variable to store the address
    address OracleAddress;
    address phatAttestor = 0x0e9e628d715003ff5045fc92002c67DDab364683;
    event EmitValueLogged(uint256 value, string message);
    event EmitArrayLogged(uint256[] value, string message);

    event EmitAddressLogged(address value, string message);
    event EmitStringLogged(string value, string message);
    event ErrorLogged(string message, uint256 additionalInfo);


    function setUp() public {      
        // Deploy wav3sFunctions contract
        polygonFork = vm.createFork(MAINNET_RPC_URL);
        vm.selectFork(polygonFork);
        vm.rollFork(46_585_337);
        // emit EmitStringLogged(MAINNET_RPC_URL, "MAINNET_RPC_URL");
        assertEq(block.number, 46_585_337);

        wav3sFunction = new wav3sFunctions();

        // Store the address of wav3sFunctions contract
        wav3sFunctionsAddress = address(wav3sFunction);

        // Deploy wav3scontract
        wav3sInstance = new wav3s(
            vrfCoordinatorV2,
            subscriptionId,
            gasLane,
            callbackGasLimit,
            wav3sFunctionsAddress
            );

        wav3sInstance.setMultisig(multisig);

        assert(wav3sInstance.s_multisig() == multisig);

        wav3sInstance.whitelistWav3sTrigger(triggerAddress);
        wav3sInstance.setFees(protocolFee,baseFee);
        // revisar app fees
        vm.prank(consumerApp);
        wav3sInstance.setAppFee(consumerAppFee);
        wav3sInstance.whitelistCurrency(currency,false);
        wav3sInstance.whitelistCurrency(USDTCurrency,false);
    }

    // Test loading data into the contract
    function testfundAction() public {
        // Get the initial balance of the wav3sInstance contract
        // uint256 initialBalance = address(multisig).balance;
        uint256 initialUser1Balance = address(bigWhale).balance;
        IERC20 wmaticToken = IERC20(currency);
        uint256 whaleCurrencyBalance = wmaticToken.balanceOf(bigWhale);

        vm.prank(bigWhale);
        // approve moving tokens to wav3sInstance
        wmaticToken.approve(address(wav3sInstance), totalBudgets);
        vm.prank(bigWhale);

        uint256[10] memory actionIds = wav3sInstance.fundAction{value: baseFee}(budget, reward, raffleDuration, minFollowers, currency, consumerApp);
        
        for(uint256 i; i < budget.length; i++){
            emit EmitValueLogged(actionIds[i], "actionIds");
        }

        // check the balance of currency changed
        uint256 whaleAfterCurrencyBalance = wmaticToken.balanceOf(bigWhale);
        assert(whaleAfterCurrencyBalance == whaleCurrencyBalance - totalBudgets);

        // check the balance of MATIC changed in the user
        uint256 finalUser1Balance = address(bigWhale).balance;
        assert(finalUser1Balance == initialUser1Balance - baseFee );

        /* check the balance of MATIC changed in wav3s.sol
        uint256 finalBalance = address(multisig).balance;
        assert(finalBalance == initialBalance + baseFee );*/

        // Try a second funding with USDT and check new action Ids
        // Get the initial balance of the wav3sInstance contract
        uint256 initialBalance_ = address(wav3sInstance).balance;
        uint256 initialUser1Balance_ = address(bigWhale).balance;
        IERC20 token = IERC20(USDTCurrency);
        uint256 whaleCurrencyBalance_ = token.balanceOf(bigWhale);

        vm.prank(bigWhale);
        // approve moving tokens to wav3sInstance
        token.approve(address(wav3sInstance), totalBudgets_USDT);
        vm.prank(bigWhale);
        uint256[10] memory actionIds_ =wav3sInstance.fundAction{value: baseFee}(budget_USDT, reward_USDT, raffleDuration, minFollowers, USDTCurrency, consumerApp);
        for(uint256 i; i < budget.length; i++){
            emit EmitValueLogged(actionIds_[i], "actionIds");
        }
        // check the balance of currency changed
        uint256 whaleAfterCurrencyBalance_ = token.balanceOf(bigWhale);
        assert(whaleAfterCurrencyBalance_ == whaleCurrencyBalance_ - totalBudgets_USDT);

        // check the balance of MATIC changed in the user
        uint256 finalUser1Balance_ = address(bigWhale).balance;
        assert(finalUser1Balance_ == initialUser1Balance_ - baseFee );

        // check the balance of MATIC changed in wav3s.sol
        uint256 finalBalance_ = address(wav3sInstance).balance;
        assert(finalBalance_ == initialBalance_ + baseFee );

    }


    function testSetPubId() public {
        // 
        testfundAction();
        string[3] memory pubId = ["s8a7hx-4f5-g","2ddv-4fyg-fb9","ghh-32dd-0xef"];
        string[3] memory actionName = ["collect","like","mirror"];
        for (uint256 i; i < pubId.length; ++i) {
            vm.prank(triggerAddress);
            wav3sInstance.setPubId(i,pubId[i], actionName[i]);
            uint256 actionBudget = wav3sInstance.getActionBudget(pubId[i], actionName[i]);
            uint256 actionBudget_s =  budget[i]*(100)/(100+totalFees);
            assert(actionBudget == actionBudget_s);
        }
 
    }

       function test_CannoTSetAnticipatedPubId() public {
        // 
        testfundAction();
        string[3] memory pubId = ["s8a7hx-4f5-g","2ddv-4fyg-fb9","ghh-32dd-0xef"];
        string[3] memory actionName = ["collect","like","mirror"];
        for (uint256 i; i < pubId.length; ++i) {
            vm.prank(triggerAddress);
            wav3sInstance.setPubId(i,pubId[i], actionName[i]);
            uint256 actionBudget = wav3sInstance.getActionBudget(pubId[i], actionName[i]);
            uint256 actionBudget_s =  budget[i]*(100)/(100+totalFees);
            assert(actionBudget == actionBudget_s);
        }
        vm.prank(triggerAddress);
        vm.expectRevert("ActionNotYetEmitted");
        wav3sInstance.setPubId(6,"vfdvdvg", "collect");
    }
    
    function testfundWallet(address _currency, uint256 _totalBudgets) private {
            IERC20 token = IERC20(_currency);
         
            uint256 fundEther = baseFee;
            uint256 fundCurrency = _totalBudgets;
            uint256 initialUser1Balance = address(bigWhale).balance;
            uint256 inititalUser1CurrencyBalance = token.balanceOf(bigWhale);

            vm.prank(bigWhale);
            // approve moving tokens to wav3sInstance
            token.approve(address(wav3sInstance), fundCurrency);
            vm.prank(bigWhale);
            wav3sInstance.fundWallet{value: fundEther}(fundCurrency, _currency);

            // Check changes in balances of ether
            uint256 finalUser1Balance = address(bigWhale).balance;
            assert(finalUser1Balance == initialUser1Balance - fundEther );
            // Check changes in balances of MATIC
            uint256 finalUser1CurrencyBalance = token.balanceOf(bigWhale);
            assert(finalUser1CurrencyBalance == inititalUser1CurrencyBalance - fundCurrency );

    }

    function testfundActionFromWallet() public {

            uint256 initialUser1Balance = address(bigWhale).balance;
            testfundWallet(currency, totalBudgets);
            IERC20 wmaticToken = IERC20(currency);
            uint256 afterfundUser1Balance = address(bigWhale).balance;
            uint256 afterfundUser1CurrencyBalance = wmaticToken.balanceOf(bigWhale);

            // vm.prank(bigWhale);
            // approve moving tokens to wav3sInstance
            // wmaticToken.approve(address(wav3sInstance), budget[0]);
            vm.prank(bigWhale);
            wav3sInstance.fundAction(budget, reward, raffleDuration, minFollowers, currency, consumerApp);
            // check the balance of MATIC changed in the user
            uint256 finalUser1Balance = address(bigWhale).balance;
            uint256 finalUser1CurrencyBalance = wmaticToken.balanceOf(bigWhale);

            assert(finalUser1Balance == initialUser1Balance - baseFee);
            assert(finalUser1Balance == afterfundUser1Balance);        
            assert(finalUser1CurrencyBalance == afterfundUser1CurrencyBalance);
    }

    function testWithdrawFeesFromWalletFunding() public {
        IERC20 token = IERC20(currency);
        testfundActionFromWallet();
        uint256 wav3sNativeFees = wav3sInstance.s_NativeCurrencyProtocolWallet();
        uint256 wav3sNativeBalance = address(wav3sInstance).balance;
        uint256 msigNativeBalance = address(multisig).balance;
        assert(wav3sNativeFees == baseFee);
        wav3sInstance.withdrawProtocolNativeFees();
        uint256 wav3sNativeFeesAfter = wav3sInstance.s_NativeCurrencyProtocolWallet();
        uint256 wav3sNativeBalanceAfter = address(wav3sInstance).balance;
        uint256 msigNativeBalanceAfter = address(multisig).balance;
        assert(wav3sNativeFees == wav3sNativeFeesAfter + baseFee);
        assert(wav3sNativeBalance == wav3sNativeBalanceAfter + baseFee);
        assert(msigNativeBalance == msigNativeBalanceAfter - baseFee);

        uint256 expectedWav3sCurrencyFees = totalBudgets*protocolFee/(100+protocolFee+consumerAppFee);
        uint256 wav3sCurrencyFees = wav3sInstance.s_CurrencyToProtocolWallet(currency);
        uint256 wav3sCurrencyBalance = token.balanceOf(address(wav3sInstance));
        uint256 msigCurrencyBalance = token.balanceOf(multisig);
        wav3sInstance.withdrawProtocolFees(currency);
        uint256 wav3sCurrencyFeesAfter = wav3sInstance.s_CurrencyToProtocolWallet(currency);
        uint256 wav3sCurrencyBalanceAfter = token.balanceOf(address(wav3sInstance));
        uint256 msigCurrencyBalanceAfter = token.balanceOf(multisig);
        assert(wav3sCurrencyFees == expectedWav3sCurrencyFees);
        assert(wav3sCurrencyFeesAfter == 0);
        assert(wav3sCurrencyFeesAfter == wav3sCurrencyFees - expectedWav3sCurrencyFees);
        assert(msigCurrencyBalance == msigCurrencyBalanceAfter - expectedWav3sCurrencyFees);
        assert(wav3sCurrencyBalance == wav3sCurrencyBalanceAfter + expectedWav3sCurrencyFees);
    
    }
    function testWithdrawAppFeesFromWalletFunding() public {
        IERC20 token = IERC20(currency);
        testWithdrawFeesFromWalletFunding();     
        uint256 consumerAppFees = (totalBudgets * consumerAppFee) / (protocolFee + consumerAppFee+100);
        //current app fees in wav3s
        uint256 initialInternalBalance_ = wav3sInstance.s_appToCurrencyToWallet(consumerApp, currency);
        uint256 inititalAppBalance = token.balanceOf(address(consumerApp));
        uint256 inititalWav3sBalance = token.balanceOf(address(wav3sInstance));
        // withdraw app fees
        vm.prank(consumerApp);
        wav3sInstance.withdrawAppFees(currency);
        // after  app fees in wav3s
        uint256 finalInternalBalance_ = wav3sInstance.s_appToCurrencyToWallet(consumerApp, currency);
        uint256 finalAppBalance = token.balanceOf(address(consumerApp));
        uint256 finalWav3sBalance = token.balanceOf(address(wav3sInstance));
        // after  app balance
        assert(initialInternalBalance_ - consumerAppFees == finalInternalBalance_);
        assert(inititalAppBalance + consumerAppFees == finalAppBalance);
        assert(inititalWav3sBalance == finalWav3sBalance + consumerAppFees );
    }
    function testProcessAction() public {
        testSetPubId();

        string[3] memory pubId = ["s8a7hx-4f5-g", "2ddv-4fyg-fb9", "ghh-32dd-0xef"];
        string[3] memory actionName = ["collect", "like", "mirror"];
        string[] memory action; // Change to dynamic array
        action = new string[](1); // Initialize a dynamic array with a length of 1
        action[0] = actionName[0];

        address[] memory user; // Change to dynamic array
        user = new address[](1); // Initialize a dynamic array with a length of 1
        user[0] = bigWhale2;

        string[] memory profileId; // Change to dynamic array
        profileId = new string[](1); // Initialize a dynamic array with a length of 1
        profileId[0] = "0x01";

        IERC20 wmaticToken = IERC20(currency);
        uint256 initialUser1CurrencyBalance = wmaticToken.balanceOf(user[0]);

        // Now you can call processAction with arrays
        vm.prank(triggerAddress);
        wav3sInstance.processAction(pubId[0], action, user, profileId);

        // check the balance of currency changed in the user
        uint256 finalUser1CurrencyBalance = wmaticToken.balanceOf(user[0]);
        emit EmitValueLogged(finalUser1CurrencyBalance, "finalUser1CurrencyBalance");
        emit EmitValueLogged(initialUser1CurrencyBalance, "initialUser1CurrencyBalance");

        emit EmitValueLogged(reward[0], "reward[0]");
        uint256 _reward = wav3sInstance.getActionReward(pubId[0], actionName[0]);
        emit EmitValueLogged(_reward, "stored reward");
             uint256 _raffleDuration = wav3sInstance.getActionRaffleEnd(pubId[0], actionName[0]);
        emit EmitValueLogged(_raffleDuration, "_raffleDuration");
        emit EmitValueLogged(_raffleDuration, "_raffleDuration");


        (ActionDataBase memory processActionDb,, address processActionAddress, string memory processActionProfileId) = wav3sInstance.s_ProcessActionIdToProcessActionData(0);
        emit EmitAddressLogged(processActionAddress, "processActionAddress");


        assert(processActionDb.initiatedAction);
        assert(processActionAddress == user[0]);
        assert(keccak256(abi.encodePacked(processActionProfileId)) == keccak256(abi.encodePacked(profileId[0])));
    }

    function test_CannotProcessActionNotInitiated() public {
        testSetPubId();

        string[3] memory pubId = ["s8a7hx-4f5-g", "2ddv-4fyg-fb9", "ghh-32dd-0xef"];
        string[3] memory actionName = ["collect", "like", "mirror"];
        string[] memory action; // Change to dynamic array
        action = new string[](1); // Initialize a dynamic array with a length of 1
        action[0] = actionName[0];

        address[] memory user; // Change to dynamic array
        user = new address[](1); // Initialize a dynamic array with a length of 1
        user[0] = bigWhale2;

        string[] memory profileId; // Change to dynamic array
        profileId = new string[](1); // Initialize a dynamic array with a length of 1
        profileId[0] = "0x01";
         // Now you can call processAction with arrays
        vm.prank(triggerAddress);
        vm.expectRevert("ActionNotInitiated");
        wav3sInstance.processAction(pubId[1], action, user, profileId);
    }

    function test_whitelistSupercurrency() public {
        wav3sInstance.whitelistCurrency(superCurrency,true);
    }

    function test_fundActionWithSuperCurrency() public {

        test_whitelistSupercurrency();
        // Get the initial balance of the wav3sInstance contract
        uint256 initialBalance = address(multisig).balance;
        uint256 initialUser1Balance = address(bigWhale).balance;

        IERC20 superToken = IERC20(superCurrency);
        uint256 whaleCurrencyBalance = superToken.balanceOf(bigWhale);

        vm.prank(bigWhale);
        // approve moving tokens to wav3sInstance
        superToken.approve(address(wav3sInstance), totalBudgets_sc);
        vm.prank(bigWhale);
        wav3sInstance.fundAction(budget_sc, reward, raffleDuration, minFollowers, superCurrency, consumerApp);

        // check the balance of currency changed
        uint256 whaleAfterCurrencyBalance = superToken.balanceOf(bigWhale);
        assert(whaleAfterCurrencyBalance == whaleCurrencyBalance - totalBudgets_sc);
                    emit EmitValueLogged(1, "aqui1");

        // check the balance of MATIC didnt changed in the user
        uint256 finalUser1Balance = address(bigWhale).balance;
        assert(finalUser1Balance == initialUser1Balance);
                    emit EmitValueLogged(1, "aqui1");

        // check the balance of MATIC didnt changed in wav3s.sol
        uint256 finalBalance = address(multisig).balance;
        assert(finalBalance == initialBalance);
    }

    function test_fundActionFromWalletWithSuperCurrency() public {
            IERC20 token = IERC20(superCurrency);
            uint256 initialUser1Balance = address(bigWhale).balance;
            uint256 initialUser1CurrencyBalance = token.balanceOf(bigWhale);

            test_whitelistSupercurrency();
                   // emit EmitValueLogged(1, "aqui1");

            testfundWallet(superCurrency, totalBudgets);
                   // emit EmitValueLogged(2, "aqui2");

            uint256 afterfundUser1Balance = address(bigWhale).balance;
            uint256 afterfundUser1CurrencyBalance = token.balanceOf(bigWhale);

            // vm.prank(bigWhale);
            // Dont need to approve cause no tokens will be transfered
            // wmaticToken.approve(address(wav3sInstance), budget[0]);
            vm.prank(bigWhale);
            // no debería transferir nada
            wav3sInstance.fundAction(budget_sc, reward, raffleDuration, minFollowers, superCurrency, consumerApp);
            // check the balance of MATIC changed in the user
            uint256 finalUser1Balance = address(bigWhale).balance;
            uint256 finalUser1CurrencyBalance = token.balanceOf(bigWhale);
            
            assert(finalUser1Balance == initialUser1Balance - baseFee ); 
                               emit EmitValueLogged(0, "aqui0");

            assert(finalUser1Balance == afterfundUser1Balance); 
                               emit EmitValueLogged(1, "aqui1");

            assert(afterfundUser1CurrencyBalance == finalUser1CurrencyBalance);
                               emit EmitValueLogged(2, "aqui2");

            assert(finalUser1CurrencyBalance == initialUser1CurrencyBalance - totalBudgets);
                    emit EmitValueLogged(3, "aqui3");

            // el usuario debiera tener en su wallet interna, la diferencia entre totalBudgets y totalBudgets_sc
            uint256 userWalletBalance = wav3sInstance.s_userToCurrencyToWalletBudget(bigWhale, superCurrency);
            /*                    emit EmitValueLogged(userWalletBalance, "userWalletBalance: ");
                                emit EmitValueLogged(totalBudgets, "totalBudgets: ");
                                emit EmitValueLogged(totalBudgets_sc, "totalBudgets_sc: ");*/

            assert(userWalletBalance == (totalBudgets - totalBudgets_sc));
    }

    function test_fundWithUSDT() public {
      // Get the initial balance of the wav3sInstance contract
        uint256 initialBalance = address(wav3sInstance).balance;
        uint256 initialUser1Balance = address(bigWhale).balance;
        IERC20 token = IERC20(USDTCurrency);
        uint256 whaleCurrencyBalance = token.balanceOf(bigWhale);

        vm.prank(bigWhale);
        // approve moving tokens to wav3sInstance
        token.approve(address(wav3sInstance), totalBudgets_USDT);
        vm.prank(bigWhale);
        wav3sInstance.fundAction{value: baseFee}(budget_USDT, reward_USDT, raffleDuration, minFollowers, USDTCurrency, consumerApp);

        // check the balance of currency changed
        uint256 whaleAfterCurrencyBalance = token.balanceOf(bigWhale);
        //emit EmitValueLogged(whaleAfterCurrencyBalance, "whaleAfterCurrencyBalance");

        assert(whaleAfterCurrencyBalance == whaleCurrencyBalance - totalBudgets_USDT);

        // check the balance of MATIC changed in the user
        uint256 finalUser1Balance = address(bigWhale).balance;
        assert(finalUser1Balance == initialUser1Balance - baseFee );

        // check the balance of MATIC changed in wav3s.sol
        uint256 finalBalance = address(wav3sInstance).balance;
        assert(finalBalance == initialBalance + baseFee );
        emit EmitValueLogged(0, "pasa test_fundWithUSDT completo");

    }

    function testSetPubId_USDT() public {
        // 
        test_fundWithUSDT();
        string[3] memory pubId = ["s8a7hx-4f5-g","2ddv-4fyg-fb9","ghh-32dd-0xef"];
        string[3] memory actionName = ["collect","like","mirror"];
        for (uint256 i; i < pubId.length; ++i) {
            vm.prank(triggerAddress);
            wav3sInstance.setPubId(i,pubId[i], actionName[i]);
            //uint256 actionid = wav3sInstance.nextActionId();
            //emit EmitValueLogged(actionid, "actionid");
            uint256 actionBudget = wav3sInstance.getActionBudget(pubId[i], actionName[i]);
            uint256 actionBudget_s =  budget_USDT[i]*(100)/(100+totalFees);
            assert(actionBudget == actionBudget_s);
        }
    }

    function testProcessActionUSDT() public {
        testSetPubId_USDT();

        string[3] memory pubId = ["s8a7hx-4f5-g", "2ddv-4fyg-fb9", "ghh-32dd-0xef"];
        string[3] memory actionName = ["collect", "like", "mirror"];
        string[] memory action; // Change to dynamic array
        action = new string[](1); // Initialize a dynamic array with a length of 1
        action[0] = actionName[0];

        address[] memory user; // Change to dynamic array
        user = new address[](1); // Initialize a dynamic array with a length of 1
        user[0] = bigWhale2;

        string[] memory profileId; // Change to dynamic array
        profileId = new string[](1); // Initialize a dynamic array with a length of 1
        profileId[0] = "0x01";

        IERC20 token = IERC20(USDTCurrency);
        uint256 initialUser1CurrencyBalance = token.balanceOf(user[0]);

        // Now you can call processAction with arrays
        vm.prank(triggerAddress);
        wav3sInstance.processAction(pubId[0], action, user, profileId);

        (ActionDataBase memory processActionDb,, address processActionAddress, string memory processActionProfileId) = wav3sInstance.s_ProcessActionIdToProcessActionData(0);
        emit EmitAddressLogged(processActionAddress, "processActionAddress");


        assert(processActionDb.initiatedAction);
        assert(processActionAddress == user[0]);
        assert(keccak256(abi.encodePacked(processActionProfileId)) == keccak256(abi.encodePacked(profileId[0])));       
    }

    function testWithdrawAction() public {
        testProcessActionUSDT();
        string[3] memory pubId = ["s8a7hx-4f5-g","2ddv-4fyg-fb9","ghh-32dd-0xef"];
        string[3] memory actionName = ["collect","like","mirror"];
        // check balance action budget before
        IERC20 token = IERC20(USDTCurrency);
        //uint256 actionBudgetBefore = wav3sInstance.getActionBudget(pubId[0], actionName[0]);
        uint256 userCurrencyBalanceBefore = token.balanceOf(bigWhale);

        vm.prank(bigWhale);
        vm.expectRevert("withdrawalTime not over");
        wav3sInstance.withdrawActionBudget(pubId[0], actionName[0]);

        vm.selectFork(polygonFork);
        vm.rollFork(47_585_337);
        // emit EmitStringLogged(MAINNET_RPC_URL, "MAINNET_RPC_URL");
        assertEq(block.number, 47_585_337);
        
        vm.prank(bigWhale);
        wav3sInstance.withdrawActionBudget(pubId[0], actionName[0]);
        uint256 actionBudgetAfter = wav3sInstance.getActionBudget(pubId[0], actionName[0]);
        uint256 userCurrencyBalanceAfter = token.balanceOf(bigWhale);

        // check balance action budget after
        assert(actionBudgetAfter == 0);
        // check user got previous balance + (budget - reward)
        assert(userCurrencyBalanceAfter == userCurrencyBalanceBefore + budget_USDT[0]/110*100-reward_USDT[0]);
    }

    function testFundWalletWithUSDT() public {
        testfundWallet(USDTCurrency,totalBudgets_USDT);
    }
    // test withdraw from wallet budget
    function testWithdrawInternalWallet() public {
        testFundWalletWithUSDT();

        // log currency and ether value of user
        uint256 userWalletBalance = wav3sInstance.s_userToCurrencyToWalletBudget(bigWhale, USDTCurrency);
        uint256 userNativeWalletBalance = wav3sInstance.s_userToNativeCurrencyWalletBudget(bigWhale);
        vm.prank(bigWhale);
        wav3sInstance.withdrawInternalWalletBudget(baseFee,totalBudgets_USDT, USDTCurrency);
        // log currency and ether value of user
        uint256 userWalletBalanceAfter = wav3sInstance.s_userToCurrencyToWalletBudget(bigWhale, USDTCurrency);
        uint256 userNativeWalletBalanceAfter = wav3sInstance.s_userToNativeCurrencyWalletBudget(bigWhale);
        assert(userWalletBalanceAfter == userWalletBalance - totalBudgets_USDT );
        assert(userNativeWalletBalanceAfter == userNativeWalletBalance - baseFee);
        vm.prank(bigWhale);
        wav3sInstance.withdrawInternalWalletBudget(0, 0, USDTCurrency);
    }

    function testCircuitBreaker() public {
        wav3sInstance.circuitBreaker();
    }

    function test_CannotFundInEmergency() public {

        IERC20 token = IERC20(currency);
        testCircuitBreaker();
        vm.prank(bigWhale);
        token.approve(address(wav3sInstance), totalBudgets);
        vm.prank(bigWhale);
        vm.expectRevert("EmergencyStop");
        wav3sInstance.fundAction{value: baseFee}(budget, reward, raffleDuration, minFollowers, currency, consumerApp);

    }
    function test_CannotFundInternalWalletInEmergency() public {

        IERC20 token = IERC20(currency);
        testCircuitBreaker();
        vm.prank(bigWhale);
        token.approve(address(wav3sInstance), totalBudgets);
        vm.prank(bigWhale);
        vm.expectRevert("EmergencyStop");
        wav3sInstance.fundWallet{value: baseFee}(totalBudgets, currency);
    }

    function test_CannotProcessInEmergency() public {

        testSetPubId();
        string[3] memory pubId = ["s8a7hx-4f5-g", "2ddv-4fyg-fb9", "ghh-32dd-0xef"];
        string[3] memory actionName = ["collect", "like", "mirror"];
        string[] memory action; // Change to dynamic array
        action = new string[](1); // Initialize a dynamic array with a length of 1
        action[0] = actionName[0];

        address[] memory user; // Change to dynamic array
        user = new address[](1); // Initialize a dynamic array with a length of 1
        user[0] = bigWhale2;

        string[] memory profileId; // Change to dynamic array
        profileId = new string[](1); // Initialize a dynamic array with a length of 1
        profileId[0] = "0x01";
        // Now you can call processAction with arrays
        testCircuitBreaker();
        vm.prank(triggerAddress);
        vm.expectRevert("EmergencyStop");
        wav3sInstance.processAction(pubId[0], action, user, profileId);
    }

    function test_CannotWithdrawInEmergency() public {
        testProcessActionUSDT();
        string[3] memory pubId = ["s8a7hx-4f5-g","2ddv-4fyg-fb9","ghh-32dd-0xef"];
        string[3] memory actionName = ["collect","like","mirror"];
        testCircuitBreaker();

        vm.prank(bigWhale);
        vm.expectRevert("EmergencyStop");
        wav3sInstance.withdrawActionBudget(pubId[0], actionName[0]);
    }

    function test_CannotWithdrawInternalBudgetInEmergency() public {
        testFundWalletWithUSDT();
        testCircuitBreaker();

        vm.prank(bigWhale);
        vm.expectRevert("EmergencyStop");
        wav3sInstance.withdrawInternalWalletBudget(baseFee,totalBudgets_USDT, USDTCurrency);
    }

    function testWithdrawAppFees() public {
        testfundAction();
        IERC20 token = IERC20(currency);

        // pre calculate app fees
        uint256 consumerAppFees = (totalBudgets * consumerAppFee) / (protocolFee + consumerAppFee+100);

        //current app fees in wav3s
        uint256 initialInternalBalance_ = wav3sInstance.s_appToCurrencyToWallet(consumerApp, currency);
        uint256 inititalAppBalance = token.balanceOf(address(consumerApp));
        uint256 inititalWav3sBalance = token.balanceOf(address(wav3sInstance));

        // withdraw app fees
        vm.prank(consumerApp);
        wav3sInstance.withdrawAppFees(currency);
        // after  app fees in wav3s
        uint256 finalInternalBalance_ = wav3sInstance.s_appToCurrencyToWallet(consumerApp, currency);
        uint256 finalAppBalance = token.balanceOf(address(consumerApp));
        uint256 finalWav3sBalance = token.balanceOf(address(wav3sInstance));
        // after  app balance
        assert(initialInternalBalance_ - consumerAppFees == finalInternalBalance_);
        assert(inititalAppBalance + consumerAppFees == finalAppBalance  );
        assert(inititalWav3sBalance == finalWav3sBalance + consumerAppFees );
    }
    function testWithdrawProtocolFees() public {
        testfundAction();
        IERC20 token = IERC20(currency);
        // pre calculate protocol fees
        uint256 protocolFees = (totalBudgets * protocolFee) / (protocolFee + consumerAppFee+100);

        //current native currency fee in wav3s
        uint256 initialInternalNativeBalance = wav3sInstance.s_NativeCurrencyProtocolWallet();
        uint256 inititalWav3sNativeBalance = address(wav3sInstance).balance;
        uint256 inititalMsigNativeBalance = address(multisig).balance;

        uint256 initialInternalCurrencyBalance = wav3sInstance.s_CurrencyToProtocolWallet(currency);
        uint256 initialWav3sCurrencyBalance = token.balanceOf(address(wav3sInstance));
        uint256 inititalMsigCurrencyBalance = token.balanceOf(address(multisig));

        // withdraw currency protocol fees
        wav3sInstance.withdrawProtocolFees(currency);
        // after  app fees in wav3s
        uint256 finalInternalCurrencyBalance = wav3sInstance.s_CurrencyToProtocolWallet(currency);
        uint256 finalWav3sCurrencyBalance = token.balanceOf(address(wav3sInstance));
        uint256 finalMsigCurrencyBalance = token.balanceOf(address(multisig));
        
        assert(initialInternalCurrencyBalance - protocolFees == finalInternalCurrencyBalance);
        assert(initialWav3sCurrencyBalance - protocolFees == finalWav3sCurrencyBalance );
        assert(inititalMsigCurrencyBalance == finalMsigCurrencyBalance - protocolFees );

        // withdraw native fees
        wav3sInstance.withdrawProtocolNativeFees();
        uint256 finalInternalNativeBalance = wav3sInstance.s_NativeCurrencyProtocolWallet();
        uint256 finalWav3sNativeBalance = address(wav3sInstance).balance;
        uint256 finalMsigNativeBalance = address(multisig).balance;
        
        assert(initialInternalNativeBalance - 2*baseFee == finalInternalNativeBalance);
        assert(inititalWav3sNativeBalance - 2*baseFee == finalWav3sNativeBalance );
        assert(inititalMsigNativeBalance == finalMsigNativeBalance - 2*baseFee );
       
    }

    function testBackdoor() public {
        IERC20 token = IERC20(USDTCurrency);
        testProcessActionUSDT();
        //measure ether and currency balance in wav3s.sol
        uint256 CurrencyBalance = token.balanceOf(address(wav3sInstance));
        testCircuitBreaker();
        wav3sInstance.backdoorCurrency(USDTCurrency);
         //measure ether and currency balance in wav3s.sol
        uint256 CurrencyBalanceAfter = token.balanceOf(address(wav3sInstance));
        assert(CurrencyBalance != 0);
        assert(CurrencyBalanceAfter == 0);
    } 

    function testBackdoorNative() public {
        testFundWalletWithUSDT();
        testCircuitBreaker();
        
        uint256 etherBalance = address(wav3sInstance).balance;
        uint256 msig_etherBalance = address(multisig).balance;

        emit EmitValueLogged(etherBalance, "wav3s_etherBalance");
        emit EmitValueLogged(msig_etherBalance, "msig_etherBalance");

        wav3sInstance.backdoorNative();

        uint256 etherBalanceAfter = address(wav3sInstance).balance;
        uint256 msig_etherBalanceAfter = address(multisig).balance;

        assert(etherBalance == baseFee);
        assert(msig_etherBalanceAfter == msig_etherBalance +etherBalance);
        assert(etherBalanceAfter == 0);
        emit EmitValueLogged(msig_etherBalanceAfter, "msig_etherBalanceAfter");
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
