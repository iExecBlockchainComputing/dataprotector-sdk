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

import "./interface/IExecPocoDelegate.sol";
import "./libs/IexecLibOrders_v5.sol";

contract ManageOrders {
    using IexecLibOrders_v5 for IexecLibOrders_v5.OrderOperationEnum;
    using IexecLibOrders_v5 for IexecLibOrders_v5.AppOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.WorkerpoolOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.DatasetOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.RequestOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.AppOrderOperation;
    using IexecLibOrders_v5 for IexecLibOrders_v5.DatasetOrderOperation;
    using IexecLibOrders_v5 for IexecLibOrders_v5.RequestOrderOperation;

    // ---------------------ManageOrders state----------------------------------
    IExecPocoDelegate internal m_pocoDelegate;
    bytes32 internal constant TAG =
        0x0000000000000000000000000000000000000000000000000000000000000003; // [tee,scone]
    uint256 internal constant TRUST = 0; // No replication
    string internal iexec_result_storage_provider;
    string internal iexec_result_storage_proxy;

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function createAppOrder(
        address _protectedData,
        address _appAddress,
        address _workerpoolAddresss
    ) internal returns (IexecLibOrders_v5.AppOrder memory) {
        //create AppOrder
        IexecLibOrders_v5.AppOrder memory appOrder;
        appOrder.app = _appAddress; //address
        appOrder.appprice = 0; //uint256
        appOrder.volume = 1; //uint256
        appOrder.tag = TAG; //bytes32
        appOrder.datasetrestrict = _protectedData; //address
        appOrder.workerpoolrestrict = _workerpoolAddresss; //address
        appOrder.requesterrestrict = address(this); //address
        appOrder.salt = getSalt(); //bytes32

        //create AppOrderOperation
        IexecLibOrders_v5.AppOrderOperation memory appOrderOperation;
        appOrderOperation.order = appOrder; //AppOrder
        appOrderOperation.operation = IexecLibOrders_v5.OrderOperationEnum.SIGN; //OrderOperationEnum

        m_pocoDelegate.manageAppOrder(appOrderOperation);

        return appOrder;
    }

    function createDatasetOrder(
        address _protectedData,
        address _appAddress,
        address _workerpoolAddresss
    ) internal returns (IexecLibOrders_v5.DatasetOrder memory) {
        //create DatasetOrder
        IexecLibOrders_v5.DatasetOrder memory datasetOrder;
        datasetOrder.dataset = _protectedData;
        datasetOrder.datasetprice = 0;
        datasetOrder.volume = 1;
        datasetOrder.tag = TAG;
        datasetOrder.apprestrict = _appAddress;
        datasetOrder.workerpoolrestrict = _workerpoolAddresss;
        datasetOrder.requesterrestrict = address(this);
        datasetOrder.salt = getSalt();

        //create DatasetOrderOperation
        IexecLibOrders_v5.DatasetOrderOperation memory datasetOrderOperation;
        datasetOrderOperation.order = datasetOrder; //DatasetOrder
        datasetOrderOperation.operation = IexecLibOrders_v5.OrderOperationEnum.SIGN; //OrderOperationEnum

        m_pocoDelegate.manageDatasetOrder(datasetOrderOperation);

        return datasetOrder;
    }

    function createRequestOrder(
        address _protectedData,
        address _appAddress,
        address _workerpoolAddress,
        uint256 _category,
        string calldata _contentPath
    ) internal returns (IexecLibOrders_v5.RequestOrder memory) {
        string memory params = generateParams(_contentPath);

        //create RequestOrder
        IexecLibOrders_v5.RequestOrder memory requestOrder;
        requestOrder.app = _appAddress; //address
        requestOrder.appmaxprice = 0; //uint256
        requestOrder.dataset = _protectedData; //address
        requestOrder.datasetmaxprice = 0; //uint256
        requestOrder.workerpool = _workerpoolAddress; //address
        requestOrder.workerpoolmaxprice = 0; //uint256
        requestOrder.requester = address(this); //address
        requestOrder.volume = 1; //uint256
        requestOrder.tag = TAG; //bytes32
        requestOrder.category = _category; //uint256
        requestOrder.trust = TRUST; //uint256
        requestOrder.beneficiary = msg.sender; //address
        requestOrder.callback = address(0); //address
        requestOrder.params = params; //string
        requestOrder.salt = getSalt(); //bytes32

        //create RequestOrderOperation
        IexecLibOrders_v5.RequestOrderOperation memory requestOrderOperation;
        requestOrderOperation.order = requestOrder; //RequestOrder
        requestOrderOperation.operation = IexecLibOrders_v5.OrderOperationEnum.SIGN; //OrderOperationEnum

        m_pocoDelegate.manageRequestOrder(requestOrderOperation);

        return requestOrder;
    }

    function getSalt() private view returns (bytes32) {
        return keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }

    function generateParams(string calldata _iexec_args) private view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '{"iexec_result_encryption":true,"iexec_secrets":{},"iexec_input_files":[]', // set params to avoid injection
                    ',"iexec_result_storage_provider":"',
                    iexec_result_storage_provider,
                    '","iexec_result_storage_proxy":"',
                    iexec_result_storage_proxy,
                    '","iexec_args":"',
                    _iexec_args,
                    '"}'
                )
            );
    }
}
