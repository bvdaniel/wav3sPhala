#!/bin/bash
export $(cat .env | xargs)

forge create --rpc-url https://polygon-mainnet.g.alchemy.com/v2/3FBkWF2fDhkZkZLp9-2YTgRFRf8NSRc5 \
    --constructor-args 0xae975071be8f8ee67addbc1a82488f1c24858067 764 0xd729dc84e21ae57ffb6be0053bf2b0668aa2aaf300a2a7b2ddf7dc0bb6e875a8 2500000 0xa7aeec348c4ad05617768ccd6f47d0d7dec9d5f1 0x032F747C837A664005d54A57f65e135ca2Bda236 \
    --private-key "$PRIVATE_KEY" \
    --etherscan-api-key "$POLYGONSCAN_API_KEY" \
    --verify \
    contracts/wav3s.sol:wav3s  --legacy
