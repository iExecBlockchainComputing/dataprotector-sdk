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
     * Consume protected data by creating a deal on the iExec platform.
     * Requires a valid subscription or rental for the protected data.
     * @param _collectionId The ID of the collection containing the protected data.
     * @param _protectedData The address of the protected data.
     * @param _workerpoolOrder The workerpool order for the computation task.
     * @param _contentPath The path of the content inside the protected data to consume.
     * @return The unique identifier (deal ID) of the created deal on the iExec platform.
     */
    function consumeProtectedData(
        uint256 _collectionId,
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        string calldata _contentPath
    ) external returns (bytes32);
}
