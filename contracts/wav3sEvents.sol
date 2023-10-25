// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

library Events {
    // wav3s Currency
       event wav3s__ActionFunded(
        address sender,
        uint256 budget,
        uint256 reward,
        uint256 actionId
    );

    event wav3s__ActionProcessed(
        address user,
        string pubId,
        string action
    );
    event wav3s__RewardsWithdrawn(
        address user,
        uint256 rewardsWitdrawn
    );

  
    event wav3s__ActionFinished(string pubId, string action);
    event wav3s__ActionPrizeFinished(string pubId, string actionName);

    event wav3s__TriggerSet(address trigger, address sender);
    event wav3s__ProtocolFeeSet(uint256 protocolFee,uint256 baseFee, address sender);

    event wav3s__PubWithdrawn(
        uint256 budget,
        string pubId,
        address sender
    );
    event RequestedRaffleWinners(uint256 indexed requestId);
    event wav3s__PrizePaid(string pubId, string actionName,uint256 indexOfWinners,address mirrorer, uint256 reward);

    event wav3s__ConsumerAppWhitelisted(address consumerAppAddress);

    event wav3s__CircuitBreak(bool stop);

    event wav3s__EmergencyWithdraw(
        string pubId,
        uint256 budget,
        address sender
    );
  
    event wav3s__PostFundedInEmergency(
        string pubId,
        uint256 budget,
        uint256 budgetFinal
    );

    event wav3s__backdoor(address currency, uint256 balance);

    event wav3s__CurrencyWhitelisted(address currency,bool isSuperCurrency);

    // Raffle multi currency events
    event wav3sMirror__PostFunded(
        uint256 actionIndex,
        uint256 budget,
        uint256 reward,
        address pubOwnerAddress,
        uint256 pubId
    );

    event wav3sMirror__MirrorProcessed(uint256 currentBudget, uint256 reward, address mirrorerAddress, string pubId);

    event wav3sMirror__RewardsWithdrawn(
        address mirrorerAddress,
        uint256 rewardsWitdrawn
    );

  
    event wav3sMirror__ActionFinished(string pubId, string action);

    event wav3sMirror__TriggerSet(address trigger, address sender);
    event wav3sMirror__MsigSet(address msig, address sender);
    event wav3s__ActionWithdrawn(
        uint256 budget,
        string pubId,
        string actionName,
        address sender
    );
    event wav3sMirror__consumerAppWhitelisted(address consumerAppAddress);

    event wav3sMirror__CircuitBreak(bool stop);

    event wav3sMirror__EmergencyWithdraw(
        string pubId,
        uint256 budget,
        address sender
    );
  
    event wav3sMirror__PostFundedInEmergency(
        string pubId,
        uint256 budget,
        uint256 budgetFinal
    );

    event wav3sMirror__backdoor(address currency, uint256 balance);

    event wav3sMirror__CurrencyWhitelisted(address currency, bool isSuperCurrency);
    event wav3sMirror__SuperCurrencyWhitelisted(address currency,address sender);

    event wav3sMirrorV1__PostFunded(
            uint256 budget,
            uint256 reward,
            address pubOwnerAddress,
            address consumerAppAddress,
            string socialGraph,
            string pubId
        );

    event wav3sMulti__feeSet(uint256 _wav3sFee,uint256 _baseFee);
}