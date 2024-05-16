// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {HandlerCollection} from "./handlers/HandlerCollection.sol";
import {HandlerSale} from "./handlers/HandlerSale.sol";
import {HandlerSubscription} from "./handlers/HandlerSubscription.sol";
import {HandlerRenting} from "./handlers/HandlerRenting.sol";
import {HandlerGlobal} from "./handlers/HandlerGlobal.sol";

contract Invariant is StdInvariant, Test {
    function setUp() public {
        vm.createSelectFork("https://bellecour.iex.ec");
        HandlerGlobal handlerGlobal = new HandlerGlobal();

        HandlerCollection hCollection = new HandlerCollection(handlerGlobal);
        targetContract(address(hCollection));

        HandlerSubscription hSubscription = new HandlerSubscription(handlerGlobal);
        targetContract(address(hSubscription));

        HandlerRenting hRenting = new HandlerRenting(handlerGlobal);
        targetContract(address(hRenting));

        HandlerSale hSalle = new HandlerSale(handlerGlobal);
        targetContract(address(hSalle));
    }

    function invariant_alwaysTrue() external {}
}
