// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract GhostStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal protectedDatas;
    EnumerableSet.UintSet internal collections;
    EnumerableSet.AddressSet internal protectedDatasInCollection;
    EnumerableSet.AddressSet internal protectedDatasAvailableForRenting;
    EnumerableSet.AddressSet internal protectedDatasAvailableForSale;
    EnumerableSet.AddressSet internal protectedDatasAvailableForSubscription;

    // ProtectedDatas
    function protectedDatasLength() public view returns (uint256) {
        return protectedDatas.length();
    }

    function protectedDatasAt(uint256 index) public view returns (address) {
        return protectedDatas.at(index);
    }

    function protectedDatasAdd(address protectedData) public {
        protectedDatas.add(protectedData);
    }

    // Collections
    function collectionsLength() public view returns (uint256) {
        return collections.length();
    }

    function collectionsAt(uint256 index) public view returns (uint256) {
        return collections.at(index);
    }

    function collectionsAdd(uint256 collection) public {
        collections.add(collection);
    }

    function collectionsRemove(uint256 collection) public {
        collections.remove(collection);
    }

    // ProtectedDatasInCollection
    function protectedDatasInCollectionLength() public view returns (uint256) {
        return protectedDatasInCollection.length();
    }

    function protectedDatasInCollectionAt(uint256 index) public view returns (address) {
        return protectedDatasInCollection.at(index);
    }

    function protectedDatasInCollectionAdd(address protectedData) public {
        protectedDatasInCollection.add(protectedData);
    }

    function protectedDatasInCollectionRemove(address protectedData) public {
        protectedDatasInCollection.remove(protectedData);
    }

    // ProtectedDatasAvailableForSubscription
    function protectedDatasAvailableForSubscriptionLength() public view returns (uint256) {
        return protectedDatasAvailableForSubscription.length();
    }

    function protectedDatasAvailableForSubscriptionAt(uint256 index) public view returns (address) {
        return protectedDatasAvailableForSubscription.at(index);
    }

    function protectedDatasAvailableForSubscriptionAdd(address protectedData) public {
        protectedDatasAvailableForSubscription.add(protectedData);
    }

    function protectedDatasAvailableForSubscriptionRemove(address protectedData) public {
        protectedDatasAvailableForSubscription.remove(protectedData);
    }

    // ProtectedDatasAvailableForRenting
    function protectedDatasAvailableForRentingLength() public view returns (uint256) {
        return protectedDatasAvailableForRenting.length();
    }

    function protectedDatasAvailableForRentingAt(uint256 index) public view returns (address) {
        return protectedDatasAvailableForRenting.at(index);
    }

    function protectedDatasAvailableForRentingAdd(address protectedData) public {
        protectedDatasAvailableForRenting.add(protectedData);
    }

    function protectedDatasAvailableForRentingRemove(address protectedData) public {
        protectedDatasAvailableForRenting.remove(protectedData);
    }

    // ProtectedDatasAvailableForSale
    function protectedDatasAvailableForSaleLength() public view returns (uint256) {
        return protectedDatasAvailableForSale.length();
    }

    function protectedDatasAvailableForSaleAt(uint256 index) public view returns (address) {
        return protectedDatasAvailableForSale.at(index);
    }

    function protectedDatasAvailableForSaleAdd(address protectedData) public {
        protectedDatasAvailableForSale.add(protectedData);
    }

    function protectedDatasAvailableForSaleRemove(address protectedData) public {
        protectedDatasAvailableForSale.remove(protectedData);
    }
}
