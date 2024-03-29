pragma solidity ^0.8.24;

import "forge-std/StdInvariant.sol";
import "forge-std/Test.sol";
import "forge-std/interfaces/IERC721.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {DataProtectorSharing} from "../../contracts/DataProtectorSharing.sol";
import {AppWhitelistRegistry} from "../../contracts/registry/AppWhitelistRegistry.sol";
import {IExecPocoDelegate} from "../../contracts/interfaces/IExecPocoDelegate.sol";
import {IDataProtector} from "../../contracts/interfaces/IDataProtector.sol";
import {IAppWhitelist} from "../../contracts/interfaces/IAppWhitelist.sol";
import {IRegistry} from "../../contracts/interfaces/IRegistry.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../../contracts/interfaces/ISale.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract RandomInvariant is StdInvariant, Test {
    function setUp() public {
        vm.createSelectFork("https://bellecour.iex.ec", 27375396);

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

    Vm vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint uniqueId;

    // ---------------------State Variables------------------------------------
    IExecPocoDelegate constant _pocoDelegate =
        IExecPocoDelegate(0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f);
    IRegistry constant _protectedDataRegistry =
        IRegistry(0x799DAa22654128d0C64d5b79eac9283008158730);
    IDataProtector constant _dataProtector =
        IDataProtector(0x3a4Ab33F3D605e75b6D00A32A0Fa55C3628F6A59);

    // ---------------------Contract Instance------------------------------------
    DataProtectorSharing public _dataProtectorSharing;
    AppWhitelistRegistry _appWhitelistRegistry;

    // ---------------------Ghost storage------------------------------------
    EnumerableSet.AddressSet protectedDatas;
    EnumerableSet.UintSet collections;
    EnumerableSet.AddressSet protectedDatasInCollection;
    EnumerableSet.AddressSet protectedDatasAvailableForSale;

    // Needed so the test contract itself can receive ether
    // when withdrawing
    receive() external payable {}

    constructor() {
        address admin = address(54321);
        vm.label(admin, "admin");
        vm.label(address(_pocoDelegate), "pocoDelegate");
        vm.label(address(_protectedDataRegistry), "protectedDataRegistry");

        AppWhitelistRegistry appWhitelistImpl = new AppWhitelistRegistry();
        _appWhitelistRegistry = AppWhitelistRegistry(Clones.clone(address(appWhitelistImpl)));
        vm.label(address(_appWhitelistRegistry), "appWhitelistRegistry");
        _appWhitelistRegistry.initialize();

        DataProtectorSharing dataProtectorSharingImpl = new DataProtectorSharing(
            _pocoDelegate,
            _protectedDataRegistry,
            _appWhitelistRegistry
        );

        _dataProtectorSharing = DataProtectorSharing(
            Clones.clone(address(dataProtectorSharingImpl))
        );
        vm.label(address(_dataProtectorSharing), "dataProtectorSharing");

        vm.prank(admin);
        _dataProtectorSharing.initialize();
    }

    function createProtectedData(uint userNo) public {
        address protectedDataOwner = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)

        vm.startPrank(protectedDataOwner);
        address _protectedData = _dataProtector.createDatasetWithSchema(
            protectedDataOwner,
            "ProtectedData Invariant Test",
            "",
            "",
            bytes32(uniqueId++)
        );

        protectedDatas.add(_protectedData);
    }

    function createCollection(uint userNo) public {
        // create collection
        address collectionOwner = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)
        uint256 collectionTokenId = _dataProtectorSharing.createCollection(collectionOwner);

        // add to UintSet
        collections.add(collectionTokenId);
    }

    function addProtectedDataToCollection(uint protectedDataIdx, uint collectionIdx) public {
        uint lengthP = protectedDatas.length();
        uint lengthC = collections.length();

        if (lengthP == 0 || lengthC == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % lengthP; // tokenIdx = random 0 ... length - 1
        address _protectedData = protectedDatas.at(protectedDataIdx);
        address _protectedDataOwner = _protectedDataRegistry.ownerOf(
            uint256(uint160(_protectedData))
        );

        collectionIdx = protectedDataIdx % lengthC; // tokenIdx = random 0 ... length - 1
        uint256 collectionTokenId = collections.at(collectionIdx);
        address _collectionOwner = IERC721(address(_dataProtectorSharing)).ownerOf(
            collectionTokenId
        );

        if (_collectionOwner != _protectedDataOwner) {
            return;
        }

        vm.startPrank(_collectionOwner);
        _protectedDataRegistry.approve(
            address(_dataProtectorSharing),
            uint256(uint160(_protectedData))
        );
        // create AppWhitelist
        IAppWhitelist _appWhitelist = _appWhitelistRegistry.createAppWhitelist(_collectionOwner);
        _dataProtectorSharing.addProtectedDataToCollection(
            collectionTokenId,
            _protectedData,
            _appWhitelist
        );

        // we created "collectionTokenId" for "from"
        protectedDatasInCollection.add(_protectedData);
        protectedDatas.remove(_protectedData);
    }

    function setProtectedDataForSale(uint protectedDataIdx, uint amount) public {
        amount = amount % (100_000 gwei);

        uint length = protectedDatasInCollection.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address dpToken = protectedDatasInCollection.at(protectedDataIdx);

        (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(dpToken);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.setProtectedDataForSale(dpToken, uint112(amount));

        protectedDatasAvailableForSale.add(dpToken);
    }

    function buyProtectedData(uint protectedDataIdx, uint userNo, uint userNo2) public {
        address buyer = address(uint160(userNo % 5) + 1);
        address beneficiary = address(uint160(userNo2 % 5) + 1);
        uint length = protectedDatasAvailableForSale.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address dpToken = protectedDatasAvailableForSale.at(protectedDataIdx);
        (, , , , , ISale.SellingParams memory sellingParams) = _dataProtectorSharing
            .protectedDataDetails(dpToken);

        vm.startPrank(buyer);
        vm.deal(buyer, sellingParams.price);
        _dataProtectorSharing.buyProtectedData{value: sellingParams.price}(dpToken, beneficiary);
        protectedDatasAvailableForSale.remove(dpToken);
        protectedDatasInCollection.remove(dpToken);
        protectedDatas.add(dpToken);

        (, , , , , sellingParams) = _dataProtectorSharing.protectedDataDetails(dpToken);
        assert(!sellingParams.isForSale);
    }
}
