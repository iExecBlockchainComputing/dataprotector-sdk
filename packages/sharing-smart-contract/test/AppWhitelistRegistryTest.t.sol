pragma solidity ^0.8.24;

import "forge-std/StdInvariant.sol";
import "forge-std/Test.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {DataProtectorSharing} from "../contracts/DataProtectorSharing.sol";
import {ISubscription} from "../contracts/interfaces/ISubscription.sol";
import {AppWhitelistRegistry} from "../contracts/registry/AppWhitelistRegistry.sol";
import {IExecPocoDelegate} from "../contracts/interfaces/IExecPocoDelegate.sol";
import {IDataProtector} from "../contracts/interfaces/IDataProtector.sol";
import {IAppWhitelist} from "../contracts/interfaces/IAppWhitelist.sol";
import {IRegistry} from "../contracts/interfaces/IRegistry.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract AppWhitelistRegistryTest is Test {
    // ---------------------State Variables------------------------------------
    IExecPocoDelegate constant _pocoDelegate =
        IExecPocoDelegate(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry constant _protectedDataRegistry =
        IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);
    IDataProtector constant _dataProtector =
        IDataProtector(0x3a4Ab33F3D605e75b6D00A32A0Fa55C3628F6A59);

    uint uniqueId;
    // ---------------------Contract Instance------------------------------------
    AppWhitelistRegistry _appWhitelistRegistry;

    constructor() {
        vm.createSelectFork("https://bellecour.iex.ec", 27400811);

        address admin = address(54321);
        vm.label(admin, "admin");
        vm.label(address(_dataProtector), "dataProtectorCore");
        vm.label(address(_pocoDelegate), "pocoDelegate");
        vm.label(address(_protectedDataRegistry), "protectedDataRegistry");

        AppWhitelistRegistry appWhitelistImpl = new AppWhitelistRegistry();
        _appWhitelistRegistry = AppWhitelistRegistry(Clones.clone(address(appWhitelistImpl)));
        vm.label(address(_appWhitelistRegistry), "appWhitelistRegistry");
        _appWhitelistRegistry.initialize();
    }

    function testTransfer() external {
        address appWhitelistOwner = vm.addr(1);
        address newAppWhitelistOwner = vm.addr(2);
        vm.label(appWhitelistOwner, "appWhitelistOwner");
        vm.startPrank(appWhitelistOwner);

        IAppWhitelist _appWhitelist = _appWhitelistRegistry.createAppWhitelist(appWhitelistOwner);
        vm.label(address(_appWhitelist), "appWhitelist");

        // _appWhitelistRegistry.approve(
        //     address(_appWhitelistRegistry),
        //     uint256(uint160(address(_appWhitelist)))
        // );
        _appWhitelist.approve(
            address(_appWhitelistRegistry),
            uint256(uint160(address(_appWhitelist)))
        );
        _appWhitelistRegistry.safeTransferFrom(
            appWhitelistOwner,
            newAppWhitelistOwner,
            uint256(uint160(address(_appWhitelist))),
            ""
        );
    }
}
