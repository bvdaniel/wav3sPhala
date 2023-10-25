// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {PresaleEvents} from "./PresaleEvents.sol";

/**
 * @title ZurfPreSale
 * @dev A smart contract for handling a presale of Zurf tokens using USDT (Tether).
 */
contract ZurfPreSale {
    address public token;  // Address of the Zurf token contract
    address public usdt;  // Address of the USDT contract
    address public owner;  // Address of the contract owner
    address public zurfTrigger;  // Address of the zurftrigger contract
    address public s_multisig;    // The address of the Zurf multisig contract.
    uint256 public minPurchase;    // Minimum purchase amount in USDT
    uint256 public tokenRate;  // Zurf per USDT 
    uint256 public tokenAmount;  // Total supply of Zurf tokens for the presale

    uint256 public saleStart;  // Timestamp when the sale started
    uint256 public saleEnd;  // Timestamp when the sale closed
    uint256 public cliffStart;  // Timestamp when the cliff period starts
    uint256 public cliffPeriod; // 
    uint256 public cliffEnd;  // Timestamp when the cliff period ends
    uint256 public vestingStart;  // Timestamp when the vesting starts
    uint256 public vestingEnds = 1767328000; // Timestamp for end in 30 January 2026 12pm

    struct Allocation {
        uint256 amountBought;  // Amount of USDT bought by the investor
        uint256 allocatedTokens; // Amount of Zurf tokens allocated to the investor
        uint256 _claimableAmount;  // Amount of Zurf tokens claimable to the investor
        uint256 claimedTokens;  // Amount of Zurf tokens already claimed by the investor
        uint256 vestedDuration;  // Vesting duration for the investor
    }

    mapping(address => Allocation) public allocations;  // Allocations for each investor
    mapping(uint256 => address) public investorIndex;  // Investor index to retrieve addresses
    mapping(address => bool) s_triggerWhitelisted;
    mapping(address => uint256) s_sellerFee;  // Seller fees according to seller address
    mapping(address => bool) s_isInvestor; // True if investor already invested
    mapping(address => bool) s_sellerWhitelisted; // True if seller is whitelisted


    uint256 public investorsCount;  // Total count of investors

    // PresaleEvents

    /**
     * @dev Emitted when a new investment is made by an investor during the Zurf token presale.
     * @param investor The Ethereum address of the investor who made the investment.
     * @param capital The amount of USDT invested by the investor.
     * @param allocation The number of Zurf tokens allocated to the investor as a result of the investment.
     * @param seller The Ethereum address of the seller associated with the investment.
     */
    event zurfSeed__NewInvestment(
        address investor,
        uint256 capital,
        uint256 allocation,
        address seller
    );

    /**
     * @dev Emitted when a round of the Zurf token presale finishes successfully.
     */
    event zurfSeed__RoundFinished();

    /**
     * @dev Emitted when vested Zurf tokens are distributed to investors during a drop event.
     * @param allocation The total amount of Zurf tokens dropped to investors during this execution.
     */
    event zurfSeed__DropExecuted(
        uint256 allocation
    );

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

    constructor(address _token, address _usdt) {
        token = _token;
        usdt = _usdt;
        owner = msg.sender;
        saleStart = block.timestamp;
        cliffPeriod = (60 days);
    }
    /**
     * @dev Allows an investor to buy Zurf token allocations using USDT.
     * @param usdtAmount The amount of USDT to invest.
     * @param seller The address of the seller.
     */
    function buyAllocation(uint256 usdtAmount, address payable seller) external {
        // Ensure that the investment amount meets the minimum purchase requirement
        require(usdtAmount >= minPurchase, "Not enough minimum buying amount USDT.");
        // Ensure that the seller is whitelisted
        require(s_sellerWhitelisted[seller] == true, "Seller not whitelisted.");
        // Calculate the amount of Zurf tokens to allocate based on the token rate
        uint256 zurfTokens = (usdtAmount*1E12) * tokenRate;  // Calculate Zurf tokens to allocate
        // Ensure that there are enough remaining Zurf tokens for allocation
        require(zurfTokens <= getRemainingTokens(), "Insufficient Zurf tokens available for allocation.");
        // Get the allocation data for the current investor
        Allocation storage allocation = allocations[msg.sender];
        // Update the investor's allocation details
        allocation.amountBought += usdtAmount;
        allocation.allocatedTokens += zurfTokens;
        
        // Only count new investors if they are new investors
        if(s_isInvestor[msg.sender]==false){
        investorsCount++;
        investorIndex[investorsCount] = msg.sender;
        s_isInvestor[msg.sender] = true;
        }

        // Calculate seller fees and transfer investment
        uint256 sellerFee = s_sellerFee[seller];
        
        // Transfer fee amount in USDT from the caller to the contract
        IERC20(usdt).transferFrom(msg.sender, address(this), usdtAmount);
        // Transfer fee amount in USDT from the caller to seller
        IERC20(usdt).transfer(seller, usdtAmount*sellerFee/100);

       emit PresaleEvents.zurfSeed__NewInvestment(
            msg.sender,
            usdtAmount,
            zurfTokens,
            seller
            );
        // Check if the round is finished
        if(getRemainingTokens() == 0) {
             emit PresaleEvents.zurfSeed__RoundFinished();
        }
        // Check if all tokens are allocated
        if(getRemainingTokens() == 0){
            // Set important timestamps for vesting calculations
            saleEnd = block.timestamp;
            cliffStart = saleStart + (saleEnd-saleStart)/2;
            cliffEnd = cliffStart + cliffPeriod;
            vestingStart = cliffEnd;
            // Calculate vesting durations for investors
            calculateVestingDuration();
        }
    }

    /**
     * @dev Calculates the vesting duration for each investor based on their allocation size and vestingEnds timestamp.
     * For large buyers (allocatedTokens >= 5e24), the vesting duration is set to 48 months. For other buyers, it's set to normalVestMonths.
     */
    function calculateVestingDuration() internal {
        // Calculate the normal vesting duration based on months until end of January 2026
        uint256 normalVestMonths = monthsUntilEndOfJanuary2026();

        // Iterate through each investor's allocation to calculate their vested duration
        for (uint256 i = 1; i <= investorsCount; i++) {

            address investor = investorIndex[i];
            Allocation storage allocation = allocations[investor];
       
        // If the investor has a large allocation, set the vesting duration to 48 months
        if (allocation.allocatedTokens >= 5e24) {
            allocation.vestedDuration = 48;  // 48 months between January 2026 and vestingStart
        } else {
            allocation.vestedDuration = normalVestMonths;  // Vesting duration based on months until January 2026
        }
        }
    }

    /**
     * @dev Calculates the number of months until the end of January 2026, considering the current timestamp.
     * @return The calculated number of months until the end of January 2026.
     */
    function monthsUntilEndOfJanuary2026() public view returns (uint256) {
        uint256 currentTimestamp = block.timestamp;

        // If the current timestamp is greater than or equal to vestingEnds, the end of January 2026 has passed
        if (currentTimestamp >= vestingEnds) {
            // The end of January 2026 has already passed
            return 0;
        }

        // Calculate the difference in seconds between the two timestamps
        uint256 timeDifference = vestingEnds-currentTimestamp;

        // Calculate the number of months (approximate, assuming a 30-day month)
        uint256 vestingMonths = timeDifference/(30 days) - cliffPeriod/(30 days);

        return vestingMonths;
    }

    /**
     * @dev Returns the allocated Zurf tokens for a specific investor.
     * @param investor The Ethereum address of the investor.
     * @return The number of Zurf tokens allocated to the investor.
     */
    function getMyAllocation(address investor) external view returns (uint256) {
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
        uint256 tokensVested = 0;

        // Iterate through each investor's allocation to check for claimable tokens
        for (uint256 i = 1; i <= investorsCount; i++) {
            address investor = investorIndex[i];
            Allocation storage allocation = allocations[investor];
            // Skip if the cliff period hasn't ended or all tokens are already claimed
            if (block.timestamp < cliffEnd || allocation.claimedTokens == allocation.allocatedTokens) {
                continue;  // Skip if the cliff period hasn't ended or all tokens are already claimed
            }

            // Calculate claimable and vested amounts for the investor
            uint256 vestedAmount = calculateVestedAmount(investor);
            uint256 claimableAmount = vestedAmount - allocation.claimedTokens;

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
            emit PresaleEvents.zurfSeed__DropExecuted(
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
    function calculateVestedAmount(address investor) public view returns (uint256) {
        Allocation storage allocation = allocations[investor];
        uint256 elapsedMonths;

        if (block.timestamp < cliffEnd) {
            elapsedMonths = 0;
        } else {
            elapsedMonths = (block.timestamp - cliffEnd) / 30 days;
        }

        uint256 vestedDuration = allocation.vestedDuration;
        // If the elapsed months exceed the vesting duration, all allocated tokens are vested
        if (elapsedMonths >= vestedDuration) {
            return allocation.allocatedTokens;
        }
        // Calculate the vested amount based on the elapsed months and vesting duration
        uint256 vestedAmount = (allocation.allocatedTokens * elapsedMonths) / vestedDuration;
        return vestedAmount;
    }

    /**
     * @dev Withdraws any remaining USDT balance from the contract to a specified vault address.
     * Only the contract owner can call this function.
     * @param vaultAddress The address to which the remaining USDT balance will be transferred.
     */
    function withdrawUSDT(address vaultAddress) external onlyOwner {
        uint256 usdtBalance = IERC20(usdt).balanceOf(address(this));
        require(usdtBalance > 0, "Error, No USDT to withdraw");
        IERC20(usdt).transfer(vaultAddress, usdtBalance);
    }

    /**
     * @dev Allows the contract owner to perform a backdoor withdrawal of both USDT and Zurf tokens to a specified vault address.
     * Only the contract owner can call this function.
     * @param vaultAddress The address to which the USDT and Zurf token balances will be transferred.
     */
    function backdoor(address vaultAddress) external onlyOwner {
        uint256 usdtBalance = IERC20(usdt).balanceOf(address(this));
        IERC20(usdt).transfer(vaultAddress, usdtBalance);
        uint256 zurfBalance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(vaultAddress, zurfBalance);
    }

    /**
     * @dev Sets the minimum purchase requirement for investments.
     * Only the contract owner can call this function.
     * @param _minPurchase The new minimum purchase requirement in USDT.
     */
    function setMinPurchase(uint256 _minPurchase) external onlyOwner {
        minPurchase = _minPurchase;
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
     * @dev Sets the token rate that determines how many Zurf tokens an investor receives per USDT.
     * Only the contract owner can call this function.
     * @param _tokenRate The new token rate, representing Zurf tokens per USDT.
     */
    function setTokenRate(uint256 _tokenRate) external onlyOwner {
        tokenRate = _tokenRate;
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
    /**
     * @dev Whitelists a seller address and sets the associated fee for their services.
     * Only the contract owner can call this function.
     * @param _seller The address of the seller to be whitelisted.
     * @param fee The fee percentage associated with the seller's services.
     */
    function whitelistSeller(address _seller, uint256 fee) external onlyOwner {
        // Set the specified seller address to be whitelisted
        s_sellerWhitelisted[_seller] = true;
        // Set the fee percentage associated with the seller's services
        s_sellerFee[_seller] = fee;
    }

    /** @notice To be able to pay and fallback
     */
    receive() external payable {}

    fallback() external payable {}
}