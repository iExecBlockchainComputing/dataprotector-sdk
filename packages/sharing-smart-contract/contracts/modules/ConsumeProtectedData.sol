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

import "./ManageOrders.sol";

contract ConsumeProtectedData is ManageOrders {
    using IexecLibOrders_v5 for IexecLibOrders_v5.WorkerpoolOrder;

    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/
    event DealId(bytes32);

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function consumeProtectedData(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        string calldata _contentPath
    ) external returns (bytes32) {
        // require(
        //     protectedDataInSubscription[_collectionId][_protectedData],
        //     "ProtectedData not available for Subscription"
        // );
        // require(
        //     subscribers[_collectionId][_protectedData] < block.timestamp,
        //     "Subscription not yet valide"
        // );
        // TODO: uncomment
        // require(tenants[_collectionId][_protectedData] < block.timestamp, "Rent not yet valide");
        // address appAddress = ;
        IexecLibOrders_v5.AppOrder memory appOrder = createAppOrder(
            _protectedData,
            _workerpoolOrder.workerpool
        );

        IexecLibOrders_v5.DatasetOrder memory datasetOrder = createDatasetOrder(
            _protectedData,
            _workerpoolOrder.workerpool
        );

        IexecLibOrders_v5.RequestOrder memory requestOrder = createRequestOrder(
            _protectedData,
            _workerpoolOrder.workerpool,
            _contentPath
        );

        bytes32 dealid = m_pocoDelegate.matchOrders(
            appOrder,
            datasetOrder,
            _workerpoolOrder,
            requestOrder
        );
        emit DealId(dealid);
        return dealid;
    }
}
