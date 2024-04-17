// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {HandlerCollection} from "./HandlerCollection.sol";
import {ISubscription} from "../../../contracts/interfaces/ISubscription.sol";

contract HandlerSubscription is Test, HandlerCollection {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    // ---------------------Ghost storage------------------------------------
    EnumerableSet.AddressSet private protectedDatasAvailableForSubscription;

    function setSubscriptionParams(uint256 collectionIdx, uint72 price, uint48 duration) public {
        price = price % (1 gwei);
        uint256 length = collections.length();

        if (length == 0) {
            return;
        }

        collectionIdx = collectionIdx % length; // tokenIdx = random 0 ... length - 1
        uint256 collection = collections.at(collectionIdx);

        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.setSubscriptionParams(collection, ISubscription.SubscriptionParams(price, duration));
    }

    function setProtectedDataToSubscription(uint256 protectedDataIdx) public {
        uint256 length = protectedDatasInCollection.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasInCollection.at(protectedDataIdx);

        (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.setProtectedDataToSubscription(protectedData);

        protectedDatasAvailableForSubscription.add(protectedData);
    }

    function removeProtectedDataFromSubscription(uint256 protectedDataIdx) public {
        uint256 length = protectedDatasInCollection.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasInCollection.at(protectedDataIdx);

        (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.removeProtectedDataFromSubscription(protectedData);

        protectedDatasAvailableForSubscription.remove(protectedData);
    }

    function subscribeToCollection(uint256 collectionIdx, uint256 userNo) public {
        address subscriber = address(uint160(userNo % 5) + 1);
        uint256 length = protectedDatasInCollection.length();

        if (length == 0) {
            return;
        }

        collectionIdx = collectionIdx % length; // tokenIdx = random 0 ... length - 1
        uint256 collection = collections.at(collectionIdx);

        (, , ISubscription.SubscriptionParams memory subscriptionParams) = _dataProtectorSharing.collectionDetails(
            collection
        );

        vm.startPrank(subscriber);
        vm.deal(subscriber, subscriptionParams.price * (1 gwei));

        POCO_DELEGATE.approve(address(_dataProtectorSharing), subscriptionParams.price);
        POCO_DELEGATE.deposit{value: subscriptionParams.price * 1e9}();
        _dataProtectorSharing.subscribeToCollection(collection, subscriptionParams);
    }
}
