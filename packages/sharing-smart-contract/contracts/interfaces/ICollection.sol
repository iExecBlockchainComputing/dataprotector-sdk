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

import {IAppWhitelist} from "./IAppWhitelist.sol";

interface ICollection {
    /**
     * Custom revert error indicating that the caller is not the owner of the collection.
     *
     * @param collectionTokenId - The ID of the collection where the caller is not the owner.
     */
    error NotCollectionOperator(uint256 collectionTokenId);

    /**
     * Custom revert error indicating that the collection is not empty and cannot be removed.
     *
     * @param collectionTokenId - The ID of the collection that is not empty and cannot be removed.
     */
    error CollectionNotEmpty(uint256 collectionTokenId);

    /**
     * Event emitted when a protected data is removed from a collection.
     *
     * @param protectedData - The address of the protected data.
     * @param newCollection - The ID of the collection to which the protected data is added.
     * @param oldCollection - The ID of the collection from which the protected data is removed.
     * @param appWhitelist - The address of the approved application to consume the protected data.
     */
    event ProtectedDataTransfer(
        address protectedData,
        uint256 newCollection,
        uint256 oldCollection,
        address appWhitelist
    );

    /**
     * Create a new collection and returns its token ID.
     *
     * @return tokenId The token ID of the newly created collection.
     * @param _to - The address of the token owner.
     */
    function createCollection(address _to) external returns (uint256 tokenId);

    /**
     * Add protected data to the specified collection.
     * The owner should approve the smart contract before calling this function.
     * The ownership of the protected data added to the collection is transferred to the smart contract,
     * enabling it to publish protected data orders.
     *
     * @param _collectionTokenId The ID of the collection.
     * @param _protectedData The address of the protected data to be added.
     * @param _appAddress The address of the application whitelist.
     */
    function addProtectedDataToCollection(
        uint256 _collectionTokenId,
        address _protectedData,
        IAppWhitelist _appAddress
    ) external;

    /**
     * Remove protected data from the specified collection.
     * The ownership of the protected data is given back to the msg.sender
     *
     * @param _protectedData The address of the protected data to be removed.
     */
    function removeProtectedDataFromCollection(address _protectedData) external;
}
