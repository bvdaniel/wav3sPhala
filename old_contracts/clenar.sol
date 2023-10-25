// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {Events} from "./wav3sEvents.sol";
import {Errors} from "./wav3sErrors.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './wav3sFunctions.sol';
import './RaffleStateLibrary.sol';
// VRF
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';


struct ActionDataBase {
    address currency;
    string pubId;
    string actionName;
    uint256 budget;
    uint256 reward;
    bool pubIdSet;
    bool initiatedAction;
}

struct ActionDataFilters {
    uint256 zurfersCount;
    address[] zurfers;
    uint256 raffleDuration;
    uint256 winners;
    uint256 withdrawalTime;
    uint256 minFollowers;
    address pubOwner;
}

contract wav3s is VRFConsumerBaseV2{
    using Events for *;
    wav3sFunctions public wav3sFunction;
    using RaffleStateLibrary for RaffleStateLibrary.RaffleState;

    RaffleStateLibrary.RaffleState public raffleState;

    address public owner;  
    address public s_multisig;  
    bool private stopped = false;  
    uint256 public nextActionId = 1;  
    address public s_wav3sTrigger; 
    uint256 public protocolFee;  
    uint256 public baseFee;  
    using SafeERC20 for IERC20;  

    mapping(uint256 => ActionDataBase) s_actionIdToActionDataBase;  
    mapping(uint256 => ActionDataFilters) s_actionIdToActionDataFilters; 
    mapping(string => mapping (string => ActionDataBase)) public s_PubIdToActionNameToActionDataBase;
    mapping(string => mapping (string => ActionDataFilters)) public s_PubIdToActionNameToActionDataFilters;
    mapping(string => mapping(string => mapping(address => bool))) s_pubIdToActionNameToUserHasActed; 
    mapping(address => bool) s_triggerWhitelisted;  
    mapping(address => bool) public s_currencyWhitelisted;  
    mapping(address => bool) public s_consumerAppWhitelisted;  
    mapping(address => bool) public s_superCurrencyWhitelisted;  
    mapping(address => mapping(address => uint256)) s_userToCurrencyToWalletBudget; 
    mapping(address => uint256) s_userToNativeCurrencyWalletBudget; 
    mapping(address => uint256) s_currencyToWav3sBudget;

    // VRF 
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane; 
    uint32 private immutable i_callbackGasLimit;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    mapping(string => mapping (string => RaffleStateLibrary.RaffleState)) s_pubIdToActionNameToRaffleState; 
    mapping(bytes32 => uint256) public s_bytesToRequestIds;
    mapping(uint256 => bytes32) public requestIdToPubIdActionName;
    mapping(string => mapping (string => address[])) public wav3Winner; 

    struct RequestStatus {
        bool fulfilled; 
        bool exists; 
        uint256[] randomWords;
    }

    constructor(address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,address _wav3sFunctionsAddress) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        owner = msg.sender;
        wav3sFunction = wav3sFunctions(_wav3sFunctionsAddress);
    
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "OnlyOwner");
        _;
    }

    modifier onlyWav3sTrigger() {
        require(
            s_triggerWhitelisted[msg.sender] == true,
            "OnlyTriggers"
        );
        _;
    }

    modifier stopInEmergency() {
        require(
            !stopped,
            "EmergencyStop"
        );
        _;
    }
    modifier onlyInEmergency() {
        require(stopped, "NotInEmergency");
        _;
    }

    function fundWallet(uint256 _fundingAmountEther, uint256 _fundingAmount, address _currency) payable external returns (uint256){
        require(
            s_currencyWhitelisted[_currency] || s_superCurrencyWhitelisted[_currency],
            "TokenNotWhitelisted"
        );
        IERC20(_currency).transferFrom(msg.sender, address(this), _fundingAmount);

        s_userToCurrencyToWalletBudget[msg.sender][_currency] += _fundingAmount;

        require(msg.value >= 0, "Insufficient payment"); 
        s_userToNativeCurrencyWalletBudget[msg.sender] += _fundingAmountEther;
        return _fundingAmount;
    }
    function fundAction(
        bytes memory data,
        address consumerApp,
        uint256 consumerAppFee
    ) external stopInEmergency payable returns (uint256) {
        (uint256[] memory _budget, uint256[] memory _reward, uint256[] memory _raffleDuration, uint256[] memory _minFollowers, address _currency) = abi.decode(
            data,
            (uint256[], uint256[], uint256[], uint256[], address)
        );

        require(_budget.length == _reward.length && _raffleDuration.length == _reward.length && _minFollowers.length == _reward.length, "ArrayLengthMismatch");
        require(isTokenWhitelisted(_currency), "TokenNotWhitelisted");

        uint256 nt = calculateNormalTokenMultiplier(_currency);

        bytes memory separateBudgetAndFeesData = abi.encode(
            _budget,
            _reward,
            _raffleDuration,
            _minFollowers,
            _currency,
            consumerAppFee,
            nt
            );

        uint256 amountToTransfer = separateBudgetAndFees(separateBudgetAndFeesData);

        if(s_userToCurrencyToWalletBudget[msg.sender][_currency] >= amountToTransfer){
            s_userToCurrencyToWalletBudget[msg.sender][_currency] -= amountToTransfer;
            }else{
            IERC20(_currency).transferFrom( msg.sender, address(this), amountToTransfer);
            }

        if(s_userToNativeCurrencyWalletBudget[msg.sender] >= baseFee){
                s_userToNativeCurrencyWalletBudget[msg.sender] -= baseFee;}
            else{require(msg.value >= baseFee, "Insufficient payment");
            }
        transferFeesToWav3sAndConsumerApp(_currency, nt, amountToTransfer, consumerApp, consumerAppFee);

        return nextActionId++;
    }

    function isTokenWhitelisted(address _token) internal view returns (bool) {
        return s_currencyWhitelisted[_token] || s_superCurrencyWhitelisted[_token];
    }

    function calculateNormalTokenMultiplier(address _currency) internal view returns (uint256) {
        return s_superCurrencyWhitelisted[_currency] ? 0 : 1;
        }
    function separateBudgetAndFees(bytes memory data) internal returns (uint256) {
        (
            uint256[] memory _budget,
            uint256[] memory _reward,
            uint256[] memory _raffleDuration,
            uint256[] memory _minFollowers,
            address _currency,
            uint256 _consumerAppFee,
            uint256 _nt
        ) = abi.decode(
            data,
            (uint256[], uint256[], uint256[], uint256[], address, uint256, uint256)
        );

        uint256 amountToTransfer;
        uint256 actionBudget; 
        for (uint256 i; i < _budget.length; ++i) {

            uint256 budget_ = _budget[i];
            uint256 reward_ = _reward[i];
            uint256 raffleDuration_ = _raffleDuration[i];
            uint256 minFollowers_ = _minFollowers[i];

            wav3sFunction.requireNonNegativeValues(reward_,budget_,raffleDuration_,minFollowers_,_consumerAppFee);

            uint256 fees_amount = calculateFeesAmount(budget_, _nt, _consumerAppFee);

            require(reward_ <= (budget_ - fees_amount), "NotEnoughBudgetForThatReward");

            amountToTransfer += budget_;
            actionBudget = budget_ - fees_amount;

            initializeActionDataBase(nextActionId,actionBudget,_currency, reward_);
            initializeActionDataFilters(nextActionId,raffleDuration_,minFollowers_ );

            emit Events.wav3s__ActionFunded(
                s_actionIdToActionDataBase[nextActionId].budget,
                s_actionIdToActionDataBase[nextActionId].reward,
                nextActionId
            );
        }
        return amountToTransfer;
    }
    function initializeActionDataBase(
        uint256 _actionId,
        uint256 _budget,
        address _currency,
        uint256 _reward
    ) internal {
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[_actionId];
        actionDataBase.budget = _budget;
        actionDataBase.currency = _currency;
        actionDataBase.reward = _reward;
        actionDataBase.initiatedAction = true;
        actionDataBase.pubIdSet = false;
    }
    function initializeActionDataFilters(
        uint256 _actionId,
        uint256 _raffleDuration,
        uint256 _minFollowers) internal {
        ActionDataFilters storage actionDataFilters = s_actionIdToActionDataFilters[_actionId];

        actionDataFilters.raffleDuration = _raffleDuration;
        actionDataFilters.minFollowers = _minFollowers;
        actionDataFilters.withdrawalTime = block.timestamp + 2 days;
        actionDataFilters.pubOwner = msg.sender;

    }
    function calculateFeesAmount(uint256 _budget, uint256 _nt, uint256 _consumerAppFee) internal view returns (uint256) {
        return (_nt * (protocolFee + _consumerAppFee) * _budget) / (100 + (protocolFee + _consumerAppFee));
    }
    function transferFeesToWav3sAndConsumerApp(
        address _currency,
        uint256 _nt,
        uint256 _amountToTransfer,
        address _consumerApp,
        uint256 _consumerAppFee
    ) internal {
        if (_nt == 1) {
            IERC20 token = IERC20(_currency);
            uint256 protocolFees = (_amountToTransfer * protocolFee) / (protocolFee + _consumerAppFee+100);
            uint256 consumerAppFees = (_amountToTransfer * _consumerAppFee) / (protocolFee + _consumerAppFee+100);

            token.transfer(s_multisig, protocolFees);
            token.transfer(_consumerApp, consumerAppFees);
        }
    }
    function setPubId(uint256 actionId, string memory pubId, string memory actionName) external onlyWav3sTrigger {
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[actionId];
        require(!actionDataBase.pubIdSet, "ActionAlreadyFunded/Set");

        ActionDataBase storage pubActionDataBase = s_PubIdToActionNameToActionDataBase[pubId][actionName];

        pubActionDataBase.currency = actionDataBase.currency;
        pubActionDataBase.actionName = actionName;
        pubActionDataBase.pubId = pubId;
        pubActionDataBase.pubIdSet = true;
        pubActionDataBase.budget = actionDataBase.budget;
        pubActionDataBase.reward = actionDataBase.reward;
        pubActionDataBase.initiatedAction = true;

        setPubIdFilters(actionId, pubId, actionName);
    }

    function setPubIdFilters(uint256 actionId, string memory pubId, string memory actionName) internal  {
        ActionDataFilters storage actionDataFilters = s_actionIdToActionDataFilters[actionId];
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[actionId];

        ActionDataFilters storage pubActionDataFilters = s_PubIdToActionNameToActionDataFilters[pubId][actionName];
  
        pubActionDataFilters.minFollowers = actionDataFilters.minFollowers;
        pubActionDataFilters.raffleDuration = actionDataFilters.raffleDuration;
        pubActionDataFilters.withdrawalTime = actionDataFilters.withdrawalTime;

        if (pubActionDataFilters.raffleDuration > 0) {
            s_pubIdToActionNameToRaffleState[pubId][actionName] = RaffleStateLibrary.RaffleState.OPEN;
            pubActionDataFilters.winners = actionDataBase.budget / actionDataBase.reward;
        }
    }
    function processAction(
        string memory pubId,
        string[] memory action,
        address[] memory user,
        uint256[] memory followersCount
    ) external stopInEmergency onlyWav3sTrigger {

        require(action.length == user.length && followersCount.length == user.length, "ArrayLengthMismatch");

        for (uint256 i; i < action.length; ++i) {
            processSingleAction(pubId, action[i], user[i], followersCount[i]);
        }
    }

    function processSingleAction(
        string memory pubId,
        string memory _action,
        address _user,
        uint256 _followersCount
    ) internal {
        ActionDataBase storage actionDataBase = s_PubIdToActionNameToActionDataBase[pubId][_action];
        ActionDataFilters storage actionDataFilters = s_PubIdToActionNameToActionDataFilters[pubId][_action];

        require(isActionValid(actionDataBase,actionDataFilters, _user, _followersCount), "InvalidParams");
        
        s_pubIdToActionNameToUserHasActed[pubId][_action][_user] = true;
        actionDataFilters.zurfersCount++;
        actionDataFilters.zurfers.push(_user);

        if (actionDataFilters.raffleDuration == 0) {
            IERC20(actionDataBase.currency).transferFrom(address(this), _user, actionDataBase.reward);
            if (actionDataBase.budget == 0) {
                emit Events.wav3s__ActionFinished(pubId, _action);
            }
            actionDataBase.budget -= actionDataBase.reward;
        }
        emit Events.wav3s__ActionProcessed( _user, actionDataBase.pubId);
    }

    function isActionValid(
        ActionDataBase storage actionDataBase,
        ActionDataFilters storage actionDataFilters,
        address _user,
        uint256 _followersCount
    ) internal returns (bool) {
        require(actionDataBase.initiatedAction, "ActionNotInitiated");

        return wav3sFunction.checkValidity(
        actionDataBase.initiatedAction,
        s_pubIdToActionNameToUserHasActed[actionDataBase.pubId][actionDataBase.actionName][_user],
        _followersCount,
        actionDataFilters.minFollowers,
        actionDataBase.reward,
        actionDataBase.budget,
        actionDataBase.pubId);
    }
    function executeRaffle(string memory pubId, string memory actionName) external stopInEmergency onlyWav3sTrigger {
        uint256 winners = s_PubIdToActionNameToActionDataFilters[pubId][actionName].winners;

        wav3sFunction.checkRaffleReqs(
        s_pubIdToActionNameToRaffleState[pubId][actionName],
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].raffleDuration,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].zurfersCount,
        winners
        );

        requestRandomWinners(winners, pubId, actionName);
    }
    function requestRandomWinners(uint256 winners, string memory pubId, string memory actionName) internal {
        uint32 numWords = uint32(winners);
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            numWords
        );
        setRequestId(pubId, actionName,requestId);
        emit Events.RequestedRaffleWinners(requestId);
    }
    function setRequestId(string memory pubId, string memory actionName, uint256 requestId) internal {
        bytes32 key = keccak256(abi.encodePacked(pubId, actionName));
        requestIdToPubIdActionName[requestId] = key;
    }
    function getRequestId(string memory pubid, string memory actionName) internal view returns (uint256) {
        bytes32 key = keccak256(abi.encodePacked(pubid, actionName));
        return s_bytesToRequestIds[key];
    }
    function decodeRequestId(uint256 requestId) internal view returns (string memory pubId, string memory actionName) {
        bytes32 key = requestIdToPubIdActionName[requestId];
        require(key != bytes32(0), "Invalid requestId");
        bytes memory keyBytes = new bytes(32);
        assembly {
            mstore(add(keyBytes, 32), key)
        }
        (pubId, actionName) = abi.decode(keyBytes, (string, string));
    }
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
       string memory pubId;
       string memory actionName;
        (pubId, actionName) = decodeRequestId(requestId);
        require(bytes(pubId).length > 0 && bytes(actionName).length > 0, "Invalid requestId");
        ActionDataBase storage actionDataBase = s_PubIdToActionNameToActionDataBase[pubId][actionName];
        ActionDataFilters storage actionDataFilters = s_PubIdToActionNameToActionDataFilters[pubId][actionName];
        calculateWinnersAndDistributePrizes(actionDataBase,actionDataFilters , randomWords);
    }

    function calculateWinnersAndDistributePrizes(
        ActionDataBase storage actionDataBase,
        ActionDataFilters storage actionDataFilters,
        uint256[] memory randomWords
    ) internal {

        for (uint256 i = 0; i < actionDataFilters.winners; i++) {
            uint256 indexOfWinner = randomWords[i] % actionDataFilters.zurfersCount;
            address winner = s_PubIdToActionNameToActionDataFilters[actionDataBase.pubId][actionDataBase.actionName].zurfers[indexOfWinner];

            transferPrizeAndUpdateBudget(actionDataBase, winner, indexOfWinner);
            updateWav3WinnersList(actionDataBase, winner);
        }

        checkIfPublicationFinished(actionDataBase);
    }

    function transferPrizeAndUpdateBudget(
        ActionDataBase storage actionDataBase,
        address winner,
        uint256 indexOfWinner
    ) internal {
        uint256 _reward = actionDataBase.reward;

        IERC20(actionDataBase.currency).transfer(winner, _reward);

        emit Events.wav3s__PrizePaid(actionDataBase.pubId,actionDataBase.actionName, indexOfWinner, winner, _reward);

        actionDataBase.budget -= _reward;
    }

    function updateWav3WinnersList(ActionDataBase storage actionDataBase, address winner) internal {
        wav3Winner[actionDataBase.pubId][actionDataBase.actionName].push(winner);
    }

    function checkIfPublicationFinished(ActionDataBase storage actionDataBase) internal {
        if (actionDataBase.budget == 0) {
            emit Events.wav3s__ActionPrizeFinished(actionDataBase.pubId, actionDataBase.actionName);
            s_pubIdToActionNameToRaffleState[actionDataBase.pubId][actionDataBase.actionName] = RaffleStateLibrary.RaffleState.CLOSED;
        }
    }
    function withdrawActionBudget(string memory pubId, string memory actionName) external stopInEmergency {
        uint256 budget_ = s_PubIdToActionNameToActionDataBase[pubId][actionName].budget;
        address currency_ = s_PubIdToActionNameToActionDataBase[pubId][actionName].currency;

       wav3sFunction.checkWithdrawalReqs(
        s_PubIdToActionNameToActionDataBase[pubId][actionName].initiatedAction,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].pubOwner,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].raffleDuration,
        budget_
       );

        IERC20(currency_).transfer(msg.sender, budget_);
        s_PubIdToActionNameToActionDataBase[pubId][actionName].budget = 0;
        s_pubIdToActionNameToRaffleState[pubId][actionName] = RaffleStateLibrary.RaffleState.CLOSED;

        emit Events.wav3s__ActionWithdrawn(budget_, pubId,actionName, msg.sender);
    }
    function whitelistCurrency(address _currency, bool isSuperCurrency) external onlyOwner {
        if (isSuperCurrency) {
            s_superCurrencyWhitelisted[_currency] = true;
        } else {
            s_currencyWhitelisted[_currency] = true;
        }
    }

    function whitelistWav3sTrigger(address wav3sTrigger) external onlyOwner {
        s_triggerWhitelisted[wav3sTrigger] = true;
    }
    function whitelistConsumerApp(address consumerAppAddress) external onlyOwner {
        s_consumerAppWhitelisted[consumerAppAddress] = true;
    }
    function setMultisig(address multisig) external onlyOwner {
        s_multisig = multisig;
    }
    function setFees(uint256 _protocolFee, uint256 _baseFee) external onlyOwner {
        protocolFee = _protocolFee;
        baseFee = _baseFee;
        emit Events.wav3s__ProtocolFeeSet(_protocolFee,_baseFee, msg.sender);
    }
    function getActionBudget(string memory pubId, string memory action) external view returns (uint256) {
        return s_PubIdToActionNameToActionDataBase[pubId][action].budget;
    }

    function getWinners(string memory pubId, string memory actionName) public view returns (address[] memory) {
        return wav3Winner[pubId][actionName];
    }
    function circuitBreaker() external onlyOwner {
        stopped = !stopped;
        emit Events.wav3s__CircuitBreak(stopped);
    }
    function backdoor(address _currency) external onlyInEmergency onlyOwner {
        if (_currency == address(0)) {
            payable(msg.sender).transfer(address(this).balance);
            emit Events.wav3s__backdoor(_currency, address(this).balance);
        } else {
            uint256 balance = IERC20(_currency).balanceOf(address(this));
            IERC20(_currency).transfer(msg.sender, balance);
            emit Events.wav3s__backdoor(_currency, balance);
        }
    }
    receive() external payable {}
    fallback() external payable {}
}