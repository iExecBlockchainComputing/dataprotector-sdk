pragma solidity ^0.8.24;

import "forge-std/StdInvariant.sol";
import "forge-std/Test.sol";
import "forge-std/interfaces/IERC721.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {DataProtectorSharing} from "../../contracts/DataProtectorSharing.sol";
import {AppWhitelistRegistry} from "../../contracts/registry/AppWhitelistRegistry.sol";
import {IExecPocoDelegate} from "../../contracts/interfaces/IExecPocoDelegate.sol";
import {IDataProtector} from "../../contracts/interfaces/IDataProtector.sol";
import {IAppWhitelist} from "../../contracts/interfaces/IAppWhitelist.sol";
import {IRegistry} from "../../contracts/interfaces/IRegistry.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract RandomInvariant is StdInvariant, Test {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    // ---------------------State Variables------------------------------------
    IExecPocoDelegate constant _pocoDelegate =
        IExecPocoDelegate(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry constant _protectedDataRegistry =
        IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);
    IDataProtector constant _dataProtector =
        IDataProtector(0x3a4Ab33F3D605e75b6D00A32A0Fa55C3628F6A59);

    // ---------------------Contract Instance------------------------------------
    DataProtectorSharing _dataProtectorSharing;
    AppWhitelistRegistry _appWhitelistRegistry;

    // ---------------------Ghost storage------------------------------------
    // EnumerableSet.UintSet collectionTokens;
    EnumerableSet.AddressSet protectedDatas;
    mapping(address pd => uint coll) protDataToCollection;

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

        targetContract(address(this));
    }

    function addProtectedDataToCollection(uint userNo) public {
        address from = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)

        // create AppWhitelist
        IAppWhitelist _appWhitelist = _appWhitelistRegistry.createAppWhitelist(from);
        address _protectedData = _dataProtector.createDatasetWithSchema(
            from,
            "ProtectedData Invariant Test",
            "",
            "",
            bytes32(0)
        );

        uint256 collectionTokenId = _dataProtectorSharing.createCollection(from);
        vm.startPrank(from);
        _protectedDataRegistry.approve(
            address(_dataProtectorSharing),
            uint256(uint160(_protectedData))
        );
        _dataProtectorSharing.addProtectedDataToCollection(
            collectionTokenId,
            _protectedData,
            _appWhitelist
        );

        // we created "collectionTokenId" for "from"
        protectedDatas.add(_protectedData);
        protDataToCollection[_protectedData] = collectionTokenId;
    }

    function setProtectedDataForSale(uint protDataIdx, uint amount) public {
        amount = amount % (100_000 gwei);

        uint length = protectedDatas.length();

        if (length == 0) {
            return;
        }

        protDataIdx = protDataIdx % length; // tokenIdx = random 0 ... length - 1
        address dpToken = protectedDatas.at(protDataIdx);

        address from = IERC721(address(_dataProtectorSharing)).ownerOf(
            protDataToCollection[dpToken]
        );

        vm.prank(from);
        _dataProtectorSharing.setProtectedDataForSale(dpToken, uint112(amount));
        assert(false);
    }

    function estFuzz_Withdraw(uint256 amount) external {
        payable(address(_dataProtectorSharing)).transfer(amount);
        uint256 preBalance = address(this).balance;
        _dataProtectorSharing.withdraw();
        uint256 postBalance = address(this).balance;
        assertEq(preBalance + amount, postBalance);
    }

    function invariant_alwaysTrue() external {}
}
