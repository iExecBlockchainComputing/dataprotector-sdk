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
}
