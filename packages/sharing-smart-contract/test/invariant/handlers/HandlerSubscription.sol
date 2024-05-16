// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {HandlerGlobal} from "./HandlerGlobal.sol";
import {ISubscription} from "../../../contracts/interfaces/ISubscription.sol";
import {DataProtectorSharing} from "../../../contracts/DataProtectorSharing.sol";

contract HandlerSubscription is Test {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    // ---------------------Global variables------------------------------------
    HandlerGlobal private handlerGlobal;
    DataProtectorSharing private dataProtectorSharing;

    constructor(HandlerGlobal _handlerGlobal) {
        handlerGlobal = _handlerGlobal;
        dataProtectorSharing = _handlerGlobal.dataProtectorSharing();
    }

    function setSubscriptionParams(uint256 collectionIdx, uint72 price, uint48 duration) public {
        price = price % (1 gwei);
        uint256 length = handlerGlobal.collectionsLength();
        if (length == 0) {
            return;
        }
        collectionIdx = collectionIdx % length; // tokenIdx = random 0 ... length - 1
        uint256 collection = handlerGlobal.collectionsAt(collectionIdx);
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);
        vm.startPrank(from);
        dataProtectorSharing.setSubscriptionParams(collection, ISubscription.SubscriptionParams(price, duration));
    }

    function setProtectedDataToSubscription(uint256 protectedDataIdx) public {
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();
        if (length == 0) {
            return;
        }
        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);
        (uint256 collection, , , , , ) = dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);
        vm.startPrank(from);
        dataProtectorSharing.setProtectedDataToSubscription(protectedData);
        handlerGlobal.protectedDatasAvailableForSubscriptionAdd(protectedData);
    }

    function removeProtectedDataFromSubscription(uint256 protectedDataIdx) public {
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();
        if (length == 0) {
            return;
        }
        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);
        (uint256 collection, , , , , ) = dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);
        vm.startPrank(from);
        dataProtectorSharing.removeProtectedDataFromSubscription(protectedData);
        handlerGlobal.protectedDatasAvailableForSubscriptionRemove(protectedData);
    }

    function subscribeToCollection(uint256 collectionIdx, uint256 userNo) public {
        address subscriber = address(uint160(userNo % 5) + 1);
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();
        if (length == 0) {
            return;
        }
        collectionIdx = collectionIdx % length; // tokenIdx = random 0 ... length - 1
        uint256 collection = handlerGlobal.collectionsAt(collectionIdx);
        (, , ISubscription.SubscriptionParams memory subscriptionParams) = dataProtectorSharing.collectionDetails(
            collection
        );
        vm.startPrank(subscriber);
        vm.deal(subscriber, subscriptionParams.price * (1 gwei));
        handlerGlobal.POCO_DELEGATE().approve(address(dataProtectorSharing), subscriptionParams.price);
        handlerGlobal.POCO_DELEGATE().deposit{value: subscriptionParams.price * 1e9}();
        dataProtectorSharing.subscribeToCollection(collection, subscriptionParams);
    }
}
