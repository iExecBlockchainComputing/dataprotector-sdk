// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Vm} from "forge-std/Vm.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {DataProtectorSharing, ISale} from "../../contracts/DataProtectorSharing.sol";
import {AddOnlyAppWhitelistRegistry, IAddOnlyAppWhitelist} from "../../contracts/registry/AddOnlyAppWhitelistRegistry.sol";
import {IExecPocoDelegate} from "../../contracts/interfaces/IExecPocoDelegate.sol";
import {IDataProtector} from "../../contracts/interfaces/IDataProtector.sol";
import {IRegistry} from "../../contracts/interfaces/IRegistry.sol";

contract RandomInvariant is StdInvariant, Test {
    function setUp() public {
        vm.createSelectFork("https://bellecour.iex.ec");

        Harness h = new Harness();
        // vm.enableCheats(address(h));
        targetContract(address(h));
        // targetContract(address(h._dataProtectorSharing()));
    }

    function invariant_alwaysTrue() external {}
}

contract Harness {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    Vm private _vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private uniqueId;

    // ---------------------State Variables------------------------------------
    IExecPocoDelegate private constant POCO_DELEGATE = IExecPocoDelegate(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry private constant POCO_PROTECTED_DATA_REGISTRY = IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);
    IDataProtector private constant DATA_PROTECTOR_CORE = IDataProtector(0x3a4Ab33F3D605e75b6D00A32A0Fa55C3628F6A59);

    // ---------------------Contract Instance------------------------------------
    DataProtectorSharing private _dataProtectorSharing;
    AddOnlyAppWhitelistRegistry private _addOnlyAppWhitelistRegistry;

    // ---------------------Ghost storage------------------------------------
    EnumerableSet.AddressSet private protectedDatas;
    EnumerableSet.UintSet private collections;
    EnumerableSet.AddressSet private protectedDatasInCollection;
    EnumerableSet.AddressSet private protectedDatasAvailableForSale;

    constructor() {
        address admin = address(54321);
        _vm.label(admin, "admin");
        _vm.label(address(POCO_DELEGATE), "pocoDelegate");
        _vm.label(address(POCO_PROTECTED_DATA_REGISTRY), "protectedDataRegistry");

        AddOnlyAppWhitelistRegistry appWhitelistImpl = new AddOnlyAppWhitelistRegistry();
        _addOnlyAppWhitelistRegistry = AddOnlyAppWhitelistRegistry(Clones.clone(address(appWhitelistImpl)));
        _vm.label(address(_addOnlyAppWhitelistRegistry), "appWhitelistRegistry");
        _addOnlyAppWhitelistRegistry.initialize();

        DataProtectorSharing dataProtectorSharingImpl = new DataProtectorSharing(
            POCO_DELEGATE,
            POCO_PROTECTED_DATA_REGISTRY,
            _addOnlyAppWhitelistRegistry
        );

        _dataProtectorSharing = DataProtectorSharing(Clones.clone(address(dataProtectorSharingImpl)));
        _vm.label(address(_dataProtectorSharing), "dataProtectorSharing");

        _vm.prank(admin);
        _dataProtectorSharing.initialize();
    }

    function createProtectedData(uint256 userNo) public {
        address protectedDataOwner = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)

        _vm.startPrank(protectedDataOwner);
        address _protectedData = DATA_PROTECTOR_CORE.createDatasetWithSchema(
            protectedDataOwner,
            "ProtectedData Invariant Test",
            "",
            "",
            bytes32(uniqueId++)
        );

        protectedDatas.add(_protectedData);
    }

    function createCollection(uint256 userNo) public {
        // create collection
        address collectionOwner = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)
        uint256 collectionTokenId = _dataProtectorSharing.createCollection(collectionOwner);

        // add to UintSet
        collections.add(collectionTokenId);
    }

    function addProtectedDataToCollection(uint256 protectedDataIdx, uint256 collectionIdx) public {
        uint256 lengthP = protectedDatas.length();
        uint256 lengthC = collections.length();

        if (lengthP == 0 || lengthC == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % lengthP; // tokenIdx = random 0 ... length - 1
        address _protectedData = protectedDatas.at(protectedDataIdx);
        address _protectedDataOwner = POCO_PROTECTED_DATA_REGISTRY.ownerOf(uint256(uint160(_protectedData)));

        collectionIdx = protectedDataIdx % lengthC; // tokenIdx = random 0 ... length - 1
        uint256 collectionTokenId = collections.at(collectionIdx);
        address _collectionOwner = IERC721(address(_dataProtectorSharing)).ownerOf(collectionTokenId);

        if (_collectionOwner != _protectedDataOwner) {
            return;
        }

        _vm.startPrank(_collectionOwner);
        POCO_PROTECTED_DATA_REGISTRY.approve(address(_dataProtectorSharing), uint256(uint160(_protectedData)));
        // create AppWhitelist
        IAddOnlyAppWhitelist _appWhitelist = _addOnlyAppWhitelistRegistry.createAddOnlyAppWhitelist(_collectionOwner);
        _dataProtectorSharing.addProtectedDataToCollection(collectionTokenId, _protectedData, _appWhitelist);

        // we created "collectionTokenId" for "from"
        protectedDatasInCollection.add(_protectedData);
        protectedDatas.remove(_protectedData);
    }

    function setProtectedDataForSale(uint256 protectedDataIdx, uint72 amount) public {
        amount = amount % (1 gwei);

        uint256 length = protectedDatasInCollection.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasInCollection.at(protectedDataIdx);

        (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        _vm.startPrank(from);
        _dataProtectorSharing.setProtectedDataForSale(protectedData, amount);

        protectedDatasAvailableForSale.add(protectedData);
    }

    function buyProtectedData(uint256 protectedDataIdx, uint256 userNo, uint256 userNo2) public {
        address buyer = address(uint160(userNo % 5) + 1);
        address beneficiary = address(uint160(userNo2 % 5) + 1);
        uint256 length = protectedDatasAvailableForSale.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasAvailableForSale.at(protectedDataIdx);
        (, , , , , ISale.SellingParams memory sellingParams) = _dataProtectorSharing.protectedDataDetails(
            protectedData
        );

        _vm.startPrank(buyer);
        _vm.deal(buyer, sellingParams.price * (1 gwei));

        POCO_DELEGATE.approve(address(_dataProtectorSharing), sellingParams.price);
        POCO_DELEGATE.deposit{value: sellingParams.price * 1e9}();
        _dataProtectorSharing.buyProtectedData(protectedData, beneficiary, sellingParams.price);
        protectedDatasAvailableForSale.remove(protectedData);
        protectedDatasInCollection.remove(protectedData);
        protectedDatas.add(protectedData);

        (, , , , , sellingParams) = _dataProtectorSharing.protectedDataDetails(protectedData);
        assert(!sellingParams.isForSale);
    }
}
