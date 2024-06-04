// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IApp} from "./IApp.sol";

interface IAppRegistry {
    function createApp(
        address _appOwner,
        string calldata _appName,
        string calldata _appType,
        bytes calldata _appMultiaddr,
        bytes32 _appChecksum,
        bytes calldata _appMREnclave
    ) external returns (IApp);
}
