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

import "./ICollection.sol";
import "./ISubscription.sol";
import "./IRental.sol";
import "./ISale.sol";
import "../libs/IexecLibOrders_v5.sol";

interface IProtectedDataSharing is ICollection, ISubscription, IRental, ISale {
    /**
     * Custom revert error indicating that the workerpool order is not free.
     * @param workerpoolOrder - The workerpool order that is not free.
     */
    error WorkerpoolOrderNotFree(IexecLibOrders_v5.WorkerpoolOrder workerpoolOrder);

    /**
     * Custom revert error indicating that there is no valid rental or subscription for the protected data.
     * @param collectionTokenId - The ID of the collection for which there is no valid rental or subscription.
     * @param protectedDatas - The address of the protected data.
     */
    error NoValidRentalOrSubscription(uint256 collectionTokenId, address protectedDatas);

    /**
     * Custom revert error indicating that the application is not owned by the contract.
     * @param appAddress - The address of the application that is not owned by the contract.
     */
    error AppNotOwnByContract(address appAddress);

    /**
     * Custom revert error indicating that the wrong amount of funds was sent.
     * @param expectedAmount - The amount of funds expected.
     * @param receivedAmount - The amount of funds received.
     */
    error WrongAmountSent(uint256 expectedAmount, uint256 receivedAmount);

    /**
     * Event emitted when user want to withdraw its balance.
     * @param user - The user address that withdraw its RLC.
     * @param amount - amount withdraw.
     */
    event Withdraw(address user, uint256 amount);

    /**
     * Event emitted when protected data is consumed under a specific deal, providing the unique deal ID and the mode of consumption.
     * @param dealId - The unique identifier for the deal.
     * @param protectedData - protectedData used for the deal.
     * @param mode - The mode of consumption (either subscription or renting).
     */
    event ProtectedDataConsumed(bytes32 dealId, address protectedData, mode mode);

    enum mode {
        SUBSCRIPTION, // Indicates subscription-based consumption.
        RENTING // Indicates renting-based consumption.
    }

    /**
     * CollectionDetails struct contains details about a collection.
     * @param size - number of protectedData inside the collection.
     * @param subscriptionExpiration - The latest expiration timestamp among all subscriptions for the protected data.
     * @param subscriptionParams - Subscription pameters associated to the collection.
     * @param subscribers - Mapping of subscriber addresses to their subscription expiration timestamps.
     */
    struct CollectionDetails {
        uint256 size;
        uint48 subscriptionExpiration; // latestSubscriptionExpiration
        SubscriptionParams subscriptionParams;
        mapping(address => uint48) subscribers; // subscriberAddress => endTimestamp(48 bit for full timestamp)
    }

    /**
     * ProtectedDataDetails struct contains details about protected data.
     * @param collection - The ID of the collection containing the protected data.
     * @param app - The address of the application that will consume the protected data.
     * @param rentalExpiration - The latest expiration timestamp among all rentals for the protected data.
     * @param renters - Mapping of renter addresses to their rental expiration timestamps.
     * @param inSubscription - Indicates whether the protected data is part of a subscription.
     * @param sellingParams - Selling parameters for to the sale of the protected data.
     */
    struct ProtectedDataDetails {
        uint256 collection;
        address app;
        uint48 rentalExpiration; // latestRentalExpiration
        bool inSubscription;
        RentingParams rentingParams;
        mapping(address => uint48) renters; // renterAddress => endTimestamp(48 bit for full timestamp)
        SellingParams sellingParams;
    }

    /**
     * Consume protected data by creating a deal on the iExec platform.
     * Requires a valid subscription or rental for the protected data.
     * @param _collectionTokenId The ID of the collection containing the protected data.
     * @param _protectedData The address of the protected data.
     * @param _workerpoolOrder The workerpool order for the computation task.
     * @param _contentPath The path of the content inside the protected data to consume.
     * @return The unique identifier (deal ID) of the created deal on the iExec platform.
     */
    function consumeProtectedData(
        uint256 _collectionTokenId,
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        string calldata _contentPath
    ) external returns (bytes32);

    /**
     * Enable the msg.sender to withdraw its balance
     */
    function withdraw() external;

    /**
     * Get the rental expiration of the protectedData
     *
     * @param _protectedData The address of the protected data.
     * @param _renterAddress The workerpool order for the computation task.
     * @return The rental expiration timestamp.
     */
    function getProtectedDataRenter(
        address _protectedData,
        address _renterAddress
    ) external view returns (uint48);

    /**
     * Get the rental expiration of the protectedData
     *
     * @param _collectionTokenId - The ID of the collection containing the protected data.
     * @param _subscriberAddress - The address of the protected data.
     * @return The subscription expiration timestamp.
     */
    function getCollectionSubscriber(
        uint256 _collectionTokenId,
        address _subscriberAddress
    ) external view returns (uint48);
}
