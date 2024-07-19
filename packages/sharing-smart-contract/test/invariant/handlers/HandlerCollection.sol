// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {DataProtectorSharing, ICollection, ISubscription} from "../../../contracts/DataProtectorSharing.sol";
import {IAddOnlyAppWhitelist} from "../../../contracts/registry/AddOnlyAppWhitelistRegistry.sol";
import {HandlerGlobal} from "./HandlerGlobal.sol";

contract HandlerCollection is Test {
    // ---------------------State Variables------------------------------------
    uint256 internal uniqueId;

    // ---------------------Global variables------------------------------------
    HandlerGlobal private handlerGlobal;
    DataProtectorSharing private dataProtectorSharing;

    constructor(HandlerGlobal _handlerGlobal) {
        handlerGlobal = _handlerGlobal;
        dataProtectorSharing = _handlerGlobal.dataProtectorSharing();
    }

    function createProtectedData(uint256 userNo) public {
        address protectedDataOwner = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)

        vm.startPrank(protectedDataOwner);
        address _protectedData = handlerGlobal.DATA_PROTECTOR_CORE().createDatasetWithSchema(
            protectedDataOwner,
            "ProtectedData Invariant Test",
            "",
            "",
            bytes32(uniqueId++)
        );

        handlerGlobal.protectedDatasAdd(_protectedData);
    }

    function createCollection(uint256 userNo) public {
        // create collection
        address collectionOwner = address(uint160(userNo % 5) + 1); // random user from address(1) to address(5)
        vm.startPrank(collectionOwner);
        uint256 collectionTokenId = dataProtectorSharing.createCollection(collectionOwner);

        // add to UintSet
        handlerGlobal.collectionsAdd(collectionTokenId);
    }

    function removeCollection(uint256 collectionIdx) public {
        uint256 length = handlerGlobal.collectionsLength();

        if (length == 0) {
            return;
        }

        collectionIdx = collectionIdx % length; // tokenIdx = random 0 ... length - 1
        uint256 collection = handlerGlobal.collectionsAt(collectionIdx);
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);

        (uint256 size, uint48 lastSubscriptionExpiration, ) = dataProtectorSharing.collectionDetails(collection);

        if (size > 0) {
            vm.startPrank(from); // After calling expectRevert, calls to other cheatcodes before the reverting call are ignored.
            vm.expectRevert(abi.encodeWithSelector(ICollection.CollectionNotEmpty.selector, collection));
            dataProtectorSharing.burn(collection);
        } else if (lastSubscriptionExpiration > block.timestamp) {
            vm.startPrank(from); // After calling expectRevert, calls to other cheatcodes before the reverting call are ignored.
            vm.expectRevert(abi.encodeWithSelector(ISubscription.OnGoingCollectionSubscriptions.selector, collection));
            dataProtectorSharing.burn(collection);
        } else {
            vm.startPrank(from);
            dataProtectorSharing.burn(collection);
        }

        // add to UintSet
        handlerGlobal.collectionsRemove(collection);
    }

    function addProtectedDataToCollection(uint256 protectedDataIdx, uint256 collectionIdx) public {
        uint256 lengthP = handlerGlobal.protectedDatasLength();
        uint256 lengthC = handlerGlobal.collectionsLength();

        if (lengthP == 0 || lengthC == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % lengthP; // tokenIdx = random 0 ... length - 1
        address _protectedData = handlerGlobal.protectedDatasAt(protectedDataIdx);
        address _protectedDataOwner = handlerGlobal.POCO_PROTECTED_DATA_REGISTRY().ownerOf(
            uint256(uint160(_protectedData))
        );

        collectionIdx = protectedDataIdx % lengthC; // tokenIdx = random 0 ... length - 1
        uint256 collectionTokenId = handlerGlobal.collectionsAt(collectionIdx);
        address _collectionOwner = IERC721(address(dataProtectorSharing)).ownerOf(collectionTokenId);

        if (_collectionOwner != _protectedDataOwner) {
            return;
        }

        vm.startPrank(_collectionOwner);
        handlerGlobal.POCO_PROTECTED_DATA_REGISTRY().approve(
            address(dataProtectorSharing),
            uint256(uint160(_protectedData))
        );
        // create AppWhitelist
        IAddOnlyAppWhitelist _appWhitelist = handlerGlobal.addOnlyAppWhitelistRegistry().createAddOnlyAppWhitelist(
            _collectionOwner
        );
        dataProtectorSharing.addProtectedDataToCollection(collectionTokenId, _protectedData, _appWhitelist);

        // we created "collectionTokenId" for "from"
        handlerGlobal.protectedDatasInCollectionAdd(_protectedData);
    }

    function removeProtectedDataFromCollection(uint256 protectedDataIdx) public {
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);

        (uint256 collection, , uint48 lastRentalExpiration, , , ) = dataProtectorSharing.protectedDataDetails(
            protectedData
        );
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);

        (, uint48 lastSubscriptionExpiration, ) = dataProtectorSharing.collectionDetails(collection);

        if (lastSubscriptionExpiration >= block.timestamp || lastRentalExpiration >= block.timestamp) {
            return;
        }

        vm.startPrank(from);
        dataProtectorSharing.removeProtectedDataFromCollection(protectedData);

        handlerGlobal.protectedDatasInCollectionRemove(protectedData);
    }
}
