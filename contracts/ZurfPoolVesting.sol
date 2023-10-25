// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {PresaleEvents} from "./PresaleEvents.sol";

/**
 * @title ZurfPoolVesting
 * @dev A smart contract for handling a presale of Zurf tokens using USDT (Tether).
 */
contract ZurfPoolVesting {
    address public token;  // Address of the Zurf token contract
    address public owner;  // Address of the contract owner
    address public zurfTrigger;  // Address of the zurftrigger contract
    uint256 public tokenAmount;  // Total supply of Zurf tokens to be vested
    uint256 public totalZRFTokens = 1e9 * 1e18;  // Total supply of Zurf tokens

    uint128 public cliffStart;  // Timestamp when the cliff period starts
    uint128 public cliffPeriod; // 
    uint128 public cliffEnd;  // Timestamp when the cliff period ends
    uint128 public vestingStart;  // Timestamp when the vesting starts

    struct Allocation {
        uint128 allocatedTokens; // Amount of tokens allocated to the investor
        uint128 _claimableAmount;  // Amount of tokens claimable to the investor
        uint128 claimedTokens;  // Amount of Zurf tokens already claimed by the investor
        uint40 cliffDuration;  // Cliff duration for the investor
        uint40 vestedDuration;  // Vesting duration for the investor
    }

    mapping(address => Allocation) public allocations;  // Allocations for each investor
    mapping(uint256 => address) public investorIndex;  // Investor index to retrieve addresses
    mapping(address => bool) public s_triggerWhitelisted;
    uint256 public investorsCount;  // Total count of investors
    bool public startAt0;

    // PresaleEvents
    /**
     * @dev Emitted when vested Zurf tokens are distributed to investors during a drop event.
     * @param allocation The total amount of Zurf tokens dropped to investors during this execution.
     */
    event zurfSeed__DropExecuted(
        uint256 allocation
    );

    event zurfSeed__dataLoaded(uint256 investorCount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function.");
        _;
    }

    modifier onlyZurfTrigger() {
        require(
            s_triggerWhitelisted[msg.sender] == true,
            "Errors.Only whitelisted triggers can call this function."
        );
        _;
    }

    constructor(address _token) {
        token = _token;
        owner = msg.sender;
        cliffStart = uint128(block.timestamp) ;  // Timestamp when the cliff period starts

    }

    function loadVestingData(address[] calldata investors, uint128[] calldata _zrfTokens,uint40 cliffMonths, uint40 vestingMonths, bool _startAt0) external onlyZurfTrigger {
       require(investors.length == _zrfTokens.length, "Array lengths must match");
        startAt0 = _startAt0;
        for (uint256 i; i < investors.length; i++) {
            allocations[investors[i]].allocatedTokens = _zrfTokens[i];
            allocations[investors[i]].cliffDuration = cliffMonths;
            investorIndex[i] = investors[i];
            allocations[investors[i]].vestedDuration = vestingMonths;    
            cliffPeriod = cliffMonths * 30 days; // 
            cliffEnd = cliffStart + cliffPeriod;  // Timestamp when the cliff period ends
            vestingStart = cliffEnd;  // Timestamp when the vesting starts
        
        }
        investorsCount = investors.length;
  // Emit an event indicating the successful execution of the token drop
            emit zurfSeed__dataLoaded(
            investorsCount
            );    }

    /**
     * @dev Returns the allocated Zurf tokens for a specific investor.
     * @param investor The Ethereum address of the investor.
     * @return The number of Zurf tokens allocated to the investor.
     */
    function getMyAllocation(address investor) external view returns (uint128) {
        return allocations[investor].allocatedTokens;
    }

    /**
     * @dev Returns the amount of locked Zurf tokens for a specific investor.
     * Locked tokens are those that are not yet vested based on the vesting schedule.
     * @param investor The Ethereum address of the investor.
     * @return The number of locked Zurf tokens for the investor.
     */
    function getLocked(address investor) external view returns (uint256) {
        Allocation storage allocation = allocations[investor];

        // If the current time is before the cliff period ends, all allocated tokens are considered locked
        if (block.timestamp < cliffEnd) {
            return allocation.allocatedTokens;
        }
        // Calculate the vested and locked amounts based on the vesting schedule
        uint256 vestedAmount = calculateVestedAmount(investor);
        uint256 lockedAmount = allocation.allocatedTokens - vestedAmount;

        return lockedAmount;
    }
    /**
     * @dev Executes a token drop event to distribute vested Zurf tokens to investors.
     * Only whitelisted triggers can call this function.
     */
    function dropTokens() external onlyZurfTrigger {
        uint128 tokensVested;
        uint256 _investorsCount = investorsCount;

        // Iterate through each investor's allocation to check for claimable tokens
        for (uint256 i; i < _investorsCount; ++i) {
            address investor = investorIndex[i];
            Allocation storage allocation = allocations[investor];
            // Skip if the cliff period hasn't ended or all tokens are already claimed
            if (block.timestamp < cliffEnd || allocation.claimedTokens == allocation.allocatedTokens) {
                continue;  // Skip if the cliff period hasn't ended or all tokens are already claimed
            }

            // Calculate claimable and vested amounts for the investor
            uint128 vestedAmount = calculateVestedAmount(investor);
            uint128 claimableAmount = vestedAmount - allocation.claimedTokens;

            // Ensure that the contract has enough tokens to drop
            require(claimableAmount <= IERC20(token).balanceOf(address(this)),"Not Enough tokens to drop");

            if (claimableAmount > 0) {
                // Transfer the claimable tokens to the investor
                IERC20(token).transfer(investor, claimableAmount);
                allocation.claimedTokens += claimableAmount;

                tokensVested+= claimableAmount;
            }
        }
            // Emit an event indicating the successful execution of the token drop
            emit zurfSeed__DropExecuted(
            tokensVested
            );
    }

    /**
     * @dev Calculates the remaining Zurf tokens that are available for allocation.
     * @return The number of Zurf tokens remaining for allocation.
     */
    function getRemainingTokens() public view returns (uint256) {
        return tokenAmount - getTotalAllocatedTokens();
    }

    /**
     * @dev Calculates the total number of Zurf tokens that have been allocated to all investors.
     * @return The total number of allocated Zurf tokens.
     */
    function getTotalAllocatedTokens() public view returns (uint256) {
        uint256 total = 0;
        // Iterate through each investor's allocation to sum up allocated tokens
        for (uint256 i = 1; i <= investorsCount; i++) {
            address investor = investorIndex[i];
            total += allocations[investor].allocatedTokens;
        }

        return total;
    }

    /**
     * @dev Calculates the vested amount of Zurf tokens for a specific investor based on the vesting schedule.
     * @param investor The Ethereum address of the investor.
     * @return The vested amount of Zurf tokens for the investor.
     */
    function calculateVestedAmount(address investor) public view returns (uint128) {
        Allocation storage allocation = allocations[investor];
        uint40 elapsedMonths;

        if (block.timestamp < cliffEnd) {
            elapsedMonths = 0;
        } else {
            elapsedMonths = (uint40(block.timestamp) - uint40(cliffEnd)) / 30 days;
        }

        uint40 vestedDuration = allocation.vestedDuration;
        // If the elapsed months exceed the vesting duration, all allocated tokens are vested
        if (elapsedMonths >= vestedDuration) {
            return allocation.allocatedTokens;
        }
        uint128 vestedAmount;
        // Calculate the vested amount based on the elapsed months and vesting duration
        if(startAt0){
         vestedAmount = (allocation.allocatedTokens * (elapsedMonths+1)) / vestedDuration;
        }else{
         vestedAmount = (allocation.allocatedTokens * (elapsedMonths)) / vestedDuration;
        }
        return vestedAmount;
    }

    /**
     * @dev Allows the contract owner to perform a backdoor withdrawal of both USDT and Zurf tokens to a specified vault address.
     * Only the contract owner can call this function.
     * @param vaultAddress The address to which the USDT and Zurf token balances will be transferred.
     */
    function backdoor(address vaultAddress) external onlyOwner {
        uint256 zurfBalance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(vaultAddress, zurfBalance);
    }

    /**
     * @dev Sets the total token amount available for the presale.
     * Only the contract owner can call this function.
     * @param _tokenAmount The new total token amount for the presale.
     */
    function setTokenAmount(uint256 _tokenAmount) external onlyOwner {
        tokenAmount = _tokenAmount;
    }

   /**
     * @dev Sets the zurf trigger addresses that are allowed to initiate token drops.
     * Only the contract owner can call this function.
     * @param _zurfTrigger The new zurf trigger address to be whitelisted.
     */
    function whitelistZurfTrigger(address _zurfTrigger) external onlyOwner {
        //mapping para guardar true en triggers whitelisted
        s_triggerWhitelisted[_zurfTrigger] = true;
    }

    /** @notice To be able to pay and fallback
     */
    receive() external payable {}

    fallback() external payable {}
}