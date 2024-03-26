pragma solidity ^0.8.24;

import "forge-std/StdInvariant.sol";
import "forge-std/Test.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {DataProtectorSharing} from "../../contracts/DataProtectorSharing.sol";
import {AppWhitelistRegistry} from "../../contracts/registry/AppWhitelistRegistry.sol";
import {IExecPocoDelegate} from "../../contracts/interfaces/IExecPocoDelegate.sol";
import {IRegistry} from "../../contracts/interfaces/IRegistry.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract RandomInvariant is StdInvariant, Test {
    // ---------------------State Variables------------------------------------
    IExecPocoDelegate constant _pocoDelegate =
        IExecPocoDelegate(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry constant _protectedDataRegistry =
        IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);

    // ---------------------Contract Instance------------------------------------
    DataProtectorSharing _dataProtectorSharing;
    AppWhitelistRegistry _appWhitelistRegistry;

    // Needed so the test contract itself can receive ether
    // when withdrawing
    receive() external payable {}

    function setUp() public {
        vm.createSelectFork("https://bellecour.iex.ec", 27375396);

        address admin = address(54321);
        vm.label(admin, "admin");
        vm.label(address(_pocoDelegate), "pocoDelegate");
        vm.label(address(_protectedDataRegistry), "protectedDataRegistry");

        AppWhitelistRegistry apwrImpl = new AppWhitelistRegistry();
        _appWhitelistRegistry = AppWhitelistRegistry(Clones.clone(address(apwrImpl)));
        vm.label(address(_appWhitelistRegistry), "appWhitelistRegistry");
        _appWhitelistRegistry.initialize();

        DataProtectorSharing dpsImpl = new DataProtectorSharing(
            _pocoDelegate,
            _protectedDataRegistry,
            _appWhitelistRegistry
        );

        _dataProtectorSharing = DataProtectorSharing(Clones.clone(address(dpsImpl)));
        vm.label(address(_dataProtectorSharing), "dataProtectorSharing");

        vm.prank(admin);
        _dataProtectorSharing.initialize();
    }

    function testVoid() public {}

    function estFuzz_Withdraw(uint256 amount) external {
        payable(address(_dataProtectorSharing)).transfer(amount);
        uint256 preBalance = address(this).balance;
        _dataProtectorSharing.withdraw();
        uint256 postBalance = address(this).balance;
        assertEq(preBalance + amount, postBalance);
    }

    function invariant_alwaysTrue() external {}
}
