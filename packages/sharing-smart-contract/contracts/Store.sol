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
import "./interface/IRegistry.sol";

abstract contract Store {
    /***************************************************************************
     *                       ManageOrders                                      *
     ***************************************************************************/
    IExecPocoDelegate internal immutable m_pocoDelegate;
    bytes32 internal constant TAG =
        0x0000000000000000000000000000000000000000000000000000000000000003; // [tee,scone]
    uint256 internal constant TRUST = 0; // No replication
    // Global variables for requestOrder params
    string internal iexec_result_storage_provider = "ipfs";
    string internal iexec_result_storage_proxy = "https://result.v8-bellecour.iex.ec";
    // collectionId => (protectedDataAddress: address => App:address)
    mapping(uint256 => mapping(address => address)) public appForProtectedData;

    /***************************************************************************
     *                       Collection                                        *
     ***************************************************************************/
    IRegistry public immutable protectedDataRegistry;
    IRegistry public immutable appRegistry;
    uint256 internal _nextCollectionId;
    //collectionId => (ProtectedDataTokenId => ProtectedDataAddress)
    mapping(uint256 => mapping(uint160 => address)) public protectedDatas;

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

    /**
     * Subscription parameters for a collection.
     * @param price - The price in wei for the subscription.
     * @param duration - The duration in seconds for the subscription.
     */
    struct SubscriptionParams {
        uint112 price; // 112 bit allows for 10^15 eth
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    /***************************************************************************
     *                       Rental                                            *
     ***************************************************************************/
    // collectionId => (protectedDataAddress: address => rentingParams: RentingParams)
    mapping(uint256 => mapping(address => RentingParams)) public protectedDataForRenting;
    // collectionId => (RenterAddress => endTimestamp(48 bit for full timestamp))
    mapping(uint256 => mapping(address => uint48)) public renters;
    // protectedData => last rental end timestamp
    mapping(address => uint48) public lastRentalExpiration;

    /**
     * Renting parameters for a protected data item.
     * @param isForRent - Indicates whether the protected data is available for renting.
     * @param price - The price in wei for renting the protected data.
     * @param duration - The duration in seconds for which the protected data can be rented.
     */
    struct RentingParams {
        bool isForRent;
        uint112 price; // 112 bit allows for 10^15 eth
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    /***************************************************************************
     *                       Sale                                              *
     ***************************************************************************/
    // collectionId => (protectedDataAddress: address => sellingParams: SellingParams)
    mapping(uint256 => mapping(address => SellingParams)) public protectedDataForSale;

    /**
     * Selling parameters for a protected data item.
     * @param isForSale - Indicates whether the protected data is available for sale.
     * @param price - The price in wei for purchasing the protected data.
     */
    struct SellingParams {
        bool isForSale;
        uint112 price; // 112 bit allows for 10^15 eth
    }
}
