// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";


contract wav3sScript is Script {
    address wav3s = 0x6504BC5048b0fe41bE59C02BeBA2A60698400545;
    address multisig = 0xAc6C6aD61EA3d8fea0912d7b5ce9104cc89F8692;
    address consumerApp = 0xF0962980a2E83F80a1c3450dE7545D0059dD6ccB;
    address normalCurrency = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270; // WMATIC
    address USDTCurrency = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F; // USDT
    address superCurrency = 0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683; // SAND
    uint256 protocolFee = 5;
    uint256 consumerAppFee = 5;
    uint256 baseFee = 1000000000000000000;
    address triggerAddress1 = 0x092E67E9dbc47101760143f95056569CB0b3324f;
    address triggerAddress2 = 0xD9D68C71dE6FB90a062c237438200614F1FB8339;

    function setUp() public {
        // You can perform any additional setup tasks if needed
        vm.startBroadcast();

    }

    function run() public {
        // Call the setMultisig function on the wav3s contract
        bytes memory data = abi.encodeWithSignature("setMultisig(address)", multisig);

     
    }
}
