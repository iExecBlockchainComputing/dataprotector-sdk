// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2020 IEXEC BLOCKCHAIN TECH                                       *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 ******************************************************************************/
pragma solidity ^0.8.23;

import "./interface/IExecPocoDelegate.sol";
import "./modules/Collection.sol";

abstract contract Store {
    /***************************************************************************
     *                       ManageOrders                                      *
     ***************************************************************************/
    IExecPocoDelegate internal immutable m_pocoDelegate;
    address internal appAddress;
    bytes32 internal constant TAG =
        0x0000000000000000000000000000000000000000000000000000000000000003; // [tee,scone]
    uint256 internal constant TRUST = 0; // No replication
    bytes internal nullSign; // TODO
    //TODO: should be specific for each Collection
    string internal iexec_result_storage_provider;
    string internal iexec_result_storage_proxy;
    string internal iexec_args;

    /***************************************************************************
     *                       Collection                                        *
     ***************************************************************************/
    Collection public m_collection;

    modifier onlyCollectionOwner(uint256 _collectionId) {
        require(msg.sender == m_collection.ownerOf(_collectionId), "Not the collection's owner");
        _;
    }

    modifier onlyProtectedDataInCollection(uint256 _collectionId, address _protectedData) {
        require(
            m_collection.protectedDatas(_collectionId, uint160(_protectedData)) != address(0),
            "ProtectedData is not in collection"
        );
        _;
    }
    /***************************************************************************
     *                       Subscription                                      *
     ***************************************************************************/
    // collectionId => (protectedDataAddress: address => inSubscription: bool)
    mapping(uint256 => mapping(address => bool)) public protectedDataInSubscription;
    // collectionId => (subscriberAddress => endTimestamp(48 bit for full timestamp))
    mapping(uint256 => mapping(address => uint48)) public subscribers;
    // collectionId => subscriptionParams:  SubscriptionParams
    mapping(uint256 => SubscriptionParams) public subscriptionParams;
    // collectionId => last subsciption end timestamp
    mapping(uint256 => uint48) public lastSubscriptionExpiration;

    struct SubscriptionParams {
        uint112 price; // 112 bit allows for 10^15 eth
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    modifier onlyCollectionNotSubscribed(uint256 _collectionId) {
        require(
            lastSubscriptionExpiration[_collectionId] < block.timestamp,
            "Collection has ongoing subscriptions"
        );
        _;
    }

    modifier onlyProtectedDataNotAvailableInSubscription(
        uint256 _collectionId,
        address _protectedData
    ) {
        require(
            protectedDataInSubscription[_collectionId][_protectedData] == false,
            "ProtectedData is available in subscription"
        );
        _;
    }
    /***************************************************************************
     *                       Renting                                      *
     ***************************************************************************/
    // collectionId => (protectedDataAddress: address => rentingParams: RentingParams)
    mapping(uint256 => mapping(address => RentingParams)) public protectedDataForRenting;
    // collectionId => (RenterAddress => endTimestamp(48 bit for full timestamp))
    mapping(uint256 => mapping(address => uint48)) public renters;
    // protectedData => last rental end timestamp
    mapping(address => uint48) public lastRentalExpiration;

    struct RentingParams {
        bool inRenting;
        uint112 price; // 112 bit allows for 10^15 eth
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    modifier onlyProtectedDataNotRented(address _protectedData) {
        require(
            lastRentalExpiration[_protectedData] < block.timestamp,
            "ProtectedData is currently being rented"
        );
        _;
    }

    modifier onlyProtectedDataNotForRenting(uint256 _collectionId, address _protectedData) {
        require(
            protectedDataForRenting[_collectionId][_protectedData].inRenting == false,
            "ProtectedData available for renting"
        );
        _;
    }

    /***************************************************************************
     *                       Selling                                           *
     ***************************************************************************/
    // collectionId => (protectedDataAddress: address => sellingParams: SellingParams)
    mapping(uint256 => mapping(address => SellingParams)) public protectedDataForSale;

    struct SellingParams {
        bool forSale;
        uint112 price; // 112 bit allows for 10^15 eth
    }

    modifier onlyProtectedDataNotForSale(uint256 _collectionId, address _protectedData) {
        require(
            protectedDataForSale[_collectionId][_protectedData].forSale == false,
            "ProtectedData for sale"
        );
        _;
    }
}
