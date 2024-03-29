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

import "../interfaces/IAppWhitelist.sol";

interface ISale {
    /**
     * Custom revert error indicating that the protected data is for sale.
     *
     * @param protectedData - The address of the protected data for sale.
     */
    error ProtectedDataForSale(address protectedData);

    /**
     * Custom revert error indicating that the protected data is not for sale.
     *
     * @param protectedData - The address of the protected data not for sale.
     */
    error ProtectedDataNotForSale(address protectedData);

    /**
     * Selling parameters for a protected data item.
     *
     * @param isForSale - Indicates whether the protected data is available for sale.
     * @param price - The price (in Gwei) for purchasing the protected data.
     */
    struct SellingParams {
        bool isForSale;
        uint64 price; // 32 bit allows for 10^19 eth
    }

    /**
     * Event emitted when protected data is added for sale in a collection.
     *
     * @param collectionTokenId - The ID of the collection.
     * @param protectedData - The address of the protected data.
     * @param price - The price (in Gwei) for purchasing the protected data.
     */
    event ProtectedDataAddedForSale(uint256 collectionTokenId, address protectedData, uint64 price);

    /**
     * Event emitted when protected data is removed from sale in a collection.
     *
     * @param collectionTokenId - The ID of the collection.
     * @param protectedData - The address of the protected data.
     */
    event ProtectedDataRemovedFromSale(uint256 collectionTokenId, address protectedData);

    /**
     * Event emitted when protected data is sold from one collection.
     *
     * @param collectionTokenIdFrom - The ID of the collection from which the protected data is sold.
     * @param protectedData - The address of the protected data.
     * @param to - The address to which the protected data is transferred. It could be the
     * smart contract itselft, it means that the protected data has moved to another ollection
     * or it can be the msg.sender
     */
    event ProtectedDataSold(uint256 collectionTokenIdFrom, address to, address protectedData);

    /**
     * Set protected data available for sale with the specified price.
     *
     * @param _protectedData The address of the protected data to be set for sale.
     * @param _price The price in wei for the protected data.
     */
    function setProtectedDataForSale(address _protectedData, uint64 _price) external;

    /**
     * Remove protected data from the list available for sale.
     *
     * @param _protectedData The address of the protected data to be removed from sale.
     */
    function removeProtectedDataForSale(address _protectedData) external;

    /**
     * Purchases protected data using the buyer's account balance within the platform and transfers ownership
     * to a specified address. This method requires the smart contract to be pre-authorized to use the necessary
     * funds from the buyer's account (sufficient Stacked RLC must be available). Upon completion, the smart contract will no longer manage the protected data.
     *
     * @param _protectedData The address of the protected data being purchased.
     * @param _to The recipient address to which the protected data will be transferred.
     */
    function buyProtectedData(address _protectedData, address _to) external;
}
