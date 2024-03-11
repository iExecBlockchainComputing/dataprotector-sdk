//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {DataProtectorSharing} from "../../contracts/DataProtectorSharing.sol";
import {AppWhitelistRegistry} from "../../contracts/registry/AppWhitelistRegistry.sol";
import {IExecPocoDelegate} from "../../contracts/interfaces/IExecPocoDelegate.sol";
import {IRegistry} from "../../contracts/interfaces/IRegistry.sol";

contract DataProtectorSharingTest is Test {
    // ---------------------State Variables------------------------------------
    // ---------------------State Variables------------------------------------
    IExecPocoDelegate constant _pocoDelegate = IExecPocoDelegate(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry constant _protectedDataRegistry =  IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);
    IRegistry constant _appRegistry = IRegistry(0xB1C52075b276f87b1834919167312221d50c9D16);

    // ---------------------Contract Instance------------------------------------
    DataProtectorSharing _dataProtectorSharing;
    AppWhitelistRegistry _appWhitelistRegistry;

    // Needed so the test contract itself can receive ether
    // when withdrawing
    receive() external payable {}

    function setUp() public {
        address _wallet = vm.createWallet("bob's wallet").addr;

        _appWhitelistRegistry = new AppWhitelistRegistry(_appRegistry);
        _dataProtectorSharing = new DataProtectorSharing(
            _pocoDelegate,
            _appRegistry,
            _protectedDataRegistry,
            _appWhitelistRegistry
        );
        _dataProtectorSharing.initialize(_wallet);
        _appWhitelistRegistry.initialize(_dataProtectorSharing);
    }

    function testFuzz_Withdraw(uint256 amount) public {
        payable(address(_dataProtectorSharing)).transfer(amount);
        uint256 preBalance = address(this).balance;
        _dataProtectorSharing.withdraw();
        uint256 postBalance = address(this).balance;
        assertEq(preBalance + amount, postBalance);
    }
}
