// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {Events} from "./wav3sEvents.sol";
import {Errors} from "./wav3sErrors.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './wav3sFunctions.sol';
import './OracleConsumerContract.sol';
import './RaffleStateLibrary.sol';
// VRF
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

/**
 * @title wav3s
 * @author Daniel Beltrán for wav3s
 * @notice A contract to decentralize incentives on web3 social media for users that want to 
 * add transactional value on exchange for responses of the network.
 */

/**
 * @notice A struct containing the necessary data to execute funded mirror actions on a given profile and post.
 * @param currency The address of the currency used for rewards.
 * @param pubId The identifier of the Publication.
 * @param actionName The name of the action.
 * @param budget The total budget to pay mirrorers.
 * @param reward The amount to be paid to each mirrorer.
 * @param pubIdSet A boolean indicating if the Publication identifier is set.
 * @param initiatedAction A boolean indicating if the action has been initiated.
 */
struct ActionDataBase {
    address currency;
    string pubId;
    string actionName;
    uint256 budget;
    uint256 reward;
    bool pubIdSet;
    bool initiatedAction;
}

/**
 * @notice A struct containing additional filters and parameters for mirror actions.
 * @param zurfersCount The number of zurfers (or retwitters), amount of users interacting with the Action.
 * @param zurfers Addresses of zurfers that have interacted with the action.
 * @param raffleEnd The ending timestamp of the raffle in seconds.
 * @param winners The number of winners in a raffle.
 * @param withdrawalTime The time until which rewards can be withdrawn.
 * @param variable The minimum number of a requirement required to be eligible for rewards.
 */
struct ActionDataFilters {
    uint256 zurfersCount;
    address[] zurfers;
    uint256 raffleEnd;
    uint256 winners;
    uint256 withdrawalTime;
    uint256 variable;
    address pubOwner;
}

struct pa_DATA {
    ActionDataBase pa_ActionDataBase;
    ActionDataFilters pa_ActionDataFilters;
    address user;
    string profileId;
}

contract wav3s is VRFConsumerBaseV2{
    using Events for *;
    wav3sFunctions public wav3sFunction;
    OracleConsumerContract public Oracle;

    using RaffleStateLibrary for RaffleStateLibrary.RaffleState;
    RaffleStateLibrary.RaffleState public raffleState;
    address payable public owner;  // Address of the deployer.
    address public s_multisig;  // The address of the wav3s multisig contract.
    bool private stopped = false;  // Circuit breaker
    uint256 public nextActionId;  // NextId indexer
    uint256 public consumerAppFee_; // buffer helper for _consumerAppFee
    uint256 public protocolFee;  // The fee that will be charged in percentage.
    uint256 public baseFee;  // The base fee that will be charged in ether value.
    using SafeERC20 for IERC20;  // SafeERC20 to transfer tokens.
    //Contract data access
    mapping(uint256 => ActionDataBase) s_actionIdToActionDataBase;  // Mapping to store the base data associated with an action wav3s, indexed by an arbitrary actionId index
    mapping(uint256 => ActionDataFilters) s_actionIdToActionDataFilters;  // Mapping to store the filter data associated with an action wav3s, indexed by an arbitrary actionId index
    mapping(string => mapping (string => ActionDataBase)) public s_PubIdToActionNameToActionDataBase;
    mapping(string => mapping (string => ActionDataFilters)) public s_PubIdToActionNameToActionDataFilters;
    mapping(string => mapping(string => mapping(address => bool))) public s_pubIdToActionNameToUserHasActed;  // Mapping to store whether a given zurfer has interacted with a funded action.
    mapping(address => bool) public s_triggerWhitelisted;  // Whitelisted triggers
    mapping(address => bool) public s_currencyWhitelisted;  // Currency whitelisted currencies
    mapping(address => bool) public s_superCurrencyWhitelisted;  // SuperCurrency whitelisted currencies
    mapping(address => uint256) public s_appAddressToAppFee; // Fee each app charges
    //Internal ZURF wallets
    mapping(address => mapping(address => uint256)) public s_userToCurrencyToWalletBudget; // Mapping to store internal wallet balances in different whitelisted currencies  
    mapping(address => uint256) public s_userToNativeCurrencyWalletBudget; // Mapping to store internal wallet balances in the native currency
    // Internal wav3s and apps wallets
    mapping(address => uint256) public s_CurrencyToProtocolWallet;
    uint256 public s_NativeCurrencyProtocolWallet;
    mapping(address => mapping(address => uint256)) public s_appToCurrencyToWallet;

    // VRF 
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane; // 500 gwei Key Hash;
    uint32 private immutable i_callbackGasLimit;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
     mapping(string => mapping (string => RaffleStateLibrary.RaffleState)) s_pubIdToActionNameToRaffleState; // Mapping to store if a raffle is being calculated or not
    // Mapping to store the association between requestId and pubId-actionName pair
    mapping(uint256 => string[2]) public requestIdToPubIdActionName;
    mapping(string => mapping (string => address[])) public wav3Winner; // Winners of pubid to action wav3
    // VRF Requests
    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
    }
    enum RaffleState {
        OPEN,
        CLOSED
    } 

    // Phala Oracle Consumer Contract
    event ResponseReceived(uint reqId, string reqData, uint256 value);
    event ErrorReceived(uint reqId, string reqData, uint256 errno);

    uint constant TYPE_RESPONSE = 0;
    uint constant TYPE_ERROR = 2;

    mapping(uint => string) requests;
    uint nextRequest = 1;
    uint256 receivedFollowers;
    uint256 paId;
    mapping(uint256 => pa_DATA) s_ProcessActionIdToProcessActionData;

    //Events
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

    constructor(address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        address _wav3sFunctionsAddress,
        address OracleAddress) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        owner = payable(msg.sender);
        wav3sFunction = wav3sFunctions(_wav3sFunctionsAddress);
        Oracle = OracleConsumerContract(OracleAddress);
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

    function fundWallet(uint256 _fundingAmount, address _currency) payable external stopInEmergency returns (uint256){
        require(isTokenWhitelisted(_currency), "TokenNotWhitelisted");
        IERC20(_currency).transferFrom(msg.sender, address(this), _fundingAmount);
        s_userToCurrencyToWalletBudget[msg.sender][_currency] += _fundingAmount;
        require(msg.value >= 0, "Insufficient payment"); 
        s_userToNativeCurrencyWalletBudget[msg.sender] += msg.value;

        return _fundingAmount;
    }

    function fundAction(
        uint256[] memory _budget, uint256[] memory _reward, uint256[] memory _raffleDuration, uint256[] memory _variable, address _currency,
        address consumerApp
    ) external stopInEmergency payable returns (uint256[10] memory){
        // Check array lengths and token whitelisting
        require(_budget.length == _reward.length && _raffleDuration.length == _reward.length && _variable.length == _reward.length, "ArrayLengthMismatch");
        require(isTokenWhitelisted(_currency), "TokenNotWhitelisted");

        consumerAppFee_ = s_appAddressToAppFee[consumerApp];
        uint256 nt = s_superCurrencyWhitelisted[_currency] ? 0 : 1;

        (uint256 amountToTransfer,uint256[10] memory actionIds) = separateBudgetAndFees(
            _budget,
            _reward,
            _raffleDuration,
            _variable,
            _currency,
            consumerAppFee_
            );
        // Transfer currency fees and base fee to wav3s.sol contract
        if(s_userToCurrencyToWalletBudget[msg.sender][_currency] >= amountToTransfer){
            s_userToCurrencyToWalletBudget[msg.sender][_currency] -= amountToTransfer;
            //s_CurrencyToProtocolWallet[_currency] += amountToTransfer;
            }else{
            IERC20(_currency).transferFrom(msg.sender, address(this), amountToTransfer);
            s_userToCurrencyToWalletBudget[msg.sender][_currency] +=amountToTransfer;
            }
        // Transfer fees from wav3s.sol to multisig and to consumer App
        transferFeesToWav3sAndConsumerApp(_currency, nt, amountToTransfer, consumerApp);

        return actionIds;
    }
    function isTokenWhitelisted(address _token) internal view returns (bool) {
        return s_currencyWhitelisted[_token] || s_superCurrencyWhitelisted[_token];
    }
    function calculateNormalTokenMultiplier(address _currency) internal view returns (uint256) {
        return s_superCurrencyWhitelisted[_currency] ? 0 : 1;
    }

    function separateBudgetAndFees(uint256[] memory _budget,
            uint256[] memory _reward,
            uint256[] memory _raffleDuration,
            uint256[] memory _variable,
            address _currency,
            uint256 _consumerAppFee) internal returns (uint256, uint256[10] memory) {

        uint256 amountToTransfer;
        uint256 actionBudget; 
        uint256[10] memory actionIds;    
        uint256 _nt = s_superCurrencyWhitelisted[_currency] ? 0 : 1;

        for (uint256 i; i < _budget.length; ++i) {
            uint256 budget_ = _budget[i];
            uint256 reward_ = _reward[i];
            uint256 raffleDuration_ = _raffleDuration[i];
            uint256 variable_ = _variable[i];

            wav3sFunction.requireValidValues1(reward_,budget_);
            wav3sFunction.requireValidValues2(raffleDuration_,variable_);
            wav3sFunction.requireValidValues3(_consumerAppFee);

            uint256 fees_amount = calculateFeesAmount(budget_, _nt, _consumerAppFee);
            require(reward_ <= (budget_ - fees_amount), "NotEnoughBudgetForThatReward");
            amountToTransfer += budget_;
            actionBudget = budget_ - fees_amount;

            initializeActionDataBase1(nextActionId,actionBudget);
            initializeActionDataBase2(nextActionId,_currency);
            initializeActionDataBase3(nextActionId,reward_);
            initializeActionDataFilters(nextActionId,raffleDuration_,variable_ );

            actionIds[i] = nextActionId;

            emit Events.wav3s__ActionFunded(
                msg.sender,
                s_actionIdToActionDataBase[nextActionId].budget,
                s_actionIdToActionDataBase[nextActionId].reward,
                nextActionId
            );
            nextActionId++;
        }
        return (amountToTransfer,actionIds);
    }

    function initializeActionDataBase1(
        uint256 _actionId,
        uint256 _budget
    ) internal {
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[_actionId];
        actionDataBase.budget = _budget;
        actionDataBase.initiatedAction = true;
        actionDataBase.pubIdSet = false;
    }

    function initializeActionDataBase2(
        uint256 _actionId,
        address _currency
    ) internal {
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[_actionId];
        actionDataBase.currency = _currency;
    }

    function initializeActionDataBase3(
        uint256 _actionId,
        uint256 _reward
    ) internal {
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[_actionId];
        actionDataBase.reward = _reward;
    }

    function initializeActionDataFilters(
        uint256 _actionId,
        uint256 _raffleDuration,
        uint256 _variable) internal {
        ActionDataFilters storage actionDataFilters = s_actionIdToActionDataFilters[_actionId];
        actionDataFilters.variable = _variable;
        if(_raffleDuration > 0){
        actionDataFilters.raffleEnd = block.timestamp + _raffleDuration;}
        else actionDataFilters.raffleEnd = 0;
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
        address _consumerApp    ) internal {
        if (_nt == 1) {
            consumerAppFee_ = s_appAddressToAppFee[_consumerApp];
            uint256 protocolFees = (_amountToTransfer * protocolFee) / (protocolFee + consumerAppFee_+100);
            uint256 consumerAppFees = (_amountToTransfer * consumerAppFee_) / (protocolFee + consumerAppFee_+100);
            if(s_userToNativeCurrencyWalletBudget[msg.sender] >= baseFee){
                s_userToNativeCurrencyWalletBudget[msg.sender] -= baseFee;
            }
            else{
              require(msg.value >= baseFee, "Insufficient payment");
            }
            s_NativeCurrencyProtocolWallet +=  baseFee;
            s_CurrencyToProtocolWallet[_currency] += protocolFees;
            s_appToCurrencyToWallet[_consumerApp][_currency] += consumerAppFees;
        }
    }

    /**
     * @dev Sets the publication ID for a funded post.
     * @param actionId The ID of the funded action.
     * @param pubId The ID of the post.
     * @param actionName The publication ID to set.
     */
    function setPubId(uint256 actionId, string memory pubId, string memory actionName) external onlyWav3sTrigger {
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[actionId];
        require(!actionDataBase.pubIdSet, "ActionAlreadyFunded/Set");
        require(actionId < nextActionId, "ActionNotYetEmitted");
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

       /**
     * @dev Sets the publication ID for a funded post.
     * @param actionId The ID of the funded action.
     * @param pubId The ID of the post.
     * @param actionName The publication ID to set.
     */
    function setPubIdFilters(uint256 actionId, string memory pubId, string memory actionName) internal  {
        ActionDataFilters storage actionDataFilters = s_actionIdToActionDataFilters[actionId];
        ActionDataBase storage actionDataBase = s_actionIdToActionDataBase[actionId];
        ActionDataFilters storage pubActionDataFilters = s_PubIdToActionNameToActionDataFilters[pubId][actionName];
        pubActionDataFilters.pubOwner = actionDataFilters.pubOwner;
        pubActionDataFilters.variable = actionDataFilters.variable;
        pubActionDataFilters.raffleEnd = actionDataFilters.raffleEnd;
        pubActionDataFilters.withdrawalTime = actionDataFilters.withdrawalTime;
        if (pubActionDataFilters.raffleEnd > 0) {
            s_pubIdToActionNameToRaffleState[pubId][actionName] = RaffleStateLibrary.RaffleState.OPEN;
            pubActionDataFilters.winners = actionDataBase.budget / actionDataBase.reward;
        }
    }

    /**
     * @dev Processes an action. This will transfer funds to the owner of the profile that performed the action.
     * @param pubId The ID of the post that was mirrored.
     * @param action String of actions "like," "mirror," etc.
     * @param user The address of the user who mirrored the post.
     * @param profileId The profileId od the user.
     */
    function processAction(
        string memory pubId,
        string[] memory action,
        address[] memory user,
        string[] memory profileId
    ) external stopInEmergency onlyWav3sTrigger {
        require(action.length == user.length && profileId.length == user.length, "ArrayLengthMismatch");
        for (uint256 i; i < action.length; ++i) {
            processSingleAction(pubId, action[i], user[i], profileId[i]);
        }
    }

    function processSingleAction(
        string memory pubId,
        string memory _action,
        address _user,
        string memory profileId
    ) internal {
        ActionDataBase storage actionDataBase = s_PubIdToActionNameToActionDataBase[pubId][_action];
        ActionDataFilters storage actionDataFilters = s_PubIdToActionNameToActionDataFilters[pubId][_action];
        // Store actionDataBase, actionDataFilters, user and profileId in a struct for this action processing.
        // This way, after the oracle response arrives, is can be accessed for checking the requirements
        // Map this action processing to a "process action Id"
        pa_DATA storage processAction_DATA = s_ProcessActionIdToProcessActionData[paId];
        processAction_DATA.pa_ActionDataBase = actionDataBase;
        processAction_DATA.pa_ActionDataFilters = actionDataFilters;
        processAction_DATA.user = _user;
        processAction_DATA.profileId = profileId;
        // Call the Oracle to get in this case, the followers the user has
        Oracle.request(profileId);
    }

    function _onMessageReceived(bytes calldata action) internal {
        
        (uint respType, uint id, uint256 data) = abi.decode(
            action,
            (uint, uint, uint256)
        );
        if (respType == TYPE_RESPONSE) {
            emit ResponseReceived(id, requests[id], data);
            delete requests[id];
        } else if (respType == TYPE_ERROR) {
            emit ErrorReceived(id, requests[id], data);
            delete requests[id];
        }
        // Store the user followers
        receivedFollowers = data;
        // Retrieve the rest of processing action data with current "processing action Id"
        pa_DATA storage processAction_DATA = s_ProcessActionIdToProcessActionData[paId];
        // Check values fulfill the requirements
        require(wav3sFunction.checkValidity(
                processAction_DATA.pa_ActionDataBase.initiatedAction,
                s_pubIdToActionNameToUserHasActed[processAction_DATA.pa_ActionDataBase.pubId][processAction_DATA.pa_ActionDataBase.actionName][processAction_DATA.user],
                receivedFollowers,
                processAction_DATA.pa_ActionDataFilters.variable,
                processAction_DATA.pa_ActionDataBase.reward,
                processAction_DATA.pa_ActionDataBase.budget,
                processAction_DATA.pa_ActionDataBase.pubId), "invalidParameters");

        // Retrieve ActionData strutcs to update data
        ActionDataBase storage actionDataBase = s_PubIdToActionNameToActionDataBase[processAction_DATA.pa_ActionDataBase.pubId][processAction_DATA.pa_ActionDataBase.actionName];
        ActionDataFilters storage actionDataFilters = s_PubIdToActionNameToActionDataFilters[processAction_DATA.pa_ActionDataBase.pubId][processAction_DATA.pa_ActionDataBase.actionName];
        
        // Set the flag indicating that the user has acted with this action
        s_pubIdToActionNameToUserHasActed[actionDataBase.pubId][actionDataBase.actionName][processAction_DATA.user] = true;
        // Count the number of valid zurfers of this publication
        actionDataFilters.zurfersCount++;
        actionDataFilters.zurfers.push(processAction_DATA.user);
        // If not a raffle
        if (actionDataFilters.raffleEnd == 0) {
            // Transfer funds from the budget owner to the zurfer
            IERC20(actionDataBase.currency).transfer(processAction_DATA.user, actionDataBase.reward);
            // Check if the budget is fully consumed
            if (actionDataBase.budget == 0) {
                emit Events.wav3s__ActionFinished(actionDataBase.pubId, actionDataBase.actionName);
            }
            // Update the budget
            actionDataBase.budget -= actionDataBase.reward;
        }
        emit Events.wav3s__ActionProcessed(processAction_DATA.user, actionDataBase.pubId, actionDataBase.actionName);
        paId++;
    }

    /**
     * @dev Executes the raffle for a specific action id. This function verifies the conditions for executing the raffle, including the raffle state, the raffle time, the achievement of the goal, and the availability of enough reMirrorers. If all conditions are met, it requests random winners for the raffle.
     * @param pubId The ID of the post for which the raffle is being executed.
     * @param actionName the action name to be raffled
     */
    function executeRaffle(string memory pubId, string memory actionName) external stopInEmergency onlyWav3sTrigger {
        uint256 winners = s_PubIdToActionNameToActionDataFilters[pubId][actionName].winners;
        wav3sFunction.checkRaffleReqs(
        s_pubIdToActionNameToRaffleState[pubId][actionName],
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].raffleEnd,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].zurfersCount,
        winners
        );
        // Request random winners for the raffle
        requestRandomWinners(winners, pubId, actionName);   
    }

    /**
     * @dev Requests random winners for the raffle. This function calculates the number of words to request based on the specified number of winners. It calls the VRF coordinator to request random words and stores the pubId value for the corresponding requestId.
     * @param winners The number of winners to be selected.
     * @param pubId The ID of the publication for which the random winners are being requested.
     * @param actionName The name of the action to request random winners.
     */
    function requestRandomWinners(uint256 winners, string memory pubId, string memory actionName) internal {
        // Calculate the number of words to request
        uint32 numWords = uint32(winners);
        // Request random words from the VRF coordinator
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

    /**
     * @dev Sets the requestId for a given (pubId, actionName) pair.
     * @param pubId The ID of the publication.
     * @param actionName The name of the action.
     * @param requestId The requestId to associate with the pair.
     */
     function setRequestId(string memory pubId, string memory actionName, uint256 requestId) internal {
        requestIdToPubIdActionName[requestId][0] = pubId;
        requestIdToPubIdActionName[requestId][1] = actionName;
    }

    /**
     * @dev Fulfills the request for random words. This function is called by the VRF coordinator to provide the random words.
     * It uses the random words and pubId values to calculate the index of winners and distribute the prizes accordingly.
     * It also updates the budget of the publication and checks if the publication is finished.
     * @param requestId The ID of the request for random words.
     * @param randomWords An array of random words provided by the VRF coordinator.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
       string memory pubId;
       string memory actionName;
        pubId = requestIdToPubIdActionName[requestId][0];
        actionName = requestIdToPubIdActionName[requestId][1];
        // Ensure that the requestId is valid (pubId and actionName exist)
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
        for (uint256 i; i < actionDataFilters.winners; i++) {
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

    /**
     * @dev Withdraws funds from the budget of a post. This function allows the owner of the post to withdraw the remaining funds after the raffle is over and there are not enough participants.
     * @param pubId The ID of the post.
     */
    function withdrawActionBudget(string memory pubId, string memory actionName) external stopInEmergency {
        // Check if the Publication is initiated
        uint256 budget_ = s_PubIdToActionNameToActionDataBase[pubId][actionName].budget;
        address currency_ = s_PubIdToActionNameToActionDataBase[pubId][actionName].currency;
        wav3sFunction.checkWithdrawalReqs(
        s_PubIdToActionNameToActionDataBase[pubId][actionName].initiatedAction,
        msg.sender,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].pubOwner,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].raffleEnd,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].withdrawalTime,
        budget_,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].zurfersCount,
        s_PubIdToActionNameToActionDataFilters[pubId][actionName].winners
       );
        // Transfer the remaining budget to the owner
        IERC20(currency_).transfer(msg.sender, budget_);
        s_PubIdToActionNameToActionDataBase[pubId][actionName].budget = 0;
        s_pubIdToActionNameToRaffleState[pubId][actionName] = RaffleStateLibrary.RaffleState.CLOSED;
        emit Events.wav3s__ActionWithdrawn(budget_, pubId,actionName, msg.sender);
    }

    function withdrawInternalWalletBudget(uint256 etherAmount, uint256 currencyAmount, address _currency) public payable stopInEmergency {
        require(s_userToCurrencyToWalletBudget[msg.sender][_currency] >= currencyAmount,"NotEnoughCurrency");
        require(s_userToNativeCurrencyWalletBudget[msg.sender] >= etherAmount,"NotEnoughEther");
        payable(msg.sender).transfer(etherAmount);
        IERC20(_currency).transfer(msg.sender, currencyAmount);
        s_userToCurrencyToWalletBudget[msg.sender][_currency] -= currencyAmount;
        s_userToNativeCurrencyWalletBudget[msg.sender] -= etherAmount;
    }
    /**
     * @dev Whitelists a currency.
     * @param _currency The address of the currency to whitelist.
     * @param isSuperCurrency Boolean flag indicating if it's a supercurrency.
     */

    function whitelistCurrency(address _currency, bool isSuperCurrency) external onlyOwner {
        if (isSuperCurrency) {
            s_superCurrencyWhitelisted[_currency] = true;
        } else {
            s_currencyWhitelisted[_currency] = true;
        }
    }
     function unlistCurrency(address _currency) external onlyOwner {
            s_superCurrencyWhitelisted[_currency] = false;
            s_currencyWhitelisted[_currency] = false;
    }

    /**
     * @dev Sets the wav3s trigger addresses. This can only be called by the contract owner.
     * @param wav3sTrigger The new wav3s trigger address.
     */

    function whitelistWav3sTrigger(address wav3sTrigger) external onlyOwner {
        s_triggerWhitelisted[wav3sTrigger] = true;
    }

    /**
     * @dev Sets the multisig address. This can only be called by the contract owner.
     * @param multisig The new multisig address.
     */
    function setMultisig(address multisig) external onlyOwner {
        s_multisig = multisig;
    }

    /**
     * @dev Sets the protocol fees. This can only be called by the contract owner.
     * @param _protocolFee the fees of the protocol in %.
     * @param _baseFee the fee value of the protocol in native currency. eg 1 ether = 1000000000000000000
     */
    function setFees(uint256 _protocolFee, uint256 _baseFee) external onlyOwner {
        protocolFee = _protocolFee;
        baseFee = _baseFee;
        emit Events.wav3s__ProtocolFeeSet(_protocolFee,_baseFee, msg.sender);
    }

    /**
     * @dev Sets the app fees. This can only be called by the app owner.
     * @param appFee the fees of the app in %.
     */
    function setAppFee(uint256 appFee) external {
        s_appAddressToAppFee[msg.sender] = appFee;
    }

    /**
     * @dev Getter functions to easily access ActionData
     */
    function getActionBudget(string memory pubId, string memory action) external view returns (uint256) {
        return s_PubIdToActionNameToActionDataBase[pubId][action].budget;
    }
    function getActionReward(string memory pubId, string memory action) external view returns (uint256) {
        return s_PubIdToActionNameToActionDataBase[pubId][action].reward;
    }
    function getActionRaffleEnd(string memory pubId, string memory action) external view returns (uint256) {
        return s_PubIdToActionNameToActionDataFilters[pubId][action].raffleEnd;
    }
    function getWinners(string memory pubId, string memory actionName) public view returns (address[] memory) {
        return wav3Winner[pubId][actionName];
    }
    /**
     * @dev Sets the circuit breaker to stop contract functionality.
     */
    function circuitBreaker() external onlyOwner {
        stopped = !stopped;
    }

    function withdrawAppFees(address _currency) public {
        IERC20(_currency).transfer(msg.sender, s_appToCurrencyToWallet[msg.sender][_currency]);
        s_appToCurrencyToWallet[msg.sender][_currency] = 0;
    }

    function withdrawProtocolFees(address _currency) public onlyOwner {
        IERC20(_currency).transfer(s_multisig, s_CurrencyToProtocolWallet[_currency]);
        s_CurrencyToProtocolWallet[_currency] = 0;
    }

    function withdrawProtocolNativeFees() public onlyOwner {  
        (bool success, ) = payable(s_multisig).call{value: s_NativeCurrencyProtocolWallet}("");
        require(success, "Transfer failed");
        s_NativeCurrencyProtocolWallet = 0;
    }

    /**
     * @dev Backdoor function to transfer all funds of a specific currency in the contract to the owner.
     * @param _currency The address of the currency to withdraw.
     */
    function backdoorCurrency(address _currency) external onlyInEmergency onlyOwner {
            // Handle ERC20 tokens
            uint256 balance = IERC20(_currency).balanceOf(address(this));
            IERC20(_currency).transfer(s_multisig, balance);
    }

    /**
     * @dev Backdoor function to transfer all funds of the native currency in the contract to the admin.
     */
    function backdoorNative() external onlyInEmergency onlyOwner {
           (bool success, ) = payable(s_multisig).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Fallback function to receive Ether.
     */
    receive() external payable {}

    /**
     * @dev Fallback function to receive Ether.
     */
    fallback() external payable {}

}