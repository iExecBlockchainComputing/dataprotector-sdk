// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2024 IEXEC BLOCKCHAIN TECH                                       *
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

interface ISubscription {
    error ProctedDataInSubscription(uint256 _collectionTokenId, address _protectedData);
    error OnGoingCollectionSubscriptions(uint256 collectionTokenId);
    error ProtectedDataAvailableInSubscription(uint256 collectionTokenId, address protectedData);
    error NoSubscriptionParams(uint256 collectionTokenId);

    /**
     * Subscription parameters for a collection.
     * @param price - The price in wei for the subscription.
     * @param duration - The duration in seconds for the subscription.
     */
    struct SubscriptionParams {
        uint112 price; // 112 bit allows for 10^15 eth
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    /**
     * Event emitted when new subscription parameters are set for a collection.
     * @param collectionTokenId - The ID of the collection.
     * @param subscriptionParams - The subscription parameters set for the collection.
     */
    event NewSubscriptionParams(uint256 collectionTokenId, SubscriptionParams subscriptionParams);

    /**
     * Event emitted when a new subscription is created for a collection.
     * @param collectionTokenId - The ID of the collection.
     * @param subscriber - The address of the subscriber.
     * @param endDate - The end date of the subscription.
     */
    event NewSubscription(uint256 collectionTokenId, address indexed subscriber, uint48 endDate);

    /**
     * Event emitted when protected data is added to pool of protected data
     * among the collection available for the subscription.
     * @param collectionTokenId - The ID of the collection.
     * @param protectedData - The address of the protected data.
     */
    event ProtectedDataAddedForSubscription(uint256 collectionTokenId, address protectedData);

    /**
     * Event emitted when protected data is removed from a subscription.
     * @param collectionTokenId - The ID of the collection.
     * @param protectedData - The address of the protected data.
     */
    event ProtectedDataRemovedFromSubscription(uint256 collectionTokenId, address protectedData);

    /**
     * Subscribe to a collection by paying the subscription price.
     * @param _collectionTokenId The ID of the collection to subscribe to.
     * @return endDate The end date of the subscription.
     */
    function subscribeTo(uint256 _collectionTokenId) external payable returns (uint256 endDate);

    /**
     * Set protected data available in the subscription for the specified collection.
     * @param _collectionTokenId The ID of the collection.
     * @param _protectedData The address of the protected data to be added to the subscription.
     */
    function setProtectedDataToSubscription(
        uint256 _collectionTokenId,
        address _protectedData
    ) external;

    /**
     * Remove protected data from the subscription for the specified collection.
     * Subcribers cannot consume the protected data anymore
     * @param _collectionTokenId The ID of the collection.
     * @param _protectedData The address of the protected data to be removed from the subscription.
     */
    function removeProtectedDataFromSubscription(
        uint256 _collectionTokenId,
        address _protectedData
    ) external;

    /**
     * Set the subscription parameters for a collection.
     * @param _collectionTokenId The ID of the collection.
     * @param _subscriptionParams The subscription parameters to be set.
     */
    function setSubscriptionParams(
        uint256 _collectionTokenId,
        SubscriptionParams calldata _subscriptionParams
    ) external;
}
