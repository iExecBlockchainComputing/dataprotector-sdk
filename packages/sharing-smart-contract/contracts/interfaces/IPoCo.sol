// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2025 IEXEC BLOCKCHAIN TECH                                       *
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

// TODO import interfaces (IexecOrderManagement, IexecPoco1, ...) from @iexec/poco.

interface IPoCo {
    // IexecEscrowNative
    function deposit() external payable returns (bool); // Native mode

    // TODO support both token and native modes.
    // IexecEscrowToken
    // function deposit(uint256) external returns (bool); // Token mode

    // IexecERC20
    function approve(address spender, uint256 value) external returns (bool);
    function approveAndCall(
        address spender,
        uint256 value,
        bytes calldata extraData
    ) external returns (bool);
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    // IexecOrderManagement
    function manageAppOrder(IexecLibOrders_v5.AppOrderOperation calldata operation) external;
    function manageDatasetOrder(IexecLibOrders_v5.DatasetOrderOperation calldata operation) external;
    function manageWorkerpoolOrder(IexecLibOrders_v5.WorkerpoolOrderOperation calldata operation) external;
    function manageRequestOrder(IexecLibOrders_v5.RequestOrderOperation calldata operation) external;

    // IexecPoco1
    function matchOrders(
        IexecLibOrders_v5.AppOrder calldata appOrder,
        IexecLibOrders_v5.DatasetOrder calldata datasetOrder,
        IexecLibOrders_v5.WorkerpoolOrder calldata workerpoolOrder,
        IexecLibOrders_v5.RequestOrder calldata requestOrder
    ) external returns (bytes32);
}

// TODO import from @iexec/poco
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
