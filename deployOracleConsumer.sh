#!/bin/bash
export $(cat .env | xargs)

forge create --rpc-url https://polygon-mainnet.g.alchemy.com/v2/3FBkWF2fDhkZkZLp9-2YTgRFRf8NSRc5 \
    --constructor-args 0xf1fd4bd39820f5c4b7005ab603363f6bc17a89e3 \
    --private-key $PRIVATE_KEY \
    --etherscan-api-key $POLYGONSCAN_API_KEY \
    --verify \
    contracts/OracleConsumerContract.sol:OracleConsumerContract  --legacy

