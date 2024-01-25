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
import "./interface/IDatasetRegistry.sol";

abstract contract Store {
    /***************************************************************************
     *                       ManageOrders                                      *
     ***************************************************************************/
    event DealId(bytes32);

    IExecPocoDelegate internal immutable m_pocoDelegate;
    bytes32 internal constant TAG =
        0x0000000000000000000000000000000000000000000000000000000000000003; // [tee,scone]
    uint256 internal constant TRUST = 0; // No replication
    // collectionId => (protectedDataAddress: address => App:address)
    mapping(uint256 => mapping(address => address)) public appForProtectedData;
    // Global variables for requestOrder params
    string internal iexec_result_storage_provider = "ipfs";
    string internal iexec_result_storage_proxy = "https://result.v8-bellecour.iex.ec";

    /***************************************************************************
     *                       Collection                                        *
     ***************************************************************************/
    event AddProtectedDataToCollection(uint256 collectionId, address protectedData);
    event RemoveProtectedDataFromCollection(uint256 collectionId, address protectedData);

    IDatasetRegistry public immutable registry;
    uint256 internal _nextCollectionId;
    //collectionId => (ProtectedDataTokenId => ProtectedDataAddress)
    mapping(uint256 => mapping(uint160 => address)) public protectedDatas;

    /***************************************************************************
     *                       Subscription                                      *
     ***************************************************************************/
    event NewSubscriptionParams(uint256 _collectionId, SubscriptionParams subscriptionParams);
    event NewSubscription(uint256 _collectionId, address indexed subscriber, uint48 endDate);
    event AddProtectedDataForSubscription(uint256 _collectionId, address _protectedData);
    event RemoveProtectedDataFromSubscription(uint256 _collectionId, address _protectedData);

    // collectionId => (protectedDataAddress: address => inSubscription: bool)
    mapping(uint256 => mapping(address => bool)) public protectedDataInSubscription;
    // collectionId => (subscriberAddress => endTimestamp(48 bit for full timestamp))
    mapping(uint256 => mapping(address => uint48)) public subscribers;
    // collectionId => subscriber
    mapping(uint256 => SubscriptionParams) public subscriptionParams;
    // collectionId => last subsciption end timestamp
    mapping(uint256 => uint48) public lastSubscriptionExpiration;

    struct SubscriptionParams {
        uint112 price; // 112 bit allows for 10^15 eth
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    /***************************************************************************
     *                       Renting                                      *
     ***************************************************************************/
    event ProtectedDataAddedToRenting(
        uint256 _collectionId,
        address _protectedData,
        uint112 _price,
        uint48 _duration
    );
    event ProtectedDataRemovedFromRenting(uint256 _collectionId, address _protectedData);
    event NewRental(uint256 _collectionId, address _protectedData, uint48 endDate);

    // collectionId => (ProtectedDataTokenId => RentingParams)
    mapping(uint256 => mapping(address => RentingParams)) public protectedDataForRenting;
    // collectionId => (tenantAddress => endTimestamp(48 bit for full timestamp))
    mapping(uint256 => mapping(address => uint48)) public tenants;
    // protectedData => last rental end timestamp
    mapping(address => uint48) public lastRentalExpiration;

    struct RentingParams {
        bool inRenting;
        uint112 price; // 112 bit allows for 10^15 eth
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    /***************************************************************************
     *                       Saling                                            *
     ***************************************************************************/
    event ProtectedDataAddedForSale(uint256 _collectionId, address _protectedData, uint112 _price);
    event ProtectedDataRemovedFromSale(uint256 _collectionId, address _protectedData);
    event ProtectedDataSold(uint256 _collectionIdFrom, address _protectedData, address _to);

    // collectionId => (ProtectedDataTokenId => SellingParam)
    mapping(uint256 => mapping(address => SellingParam)) public protectedDataForSale;

    struct SellingParam {
        bool forSale;
        uint112 price; // 112 bit allows for 10^15 eth
    }
}
