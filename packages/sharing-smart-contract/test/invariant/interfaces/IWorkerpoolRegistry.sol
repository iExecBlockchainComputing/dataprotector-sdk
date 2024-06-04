// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IWorkerpool} from "./IWorkerpool.sol";

interface IWorkerpoolRegistry {
    function createWorkerpool(
        address _workerpoolOwner,
        string calldata _workerpoolDescription
    ) external returns (IWorkerpool);
}
