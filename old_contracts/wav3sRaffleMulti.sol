// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {Events} from "./wav3sEvents.sol";
import {Errors} from "./wav3sErrors.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// VRF
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

/**
 * @title wav3sRaffleMirror
 * @author Daniel Beltrán for wav3s
 * @notice A contract to transfer rewards using ChainLink VRF to profile's accounts that interacted with a Publication
 * on Twitter that the customer previously fund with a budget.
 */

struct PostData {
    uint256 budget;                 // The allocated budget for the publication
    uint256 reward;                 // The reward amount for participants
    uint256 minFollowers;           // The minimum number of followers required to be eligible for the reward
    address pubOwnerAddress;        // The address of the owner of the publication
    uint256 raffleTime;             // The time at which the raffle will take place
    string pubId;                   // The unique identifier of the publication
    bool pubIdSet;                  // Indicates whether the publication ID is set
    bool initiatedWav3;             // Indicates whether the contract has been initialized with Wav3
    uint256 retwitters;             // The number of users who have reMirrored the publication
    uint256 winners;                // The number of winners selected in the raffle
    uint256 timeout;                // The timeout duration for participants
    address currency;               // The address of the currency/token used for rewards
    uint256 goal;                   // The desired goal for the publication
    bool isSuperCurrency;
}

contract wav3sRaffleMulti is VRFConsumerBaseV2{
    using Events for *;

     // Events
    event wav3sRaffleMirror__PostFunded(uint256 budget, uint256 reward, address pubOwnerAddress, uint256 pubId);
    event wav3sRaffleMirror__MirrorProcessed(uint256 currentBudget, uint256 reward, address mirrorerAddress, string pubId);
    event wav3sRaffleMirror__RewardsWithdrawn(address mirrorerAddress, uint256 rewardsWitdrawn);
    event wav3sRaffleMirror__PubFinished(string pubId);
    event wav3sRaffleMirror__TriggerSet(address trigger, address sender);
    event wav3sRaffleMirror__MsigSet(address msig, address sender);
    event wav3sRaffleMirror__PubWithdrawn(uint256 budget, string pubId, address sender);
    event wav3sRaffleMirror__consumerAppWhitelisted(address consumerAppAddress);
    event wav3sRaffleMirror__CircuitBreak(bool stop);
    event wav3sRaffleMirror__EmergencyWithdraw(string pubId, uint256 budget, address sender);
    event wav3sRaffleMirror__PostFundedInEmergency(string pubId, uint256 budget, uint256 budgetFinal);
    event wav3sRaffleMirror__backdoor(address currency, uint256 balance);
    event wav3sRaffleMirror__CurrencyWhitelisted(address currency, bool isSuperCurrency);
    event wav3sRaffleMirror__SuperCurrencyWhitelisted(address currency, address sender);
    
    // Errors
    event wav3sRaffleMirror__process__ArrayLengthMismatch(string error);
    event wav3sRaffleMirror__process__PostNotInitiated(uint256 index, string error);
    event wav3sRaffleMirror__process__FollowerAlreadyMirrored(uint256 index, string error);
    event wav3sRaffleMirror__process__NeedMoreFollowers(uint256 index, string error);
    event wav3sRaffleMirror__process__NotEnoughBudgetForThatReward(uint256 index, string error);
    event wav3sRaffleMirror__process__InvalidRetwitterAddress(uint256 index, string error);
    event wav3sRaffleMirror__process__InvalidAppAddress(uint256 index, string error);
    event wav3sRaffleMirror__process__InvalidPubId(uint256 index, string error);
    event wav3sRaffleMirror__process__AppAddressNotWhitelisted(uint256 index, string error);
    event wav3sRaffleMirror__process__InvalidpubOwnerAddress(uint256 index, string error);
    
    
    // VRF Coordinator
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane; // 500 gwei Key Hash;
    uint32 private immutable i_callbackGasLimit;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    event RequestedRaffleWinners(uint256 indexed requestId);
    event wav3sRaffleMirror__PrizePaid(string pubId,uint256 indexOfWinners,address mirrorer, uint256 reward);

    // VRF Requests
    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
    }
    mapping(uint256 => RequestStatus) public s_requests; 
    // past requests Id.
    uint256[] public requestIds;
    uint256 public lastRequestId;

    enum RaffleState {
        OPEN,
        CLOSED
    } 
    address public owner; // Address of the deployer
    address public s_multisig; // The address of the wav3s multisig contract
    bool private stopped = false; // Circuit breaker
    uint256 public nextId = 1;
    address public s_wav3sTrigger; // The address of the wav3sTrigger contract
    uint256 immutable i_wav3s_fee; // The fee that will be charged in percentage

    using SafeERC20 for IERC20; // SafeERC20 to transfer tokens

    uint256 private budget; // The budget for the post pointed to
    uint256 private reward; // The reward for the post pointed to
    address private currency; // The currency address for the post pointed to
    uint256 private minFollowers; // The minimum number of followers for a post

    mapping(string => PostData) postDataByPublicationId; // Mapping to store the data associated with a wav3s before knowing the pubid, indexed by social graph and Publication ID
    mapping(uint256 => PostData) postDataByPublicationIndex; // Mapping to store the data associated with a wav3s after knowing the pubid, indexed by social graph and Publication ID
    mapping(string => mapping(uint256 => address)) s_PubIdToIndexToMirrorer; // Mapping to store all the retwitter of a pubId by an index
    mapping(string => mapping(address => bool)) s_PubIdToFollowerHasMirrored; // Mapping to store whether a given follower has mirrored a given post or not
    mapping(string => RaffleState) s_PubIdToRaffleState; // Mapping to store if a raffle is being calculated or not
    mapping(uint256 => string) public pubIds; // Mapping to track pubIds according to requestIds
    mapping(address => bool) s_triggerWhitelisted; // Whitelisted triggers
    mapping(string => uint256) s_PublicationToWithdrawalTime; // Whitdrawal time
    mapping(string => address[]) public wav3Winner; // Winners of pubId
    mapping(address => bool) public s_currencyWhitelisted; // Currency whitelisted currencies
    mapping(address => bool) public s_superCurrencyWhitelisted; // SuperCurrency whitelisted currencies

 

    constructor(uint256 wav3s_fee, address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_wav3s_fee = wav3s_fee;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    modifier onlyWav3sTrigger() {
        require(
            s_triggerWhitelisted[msg.sender] == true,
            "Only whitelisted triggers can call this function."
        );
        _;
    }

    modifier stopInEmergency() {
        require(
            !stopped,
            "Emergency stop is active"
        );
        _;
    }
    modifier onlyInEmergency() {
        require(stopped, "Not in Emergency");
        _;
    }
    /**
     * @dev Funds a wav3sRaffleMirror post. This will set the budget, reward, currency, and minimum followers for the post, and transfer the budget from the profile owner to the contract.
     * @param _budget The budget for the post.
     * @param _reward The reward for each winner of the post.
     * @param _pubOwnerAddress The address of the profile that is funding the post.
     * @param _minFollowers The minimum number of followers for the post.
     * @param _raffleTime The duration of the raffle.
     * @param _currency The address of the currency used for the post.
     * @param _goal The goal for the post.
     * @return The ID of the funded post.
     */

   
    function fundMirror(
        uint256 _budget,
        uint256 _reward,
        address _pubOwnerAddress,
        uint256 _minFollowers,
        uint256 _raffleTime,
        address _currency,
        uint256 _goal
    ) external stopInEmergency payable returns(uint256) {
        uint256 st;
        // Check if the msg.sender is the profile owner
        require(
            msg.sender == _pubOwnerAddress,
            "wav3sRaffleMirror__fundMirror__SenderNotOwner"
        );

               if(s_superCurrencyWhitelisted[_currency] == true){
                st =0;  // The normal token multiplier
                postDataByPublicationIndex[nextId].isSuperCurrency = true; 

        }else{
                st=1;
                postDataByPublicationIndex[nextId].isSuperCurrency = false;
                require(msg.value >= 1 ether, "Insufficient payment"); // 1 MATIC = 1 ether in this example
 
        }
        uint256 total_fees = i_wav3s_fee;

        // Separate budget from fees.
        uint256 fees_amount = (_budget * total_fees * st) / (100 + total_fees);
        postDataByPublicationIndex[nextId].budget = _budget - fees_amount;

        // Check if the budget is enough for the reward
        require(
            _reward <= postDataByPublicationIndex[nextId].budget,
            "wav3sRaffleMirror__fundMirror__RewardBiggerThanBudget"
        );

        require(
            s_currencyWhitelisted[_currency] || s_superCurrencyWhitelisted[_currency],
            "wav3sRaffleMirror__fundMirror__TokenNotWhitelisted"
        );

        // Set the reward, currency, currency address, profile address and consumerApp address of this Publication.
        postDataByPublicationIndex[nextId].reward = _reward;
        postDataByPublicationIndex[nextId].pubOwnerAddress = _pubOwnerAddress;
        postDataByPublicationIndex[nextId].minFollowers = _minFollowers;
        postDataByPublicationIndex[nextId].initiatedWav3 = true;
        postDataByPublicationIndex[nextId].pubIdSet = false;
        postDataByPublicationIndex[nextId].raffleTime = block.timestamp + _raffleTime;
        postDataByPublicationIndex[nextId].currency = _currency;
        postDataByPublicationIndex[nextId].goal = _goal;

        // Transfer funds from the budget owner to wav3s contract
        IERC20(_currency).safeTransferFrom(
            _pubOwnerAddress,
            address(this),
            _budget
        );

        if(st==1)
        {
        IERC20(_currency).transfer(
            s_multisig,
            ((fees_amount * i_wav3s_fee) / total_fees)
        );
        }

        emit Events.wav3sRaffleMirror__PostFunded(
            postDataByPublicationIndex[nextId].budget,
            _reward,
            _pubOwnerAddress,
            nextId
            );
        return nextId++;
    }

    /**
     * @dev Sets the pubId for a post identified by its ID. Only the wav3sTrigger contract can call this function.
     * @param id The ID of the post.
     * @param pubId The pubId to be set.
     */
    function setPubId(uint256 id, string calldata pubId) external onlyWav3sTrigger {
        require(
            !postDataByPublicationIndex[id].pubIdSet,
            "wav3sRaffleMirror__setPubId__PostAlreadySet"
        );
        require(
            postDataByPublicationIndex[id].initiatedWav3,
            "wav3sRaffleMirror__setPubId__IncorrectNextId"
        );

        // Mark the pubId as set for the corresponding PostData struct
        postDataByPublicationIndex[id].pubIdSet = true;

        // Update the fields of the corresponding PostData struct in the postDataByPublicationId mapping
        postDataByPublicationId[pubId].pubId = pubId;
        postDataByPublicationId[pubId].pubIdSet = true;
        postDataByPublicationId[pubId].budget = postDataByPublicationIndex[id].budget;
        postDataByPublicationId[pubId].reward = postDataByPublicationIndex[id].reward;
        postDataByPublicationId[pubId].pubOwnerAddress = postDataByPublicationIndex[id].pubOwnerAddress;
        postDataByPublicationId[pubId].minFollowers = postDataByPublicationIndex[id].minFollowers;
        postDataByPublicationId[pubId].initiatedWav3 = true;
        postDataByPublicationId[pubId].raffleTime = postDataByPublicationIndex[id].raffleTime;
        postDataByPublicationId[pubId].currency = postDataByPublicationIndex[id].currency;
        postDataByPublicationId[pubId].goal = postDataByPublicationIndex[id].goal;
        postDataByPublicationId[pubId].winners = postDataByPublicationId[pubId].budget / postDataByPublicationId[pubId].reward;

        // Open the raffle for the pubId
        s_PubIdToRaffleState[pubId] = RaffleState.OPEN;
    }

    /**
     * @dev Processes a mirror action. This function verifies the validity of a mirror action by checking the initiation status of the publication, the mirrorer's address, and the number of followers. If the mirror action is valid, it sets the necessary flags and counters, and emits an event to indicate the successful processing of the mirror action. Funds are transferred to the owner of the profile that initiated the mirror.
     * @param pubId The ID of the post that was mirrored.
     * @param mirrorerAddress The address of the follower who mirrored the post.
     * @param followersCount The number of followers of the mirrorer's profile.
     */
    function processMirror(
        string calldata pubId,
        address[] calldata mirrorerAddress,
        uint256[] calldata followersCount
    ) external stopInEmergency onlyWav3sTrigger {
        // Check if the publication is initiated
        require(
            postDataByPublicationId[pubId].initiatedWav3 == true,
            "wav3sRaffleMirror__process__PostNotInitiated"
        );
        require(
            mirrorerAddress.length == followersCount.length,
            "wav3sRaffleMirror__process__ArrayLengthMismatch"
        );

        reward = postDataByPublicationId[pubId].reward;
        minFollowers = postDataByPublicationId[pubId].minFollowers;

        for (uint256 i = 0; i < mirrorerAddress.length; i++) {
            if (s_PubIdToFollowerHasMirrored[pubId][mirrorerAddress[i]]) {
                emit wav3sRaffleMirror__process__FollowerAlreadyMirrored(
                    i,
                    "Follower already mirrored"
                );
                continue;
            }

            if (mirrorerAddress[i] == address(0)) {
                emit wav3sRaffleMirror__process__InvalidRetwitterAddress(
                    i,
                    "Invalid profile address"
                );
                continue;
            }

            if (followersCount[i] < minFollowers) {
                emit wav3sRaffleMirror__process__NeedMoreFollowers(
                    i,
                    "Need more followers"
                );
                continue;
            }
            // Set the flag indicating that the follower has mirrored this profile
            s_PubIdToFollowerHasMirrored[pubId][mirrorerAddress[i]] = true;
            // Count the number of valid reMirrorers of this publication
            postDataByPublicationId[pubId].retwitters++;
            s_PubIdToIndexToMirrorer[pubId][
                postDataByPublicationId[pubId].retwitters
            ] = mirrorerAddress[i];

            emit Events.wav3sRaffleMirror__MirrorProcessed(
                postDataByPublicationId[pubId].budget,
                reward,
                mirrorerAddress[i],
                pubId
            );
        }
    }

    

    /**
     * @dev Executes the raffle for a specific publication. This function verifies the conditions for executing the raffle, including the raffle state, the raffle time, the achievement of the goal, and the availability of enough reMirrorers. If all conditions are met, it requests random winners for the raffle.
     * @param pubId The ID of the post for which the raffle is being executed.
     */
    function executeRaffle(string calldata pubId) external stopInEmergency onlyWav3sTrigger {
        uint256 winners = postDataByPublicationId[pubId].winners;

        // Check if the raffle is not closed
        require(
            s_PubIdToRaffleState[pubId] != RaffleState.CLOSED,
            "wav3sRaffleMirror__executeRaffle__RaffleClosed"
        );

        // Check if the raffle time has passed
        require(
            block.timestamp > postDataByPublicationId[pubId].raffleTime,
            "wav3sRaffleMirror__executeRaffle__RaffleTimeNotOver"
        );

        // Check if the goal has been reached
        require(
            postDataByPublicationId[pubId].retwitters >= postDataByPublicationId[pubId].goal,
            "wav3sRaffleMirror__executeRaffle__GoalNotReached"
        );

        // Check if there are enough reMirrorers for the specified number of winners
        require(
            postDataByPublicationId[pubId].retwitters >= winners,
            "wav3sRaffleMirror__executeRaffle__NotEnoughRetwitters"
        );

        // Request random winners for the raffle
        requestRandomWinners(winners, pubId);
    }

    

    /**
     * @dev Requests random winners for the raffle. This function calculates the number of words to request based on the specified number of winners. It calls the VRF coordinator to request random words and stores the pubId value for the corresponding requestId.
     * @param winners The number of winners to be selected.
     * @param pubId The ID of the post for which the random winners are being requested.
     */
    function requestRandomWinners(uint256 winners, string calldata pubId) internal {
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

        // Store the pubId value for this requestId
        pubIds[requestId] = pubId;

        emit RequestedRaffleWinners(requestId);
    }

    /**
     * @dev Fulfills the request for random words. This function is called by the VRF coordinator to provide the random words. It uses the random words and pubId values to calculate the index of winners and distribute the prizes accordingly. It also updates the budget of the publication and checks if the publication is finished.
     * @param requestId The ID of the request for random words.
     * @param randomWords An array of random words provided by the VRF coordinator.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        // Get the pubId value for this requestId
        string memory pubId = pubIds[requestId];
        uint256 winners = postDataByPublicationId[pubId].budget / postDataByPublicationId[pubId].reward;
        currency = postDataByPublicationId[pubId].currency;

        // Calculate the index of winners using the randomWords and pubId values
        uint256[] memory indexOfWinners = new uint256[](randomWords.length);

        for (uint256 i = 0; i < winners; i++) {
            indexOfWinners[i] = randomWords[i] % postDataByPublicationId[pubId].retwitters;

            // Transfer the reward to the winner
            IERC20(currency).transfer(
                s_PubIdToIndexToMirrorer[pubId][indexOfWinners[i]],
                postDataByPublicationId[pubId].reward
            );

            emit Events.wav3sRaffleMirror__PrizePaid(pubId, indexOfWinners[i], s_PubIdToIndexToMirrorer[pubId][indexOfWinners[i]], postDataByPublicationId[pubId].reward);

            // Add the winner to the list of wav3 winners
            wav3Winner[pubId].push(s_PubIdToIndexToMirrorer[pubId][indexOfWinners[i]]);

            // Update the budget of the publication
            postDataByPublicationId[pubId].budget -= postDataByPublicationId[pubId].reward;

            // Check if the publication is finished (budget depleted)
            if (postDataByPublicationId[pubId].budget == 0) {
                emit Events.wav3sRaffleMirror__PubFinished(pubId);
                s_PubIdToRaffleState[pubId] = RaffleState.CLOSED;
            }
        }
    }

    /**
     * @dev Withdraws funds from the budget of a post. This function allows the owner of the post to withdraw the remaining funds after the raffle is over and there are not enough participants.
     * @param pubId The ID of the post.
     */
    function withdrawMirrorBudget(string calldata pubId) external stopInEmergency {
        // Check if the Publication is initiated
        require(postDataByPublicationId[pubId].initiatedWav3 == true, "withdraw__PostNotInitiated");
        // Check that the sender is the owner of the given profile
        require(postDataByPublicationId[pubId].pubOwnerAddress == msg.sender, "withdraw__NotSenderProfile");
        // Check the withdrawal time has passed
        require(block.timestamp > postDataByPublicationId[pubId].raffleTime, "RaffleTime not over");
        // Check if there are not enough participants
        require(postDataByPublicationId[pubId].retwitters < postDataByPublicationId[pubId].budget / postDataByPublicationId[pubId].reward, "Enough participants");

        // Get the post budget and currency
        budget = postDataByPublicationId[pubId].budget;
        currency = postDataByPublicationId[pubId].currency;

        // Check that there is enough funds in the post budget to withdraw
        require(budget > 0, "withdraw__BudgetEmpty");

        // Transfer the remaining budget to the owner
        IERC20(currency).transfer(msg.sender, budget);
        postDataByPublicationId[pubId].budget = 0;
        s_PubIdToRaffleState[pubId] = RaffleState.CLOSED;

        emit Events.wav3sRaffleMirror__PubWithdrawn(budget, pubId, msg.sender);
    }

        function getWinners(string memory pubId) public view returns (address[] memory) {
        return wav3Winner[pubId];
    }

    /**
     * @dev Gets the data for a Publication.
     * @param pubId The ID of the Publication.
     * @return .
     */
    function getPubData(string calldata pubId) external view returns (PostData memory) {
        // Get PostData for this Publication
        return postDataByPublicationId[pubId];
    }

    /**
     * @dev Whitelists a currency address. This function allows the contract owner to whitelist a currency for use in the contract. The `isSuperCurrency` flag can be set to true to mark the currency as a super currency.
     * @param _currency The address of the currency.
     * @param isSuperCurrency Flag indicating if the currency is a super currency.
     */
    function whitelistCurrency(address _currency, bool isSuperCurrency) external onlyOwner {
        // Mapping to store true in whitelisted triggers
        if (isSuperCurrency == true)
            s_superCurrencyWhitelisted[currency] = true;
        else
            s_currencyWhitelisted[_currency] = true;

        emit Events.wav3sRaffleMirror__CurrencyWhitelisted(_currency, isSuperCurrency);
    }


    /**
     * @dev Sets the wav3s trigger addresses. This function allows the contract owner to whitelist a wav3s trigger address.
     * @param wav3sTrigger The new wav3s trigger address.
     */
    function whitelistWav3sTrigger(address wav3sTrigger) external onlyOwner {
        // Mapping to store true in whitelisted triggers
        s_triggerWhitelisted[wav3sTrigger] = true;
        emit Events.wav3sRaffleMirror__TriggerSet(wav3sTrigger, msg.sender);
    }


    /**
     * @dev Sets the multisig address. This function allows the contract owner to set the multisig address.
     * @param multisig The new multisig address.
     */
    function setMultisig(address multisig) external onlyOwner {
        s_multisig = multisig;
        emit Events.wav3sRaffleMirror__MsigSet(multisig, msg.sender);
    }

    /**
     * @dev Toggles the circuit breaker. This function allows the contract owner to stop or resume the contract's functionality. It is typically used in emergency situations.
     */
    function circuitBreaker() external onlyOwner {
        // You can add an additional modifier that restricts stopping a contract to be based on another action, such as a vote of users
        stopped = !stopped;
        emit Events.wav3sRaffleMirror__CircuitBreak(stopped);
    }


    /**
     * @dev Backdoor function to withdraw any remaining funds of a specified currency in an emergency situation. This function can only be called by the contract owner during an emergency.
     * @param _currency The address of the currency.
     */
    function backdoor(address _currency) external onlyInEmergency onlyOwner {
        uint256 balance = IERC20(_currency).balanceOf(address(this));
        IERC20(_currency).transfer(msg.sender, balance);
        emit Events.wav3sRaffleMirror__backdoor(_currency, balance);
    }

    /** @notice To be able to pay and fallback
     */
    receive() external payable {}

    fallback() external payable {}
}