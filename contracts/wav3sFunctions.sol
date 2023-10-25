// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {Errors} from "./wav3sErrors.sol";
import './RaffleStateLibrary.sol';

contract wav3sFunctions {
    using RaffleStateLibrary for RaffleStateLibrary.RaffleState; // Import the enum


    struct ActionDataBase {
        bool initiatedAction;
        uint256 budget;
        address currency;
    }

    struct ActionDataFilters {
        uint256 raffleDuration;
        address pubOwner;
    }

    enum RaffleState {
        OPEN,
        CLOSED
    }

      function checkWithdrawalReqs(
        bool initiatedAction,
        address sender,
        address pubOwner,
        uint256 raffleEnd,
        uint256 withdrawalTime,
        uint256 budget,
        uint256 zurfersCount,
        uint256 winners ) external view {
        require(initiatedAction == true, "PostNotInitiated");
        require(pubOwner == sender, "NotSenderProfile");
        if(raffleEnd > 0 ){
            require(block.timestamp > raffleEnd, "RaffleTime not over");
            require(
            zurfersCount < winners,
            "EnoughRetwittersMustExecute"
        );
        }
        require(block.timestamp > withdrawalTime, "withdrawalTime not over");
        require(budget > 0, "BudgetEmpty");
    }

        function checkRaffleReqs( 
        RaffleStateLibrary.RaffleState raffleState,
        uint256 raffleEnd,
        uint256 zurfersCount,
        uint256 winners
    ) external view {
        require(
            raffleState != RaffleStateLibrary.RaffleState.CLOSED,
            "RaffleClosed"
        );
        require(
            block.timestamp > raffleEnd,
            "RaffleTimeNotOver"
        );
        require(
            zurfersCount >= winners,
            "NotEnoughRetwitters"
        );
    }

    function requireValidValues1(
        uint256 reward_,
        uint256 budget_
    ) external pure {
        require(reward_ >= 0, "RewardLessThanZero");
        require(budget_ >= 0, "BudgetLessThanZero");
    }
        function requireValidValues2(
        uint256 raffleDuration_,
        uint256 minFollowers_
    ) external pure {
        require(raffleDuration_ >= 0, "RaffleDurationLessThanZero");
        require(minFollowers_ >= 0, "MinimumFollowersLessThanZero");
    }
        function requireValidValues3(
        uint256 _consumerAppFee
    ) external pure {

        require(_consumerAppFee >= 0, "ConsumerAppFeeLessThanZero");
    }
    
    

    function checkValidity(
        bool initiatedAction,
        bool UserHasActed,
        uint256 followersCount,
        uint256 minFollowers,
        uint256 reward,
        uint256 budget,
        string memory pubId
    )external returns(bool){
        require(initiatedAction, "ActionNotInitiated");

        if (UserHasActed) {
            emit Errors.wav3s__process__ZurferAlreadyActed();
            return false;
        }
// min followers c
        if (followersCount < minFollowers) {
            emit Errors.wav3s__process__NeedMoreFollowers(0, "NeedMoreFollowers");
            return false;
        }
        /////

        if (reward > budget) {
            emit Errors.wav3s__process__RewardHigherThanbudget(0, "NotEnoughBudget");
            return false;
        }

        if (bytes(pubId).length == 0) {
            emit Errors.wav3s__process__InvalidPubId(0, "InvalidpubID");
            return false;
        }
        return true;
    }

}
