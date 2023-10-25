#!/bin/bash
export $(cat .env | xargs)

forge create --rpc-url https://polygon-mainnet.g.alchemy.com/v2/3FBkWF2fDhkZkZLp9-2YTgRFRf8NSRc5 \
    --constructor-args 0x0e9e628d715003ff5045fc92002c67ddab364683 \
    --private-key $PRIVATE_KEY \
    --etherscan-api-key $POLYGONSCAN_API_KEY \
    --verify \
    contracts/wav3sFunctions.sol:wav3sFunctions  --legacy

