
## Quickstart

1. Clone and install dependencies

After installing all the requirements, run the following:

```bash
git clone git@github.com:zurf-social/Zurf-DeFi.git
```
Then:
```
npm install
```
Launch Foundry:
```
foundryup
```


The recommendation is to use npm 7 or later. If you are using an older version of npm, you'll also need to install all the packages used by the toolbox.
```
npm install --save-dev @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-network-helpers @nomicfoundation/hardhat-chai-matchers @nomiclabs/hardhat-ethers @nomiclabs/hardhat-etherscan chai ethers hardhat-gas-reporter solidity-coverage @typechain/hardhat typechain @typechain/ethers-v5 @ethersproject/abi @ethersproject/providers
```

That's also the case if you are using yarn.
```
yarn add --dev @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-network-helpers @nomicfoundation/hardhat-chai-matchers @nomiclabs/hardhat-ethers @nomiclabs/hardhat-etherscan chai ethers hardhat-gas-reporter solidity-coverage @typechain/hardhat typechain @typechain/ethers-v5 @ethersproject/abi @ethersproject/providers
```

2. You can now do stuff!

```
forge test
```
or

```
forge compile
```

## Deploying Contracts

To deploy functions helper contract.
```
./deployFunctions.sh
```
Add Functions contract in the deployMain script
```
./deployMain.sh
```

Deploy to Polygon network. Set your .env variables.

3. Running commands

To deploy contracts:

```
./deployMain.sh
```

To verify a contract if it couldn't verify in the first attempt:

```
./force-verify.sh
```



# Test
Tests are located in the [test](./test/) directory.

To run tests:

```
forge test
```

To isolate a singular test

```
forge test  --match-test <testFunctionName>
```

To add vervosity

```
forge test -vvvvv
```

## VRF Get a random number
The VRFConsumer contract has two tasks, one to request a random number, and one to read the result of the random number request. 
As explained in the [developer documentation](https://docs.chain.link/vrf/v2/introduction), there are two methods:
- The [Subscription method](https://docs.chain.link/vrf/v2/subscription)
- The [Direct Funding method](https://docs.chain.link/vrf/v2/direct-funding)

Read the docs first to understand which method is the most suitable for your use case.

### VRF Subscription method
To start, go to [VRF Subscription Page](https://vrf.chain.link/sepolia) and create the new subscription. Save your subscription ID and put it in `helper-hardhat-config.js` file as `subscriptionId`:

```javascript
5: {
    // rest of the config
    subscriptionId: "777"
}
```

## Functions

### wav3s

#### fundAction()

function fundAction(
        uint256[] memory _budget, 
        uint256[] memory _reward, 
        uint256[] memory _raffleDuration, 
        uint256[] memory _variable, 
        address _currency,
        address consumerApp
    ) external stopInEmergency payable returns (uint256[10] memory)

| Parameter Name  | Type      | Description                                                                                       |
| --------------- | --------- | ------------------------------------------------------------------------------------------------- |
| budget          | uint256[] | An array of budgets for actions.                                                                  |
| reward          | uint256[] | An array of rewards for each action funded.                                                       |
| raffleDuration  | uint256[] | An array of raffle durations, if it's zero, then it's not a raffle.                               |
| variable        | uint256[] | An array of variables to filter zurfers. Example, minimum followers.                              |
| currency        | address   | The address of the currency for the publication.                                                  |
| consumerApp     | address   | The address of the frontend app implementing wav3s.                                               |

This allows users to reward other users who engaged with the post through an action.

The fundAction function initializes an Action with a budget, reward, raffleDuration if it's a raffle (else a zero), and a variable that works as an arbitrary filter, like minimum followers, or character count. For each succesfull Action funded a "wav3s__ActionFunded" event is emitted with the following outputs:

wav3s__ActionFunded(
                sender (address),
                budget (uint),
                reward (uint),
                nextActionId (uint)
            );
            
The function also returns and array of 10 slots, where the first will be filled by the ActionId number according to the ammount of actions funded. The address "currency" must be a whitelisted one through "whitelistCurrency()" function, "consumerApp" address must have set it's own fee calling the "setAppFee()" function.

#### setAppFee()

function setAppFee(
      uint256 appFee
    ) external;
| Parameter Name | Type | Description |
| --------------- | ------- | ---------------------------------------------------- |
| appFee | uint256 | The fee for the consumer app, for 5%, input "5". |

The function takes the msg.sender and attributes it a fee in percentage of the total budget of the fundAction. Each app should call this function to set it's fee and later use it when calling fundAction from your frontend, with your consumerApp address as an input.

#### withdrawAppFees()

function withdrawAppFees(
      address _currency
    ) public;

| Parameter Name | Type   | Description                      |
| -------------- | ------ | -------------------------------- |
| _currency          | address | The ERC20 currency fees that the app wants to withdraw. |

Transfers the selected currency fees of the app stored in the wav3s contract to the app address.


