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
pragma solidity ^0.8.24;

interface ISubscription {
    /**
     * Custom revert error indicating that the protected data is currently in a subscription.
     *
     * @param _collectionTokenId - The ID of the collection containing the protected data.
     * @param _protectedData - The address of the protected data.
     */
    error ProctedDataInSubscription(uint256 _collectionTokenId, address _protectedData);

    /**
     * Custom revert error indicating that there are ongoing subscriptions for the collection.
     *
     * @param collectionTokenId - The ID of the collection with ongoing subscriptions.
     */
    error OnGoingCollectionSubscriptions(uint256 collectionTokenId);

    /**
     * Custom revert error indicating that the protected data is available for subscription.
     *
     * @param collectionTokenId - The ID of the collection containing the protected data.
     * @param protectedData - The address of the protected data available for subscription.
     */
    error ProtectedDataAvailableInSubscription(uint256 collectionTokenId, address protectedData);

    /**
     * Custom revert error indicating that the subscription params set are not valide.
     *
     * @param collectionTokenId - The ID of the collection.
     * @param subscriptionParams - Current subscription params
     */
    error InvalidSubscriptionParams(uint256 collectionTokenId, SubscriptionParams subscriptionParams);

    /**
     * Subscription parameters for a collection.
     *
     * @param price - The price (in Gwei) for the subscription.
     * @param duration - The duration in seconds for the subscription.
     */
    struct SubscriptionParams {
        uint72 price; // 72 bit allows for 10^21 nRLC
        uint48 duration; // 48 bit allows 89194 years of delay
    }

    /**
     * Event emitted when new subscription parameters are set for a collection.
     *
     * @param collectionTokenId - The ID of the collection.
     * @param subscriptionParams - The subscription parameters set for the collection.
     */
    event NewSubscriptionParams(uint256 collectionTokenId, SubscriptionParams subscriptionParams);

    /**
     * Event emitted when a new subscription is created for a collection.
     *
     * @param collectionTokenId - The ID of the collection.
     * @param subscriber - The address of the subscriber.
     * @param endDate - The end date of the subscription.
     */
    event NewSubscription(uint256 collectionTokenId, address indexed subscriber, uint48 endDate);

    /**
     * Event emitted when protected data is added to pool of protected data
     * among the collection available for the subscription.
     *
     * @param collectionTokenId - The ID of the collection.
     * @param protectedData - The address of the protected data.
     */
    event ProtectedDataAddedForSubscription(uint256 collectionTokenId, address protectedData);

    /**
     * Event emitted when protected data is removed from a subscription.
     *
     * @param collectionTokenId - The ID of the collection.
     * @param protectedData - The address of the protected data.
     */
    event ProtectedDataRemovedFromSubscription(uint256 collectionTokenId, address protectedData);

    /**
     * Subscribes to a collection using funds from the caller's account balance within the platform
     * (Stacked RLC). Requires prior approval for this contract to spend the subscription amount on
     * behalf of the caller.
     *
     * @param _collectionTokenId The unique identifier of the collection to subscribe to.
     * @param _subscriptionParams Additional parameter to prevent front-running attacks, ensuring fair subscription execution.
     * @return endDate The timestamp when the subscription will expire, indicating the end of access.
     */
    function subscribeToCollection(
        uint256 _collectionTokenId,
        SubscriptionParams memory _subscriptionParams
    ) external returns (uint48);

    /**
     * Set protected data available in the subscription for the specified collection.
     *
     * @param _protectedData The address of the protected data to be added to the subscription.
     */
    function setProtectedDataToSubscription(address _protectedData) external;

    /**
     * Remove protected data from the subscription for the specified collection.
     * Subcribers cannot consume the protected data anymore
     *
     * @param _protectedData The address of the protected data to be removed from the subscription.
     */
    function removeProtectedDataFromSubscription(address _protectedData) external;

    /**
     * Set the subscription parameters for a collection.
     *
     * @param _collectionTokenId The ID of the collection.
     * @param _subscriptionParams The subscription parameters to be set.
     */
    function setSubscriptionParams(
        uint256 _collectionTokenId,
        SubscriptionParams calldata _subscriptionParams
    ) external;
}
