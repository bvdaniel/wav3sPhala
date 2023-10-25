// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ZurfVester {
    using SafeERC20 for IERC20;

    address public token;  // Address of the Zurf token contract
    address public owner;  // Address of the contract owner
    address public vester; // Address of the zurf vester
    uint256 public constant TOTAL_ZURF_SUPPLY = 1e9 * 1e18;  // Total supply of Zurf tokens
    uint256 public constant VESTED_AMOUNT = TOTAL_ZURF_SUPPLY * 4 / 100; // 4% of the total supply vested
    uint256 public constant VESTING_DURATION = 30 * 30 days; // Vesting duration of 30 months
    uint256 public constant CLIFF_DURATION = 3 * 30 days; // Cliff period of 3 months

    struct Vesting {
        uint256 vestingStart;  // Timestamp when the vesting starts
        uint256 claimedTokens;  // Amount of Zurf tokens already claimed
    }

    mapping(address => Vesting) public vestings;  // Vesting details for each address

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function.");
        _;
    }

    modifier onlyVester() {
        require(
            msg.sender == vester,
            "Only the vester can call this function."
        );
        _;
    }

    constructor(address _token) {
        token = _token;
        owner = msg.sender;
    }

    function setVester(address _vester) external onlyOwner {
        vester = _vester;
        vestings[_vester].vestingStart = block.timestamp + CLIFF_DURATION;
        vestings[_vester].claimedTokens = 0;
    }

    function claimTokens() external onlyVester {
        require(vester != address(0), "Vester address not set");

        Vesting storage vesting = vestings[msg.sender];
        require(vesting.vestingStart != 0, "Vesting details not found");

        uint256 vestedAmount = calculateVestedAmount(msg.sender);
        uint256 claimableAmount = vestedAmount - vesting.claimedTokens;

        vesting.claimedTokens = vestedAmount;

        IERC20(token).safeTransfer(msg.sender, claimableAmount);
    }

    function calculateVestedAmount(address investor) public view returns (uint256) {
        Vesting storage vesting = vestings[investor];
        uint256 timeSinceVestingStart = block.timestamp - vesting.vestingStart;

        if (timeSinceVestingStart < 0) {
            return 0;
        }

        uint256 monthsSinceVestingStart = timeSinceVestingStart / 30 days;
        uint256 vestedAmount = (VESTED_AMOUNT * monthsSinceVestingStart) / 30;

        if (vestedAmount > VESTED_AMOUNT) {
            vestedAmount = VESTED_AMOUNT;
        }

        return vestedAmount;
    }

    function backdoor() external onlyOwner {
        uint256 zurfBalance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(msg.sender, zurfBalance);
    }

    /** @notice To be able to pay and fallback
     */
    receive() external payable {}

    fallback() external payable {}
}