// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {DataProtectorSharing} from "../../../contracts/DataProtectorSharing.sol";
import {AddOnlyAppWhitelistRegistry} from "../../../contracts/registry/AddOnlyAppWhitelistRegistry.sol";
import {IExecPocoDelegate} from "../../../contracts/interfaces/IExecPocoDelegate.sol";
import {IDataProtector} from "../../../contracts/interfaces/IDataProtector.sol";
import {IRegistry} from "../../../contracts/interfaces/IRegistry.sol";

contract HandlerGlobal is Test {
    // ---------------------State Variables------------------------------------
    IExecPocoDelegate internal constant POCO_DELEGATE = IExecPocoDelegate(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry internal constant POCO_PROTECTED_DATA_REGISTRY = IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);
    IDataProtector internal constant DATA_PROTECTOR_CORE = IDataProtector(0x3a4Ab33F3D605e75b6D00A32A0Fa55C3628F6A59);

    // ---------------------Contract Instance------------------------------------
    DataProtectorSharing internal _dataProtectorSharing;
    AddOnlyAppWhitelistRegistry internal _addOnlyAppWhitelistRegistry;

    constructor() {
        address admin = address(54321);
        vm.label(admin, "admin");
        vm.label(address(POCO_DELEGATE), "pocoDelegate");
        vm.label(address(POCO_PROTECTED_DATA_REGISTRY), "protectedDataRegistry");

        AddOnlyAppWhitelistRegistry appWhitelistImpl = new AddOnlyAppWhitelistRegistry();
        _addOnlyAppWhitelistRegistry = AddOnlyAppWhitelistRegistry(Clones.clone(address(appWhitelistImpl)));
        vm.label(address(_addOnlyAppWhitelistRegistry), "appWhitelistRegistry");
        _addOnlyAppWhitelistRegistry.initialize();

        DataProtectorSharing dataProtectorSharingImpl = new DataProtectorSharing(
            POCO_DELEGATE,
            POCO_PROTECTED_DATA_REGISTRY,
            _addOnlyAppWhitelistRegistry
        );

        _dataProtectorSharing = DataProtectorSharing(Clones.clone(address(dataProtectorSharingImpl)));
        vm.label(address(_dataProtectorSharing), "dataProtectorSharing");

        vm.prank(admin);
        _dataProtectorSharing.initialize();
    }
}
