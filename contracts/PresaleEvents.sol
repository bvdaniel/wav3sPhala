// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

library PresaleEvents {
    // Events
    event zurfSeed__NewInvestment(
        address investor,
        uint256 capital,
        uint256 allocation,
        address seller
    );

    event zurfSeed__RoundFinished();
    
     event zurfSeed__DropExecuted(
        uint256 allocation
    );

}