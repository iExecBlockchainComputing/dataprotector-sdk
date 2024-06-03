// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {HandlerCollection} from "./handlers/HandlerCollection.sol";
import {HandlerSale} from "./handlers/HandlerSale.sol";
import {HandlerSubscription} from "./handlers/HandlerSubscription.sol";
import {HandlerRenting} from "./handlers/HandlerRenting.sol";
import {HandlerGlobal} from "./handlers/HandlerGlobal.sol";
import {IAppRegistry, IApp} from "./interfaces/IAppRegistry.sol";
import {IWorkerpoolRegistry, IWorkerpool} from "./interfaces/IWorkerpoolRegistry.sol";
import {IexecLibOrders_v5} from "../../contracts/libs/IexecLibOrders_v5.sol";

contract Invariant is StdInvariant, Test {
    HandlerGlobal handlerGlobal;
    bytes32 internal constant TAG = 0x0000000000000000000000000000000000000000000000000000000000000003; // [tee,scone]
    uint256 internal constant TRUST = 0; // No replication
    uint256 private _salt;

    function setUp() public {
        vm.createSelectFork("https://bellecour.iex.ec");
        handlerGlobal = new HandlerGlobal();

        HandlerCollection hCollection = new HandlerCollection(handlerGlobal);
        targetContract(address(hCollection));

        HandlerSubscription hSubscription = new HandlerSubscription(handlerGlobal);
        targetContract(address(hSubscription));

        HandlerRenting hRenting = new HandlerRenting(handlerGlobal);
        targetContract(address(hRenting));

        HandlerSale hSalle = new HandlerSale(handlerGlobal);
        targetContract(address(hSalle));
    }

    // Test the consume work dor all protectedDataInCollection
    function invariant_alwaysTrue() external {
        uint256 userNo = (uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 5) + 1;
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();
        address consumer = address(uint160(userNo % 5) + 1);

        // create a fake App
        IAppRegistry appRegistry = IAppRegistry(0xB1C52075b276f87b1834919167312221d50c9D16);
        IApp app = appRegistry.createApp(
            address(handlerGlobal.dataProtectorSharing()),
            "App Test",
            "App Type",
            new bytes(0),
            bytes32(0),
            new bytes(0)
        );

        //create a fake workerpool & workerpoolOrder
        IWorkerpoolRegistry workerpoolRegistry = IWorkerpoolRegistry(0xC76A18c78B7e530A165c5683CB1aB134E21938B4);
        IWorkerpool workerpool = workerpoolRegistry.createWorkerpool(address(this), "Workerpool Test");
        IexecLibOrders_v5.WorkerpoolOrderOperation memory workerpoolOrderOperation = IexecLibOrders_v5
            .WorkerpoolOrderOperation({
                order: IexecLibOrders_v5.WorkerpoolOrder({
                    workerpool: address(workerpool),
                    workerpoolprice: 0,
                    volume: type(uint256).max,
                    tag: TAG,
                    category: 0,
                    trust: TRUST,
                    apprestrict: address(0),
                    datasetrestrict: address(0),
                    requesterrestrict: address(0),
                    salt: bytes32(++_salt),
                    sign: new bytes(0)
                }),
                operation: IexecLibOrders_v5.OrderOperationEnum.SIGN, //OrderOperationEnum
                sign: new bytes(0)
            });
        handlerGlobal.POCO_DELEGATE().manageWorkerpoolOrder(workerpoolOrderOperation);

        for (uint256 protectedDataIdx = 0; protectedDataIdx < length; protectedDataIdx++) {
            address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);
            (uint256 collection, , , bool inSubscription, , ) = handlerGlobal
                .dataProtectorSharing()
                .protectedDataDetails(protectedData);
            uint48 renterEndDate = handlerGlobal.dataProtectorSharing().getProtectedDataRenter(protectedData, consumer);
            uint48 subscriberEndDate = handlerGlobal.dataProtectorSharing().getCollectionSubscriber(
                collection,
                consumer
            );

            if (
                renterEndDate >= block.timestamp ||
                (collection != 0 && inSubscription && subscriberEndDate >= block.timestamp)
            ) {
                handlerGlobal.dataProtectorSharing().consumeProtectedData(
                    protectedData,
                    workerpoolOrderOperation.order,
                    address(app)
                );
            }
        }
    }
}
