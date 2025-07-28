// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {DataProtectorSharing} from "../../../contracts/DataProtectorSharing.sol";
import {AddOnlyAppWhitelistRegistry} from "../../../contracts/registry/AddOnlyAppWhitelistRegistry.sol";
import {IPoCo} from "../../../contracts/interfaces/IPoCo.sol";
import {IDataProtector} from "../../../contracts/interfaces/IDataProtector.sol";
import {IRegistry} from "../../../contracts/interfaces/IRegistry.sol";
import {GhostStorage} from "./GhostStorage.sol";

contract HandlerGlobal is Test, GhostStorage {
    // ---------------------State Variables------------------------------------
    // TODO remove hardcoded values to make tests compatible with any chain.
    IPoCo public constant POCO_DELEGATE = IPoCo(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry public constant POCO_PROTECTED_DATA_REGISTRY =
        IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);
    IDataProtector public constant DATA_PROTECTOR_CORE =
        IDataProtector(0x3a4Ab33F3D605e75b6D00A32A0Fa55C3628F6A59);

    // ---------------------Contract Instance------------------------------------
    DataProtectorSharing public dataProtectorSharing;
    AddOnlyAppWhitelistRegistry public addOnlyAppWhitelistRegistry;

    constructor() {
        address admin = makeAddr("admin");
        vm.label(admin, "admin");
        vm.label(address(POCO_DELEGATE), "pocoDelegate");
        vm.label(address(POCO_PROTECTED_DATA_REGISTRY), "protectedDataRegistry");

        AddOnlyAppWhitelistRegistry appWhitelistImpl = new AddOnlyAppWhitelistRegistry();
        addOnlyAppWhitelistRegistry = AddOnlyAppWhitelistRegistry(
            Clones.clone(address(appWhitelistImpl))
        );
        vm.label(address(addOnlyAppWhitelistRegistry), "appWhitelistRegistry");
        addOnlyAppWhitelistRegistry.initialize();

        DataProtectorSharing dataProtectorSharingImpl = new DataProtectorSharing(
            address(POCO_DELEGATE),
            POCO_PROTECTED_DATA_REGISTRY,
            addOnlyAppWhitelistRegistry
        );

        dataProtectorSharing = DataProtectorSharing(
            Clones.clone(address(dataProtectorSharingImpl))
        );
        vm.label(address(dataProtectorSharing), "dataProtectorSharing");
        dataProtectorSharing.initialize(admin);
    }
}
