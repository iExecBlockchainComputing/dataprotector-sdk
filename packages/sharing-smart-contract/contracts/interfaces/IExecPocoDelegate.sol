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

import "../libs/IexecLibOrders_v5.sol";

interface IExecPocoDelegate {
    /**
     * Publish an on chain application order operation.
     * @param operation The application order operation to be managed.
     */
    function manageAppOrder(IexecLibOrders_v5.AppOrderOperation calldata operation) external;

    /**
     * Publish an on chain dataset order operation.
     * @param operation The dataset order operation to be managed.
     */
    function manageDatasetOrder(
        IexecLibOrders_v5.DatasetOrderOperation calldata operation
    ) external;

    /**
     * Publish an on chain request order operation.
     * @param operation The request order operation to be managed.
     */
    function manageRequestOrder(
        IexecLibOrders_v5.RequestOrderOperation calldata operation
    ) external;

    /**
     * Matche orders to form a deal.
     * @param appOrder The application order.
     * @param datasetOrder The dataset order.
     * @param workerpoolOrder The workerpool order.
     * @param requestOrder The request order.
     * @return The deal's unique identifier.
     */
    function matchOrders(
        IexecLibOrders_v5.AppOrder calldata appOrder,
        IexecLibOrders_v5.DatasetOrder calldata datasetOrder,
        IexecLibOrders_v5.WorkerpoolOrder calldata workerpoolOrder,
        IexecLibOrders_v5.RequestOrder calldata requestOrder
    ) external returns (bytes32);
}
