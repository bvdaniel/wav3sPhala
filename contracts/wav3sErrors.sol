// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

library Errors {
    // Errors
    event wav3s__process__ArrayLengthMismatch(string error);
    event wav3s__process__PostNotInitiated(uint256 index, string error);
    event wav3s__process__ZurferAlreadyActed();
    event wav3s__process__NeedMoreFollowers(uint256 index, string error);
    event wav3s__process__RewardHigherThanbudget(uint256 index, string error);
    event wav3s__process__InvalidUserAddress(uint256 index, address user);
    event wav3s__process__InvalidAppAddress(uint256 index, string error);
    event wav3s__process__InvalidPubId(uint256 index, string error);
    event wav3s__process__AppAddressNotWhitelisted(uint256 index, string error);
    event wav3s__process__InvalidpubOwnerAddress(uint256 index, string error);
    //
}