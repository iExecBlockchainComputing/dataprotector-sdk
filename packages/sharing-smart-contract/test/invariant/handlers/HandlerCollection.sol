// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IAddOnlyAppWhitelist} from "../../../contracts/registry/AddOnlyAppWhitelistRegistry.sol";
import {HandlerGlobal} from "./HandlerGlobal.sol";

contract HandlerCollection is Test, HandlerGlobal {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 internal uniqueId;

    // ---------------------Ghost storage------------------------------------
    EnumerableSet.AddressSet internal protectedDatas;
    EnumerableSet.UintSet internal collections;
    EnumerableSet.AddressSet internal protectedDatasInCollection;

    function createProtectedData(uint256 userNo) public {
        address protectedDataOwner = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)

        vm.startPrank(protectedDataOwner);
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

    function removeCollection(uint256 collectionIdx) public {
        uint256 length = collections.length();

        if (length == 0) {
            return;
        }

        collectionIdx = collectionIdx % length; // tokenIdx = random 0 ... length - 1
        uint256 collection = collections.at(collectionIdx);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.burn(collection);

        // add to UintSet
        collections.remove(collection);
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

        vm.startPrank(_collectionOwner);
        POCO_PROTECTED_DATA_REGISTRY.approve(address(_dataProtectorSharing), uint256(uint160(_protectedData)));
        // create AppWhitelist
        IAddOnlyAppWhitelist _appWhitelist = _addOnlyAppWhitelistRegistry.createAddOnlyAppWhitelist(_collectionOwner);
        _dataProtectorSharing.addProtectedDataToCollection(collectionTokenId, _protectedData, _appWhitelist);

        // we created "collectionTokenId" for "from"
        protectedDatasInCollection.add(_protectedData);
        protectedDatas.remove(_protectedData);
    }

    function removeProtectedDataFromCollection(uint256 protectedDataIdx) public {
        uint256 length = protectedDatasInCollection.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasInCollection.at(protectedDataIdx);

        (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.removeProtectedDataFromCollection(protectedData);

        protectedDatasInCollection.remove(protectedData);
    }
}
