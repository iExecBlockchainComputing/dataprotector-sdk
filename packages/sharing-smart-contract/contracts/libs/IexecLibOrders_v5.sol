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

library IexecLibOrders_v5 {
    enum OrderOperationEnum {
        SIGN,
        CLOSE
    }

    struct AppOrder {
        address app;
        uint256 appprice;
        uint256 volume;
        bytes32 tag;
        address datasetrestrict;
        address workerpoolrestrict;
        address requesterrestrict;
        bytes32 salt;
        bytes sign;
    }

    struct DatasetOrder {
        address dataset;
        uint256 datasetprice;
        uint256 volume;
        bytes32 tag;
        address apprestrict;
        address workerpoolrestrict;
        address requesterrestrict;
        bytes32 salt;
        bytes sign;
    }

    struct WorkerpoolOrder {
        address workerpool;
        uint256 workerpoolprice;
        uint256 volume;
        bytes32 tag;
        uint256 category;
        uint256 trust;
        address apprestrict;
        address datasetrestrict;
        address requesterrestrict;
        bytes32 salt;
        bytes sign;
    }

    struct RequestOrder {
        address app;
        uint256 appmaxprice;
        address dataset;
        uint256 datasetmaxprice;
        address workerpool;
        uint256 workerpoolmaxprice;
        address requester;
        uint256 volume;
        bytes32 tag;
        uint256 category;
        uint256 trust;
        address beneficiary;
        address callback;
        string params;
        bytes32 salt;
        bytes sign;
    }

    struct AppOrderOperation {
        AppOrder order;
        OrderOperationEnum operation;
        bytes sign;
    }

    struct DatasetOrderOperation {
        DatasetOrder order;
        OrderOperationEnum operation;
        bytes sign;
    }

    struct WorkerpoolOrderOperation {
        WorkerpoolOrder order;
        OrderOperationEnum operation;
        bytes sign;
    }

    struct RequestOrderOperation {
        RequestOrder order;
        OrderOperationEnum operation;
        bytes sign;
    }
}
