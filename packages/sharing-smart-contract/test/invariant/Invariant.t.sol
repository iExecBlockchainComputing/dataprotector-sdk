// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {HandlerSale} from "./handlers/HandlerSale.sol";
import {HandlerSubscription} from "./handlers/HandlerSubscription.sol";
import {HandlerRenting} from "./handlers/HandlerRenting.sol";

contract Invariant is StdInvariant, Test {
    function setUp() public {
        vm.createSelectFork("https://bellecour.iex.ec");
        HandlerSubscription hSubscription = new HandlerSubscription();
        targetContract(address(hSubscription));

        vm.createSelectFork("https://bellecour.iex.ec");
        HandlerRenting hRenting = new HandlerRenting();
        targetContract(address(hRenting));

        vm.createSelectFork("https://bellecour.iex.ec");
        HandlerSale hSalle = new HandlerSale();
        targetContract(address(hSalle));
        // vm.enableCheats(address(h));
        // targetContract(address(h._dataProtectorSharing()));
    }

    function invariant_alwaysTrue() external {}
}
