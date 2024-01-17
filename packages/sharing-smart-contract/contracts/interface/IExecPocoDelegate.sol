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
    function manageAppOrder(IexecLibOrders_v5.AppOrderOperation calldata) external;

    function manageDatasetOrder(IexecLibOrders_v5.DatasetOrderOperation calldata) external;

    function manageWorkerpoolOrder(IexecLibOrders_v5.WorkerpoolOrderOperation calldata) external;

    function manageRequestOrder(IexecLibOrders_v5.RequestOrderOperation calldata) external;

    function matchOrders(
        IexecLibOrders_v5.AppOrder calldata,
        IexecLibOrders_v5.DatasetOrder calldata,
        IexecLibOrders_v5.WorkerpoolOrder calldata,
        IexecLibOrders_v5.RequestOrder calldata
    ) external returns (bytes32);

    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}
