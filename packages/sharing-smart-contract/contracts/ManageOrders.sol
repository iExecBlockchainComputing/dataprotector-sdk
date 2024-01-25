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
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Store.sol";

// TODO : Should be validated in ticket PRO-691
contract ManageOrders is Ownable, Store {
    using IexecLibOrders_v5 for IexecLibOrders_v5.OrderOperationEnum;
    using IexecLibOrders_v5 for IexecLibOrders_v5.AppOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.WorkerpoolOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.DatasetOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.RequestOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.AppOrderOperation;
    using IexecLibOrders_v5 for IexecLibOrders_v5.DatasetOrderOperation;
    using IexecLibOrders_v5 for IexecLibOrders_v5.RequestOrderOperation;

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor() Ownable(msg.sender) {
        updateParams("ipfs", "https://result.v8-bellecour.iex.ec", "");
    }

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function createAppOrder(
        address _protectedData,
        address _workerpoolAddresss
    ) internal returns (IexecLibOrders_v5.AppOrder memory) {
        //create AppOrder
        IexecLibOrders_v5.AppOrder memory appOrder;
        appOrder.app = appAddress; //address
        appOrder.appprice = 0; //uint256
        appOrder.volume = 1; //uint256
        appOrder.tag = TAG; //bytes32
        appOrder.datasetrestrict = _protectedData; //address
        appOrder.workerpoolrestrict = _workerpoolAddresss; //address
        appOrder.requesterrestrict = address(this); //address
        appOrder.salt = getSalt(_protectedData); //bytes32
        appOrder.sign = nullSign; //bytes

        //create AppOrderOperation
        IexecLibOrders_v5.AppOrderOperation memory appOrderOperation;
        appOrderOperation.order = appOrder; //AppOrder
        appOrderOperation.operation = IexecLibOrders_v5.OrderOperationEnum.SIGN; //OrderOperationEnum
        appOrderOperation.sign = nullSign; //bytes

        m_pocoDelegate.manageAppOrder(appOrderOperation);

        return appOrder;
    }

    function createDatasetOrder(
        address _protectedData,
        address _workerpoolAddresss
    ) internal returns (IexecLibOrders_v5.DatasetOrder memory) {
        //create DatasetOrder
        IexecLibOrders_v5.DatasetOrder memory datasetOrder;
        datasetOrder.dataset = _protectedData;
        datasetOrder.datasetprice = 0;
        datasetOrder.volume = 1;
        datasetOrder.tag = TAG;
        datasetOrder.apprestrict = appAddress;
        datasetOrder.workerpoolrestrict = _workerpoolAddresss;
        datasetOrder.requesterrestrict = address(this);
        datasetOrder.salt = getSalt(_protectedData);
        datasetOrder.sign = nullSign;

        //create DatasetOrderOperation
        IexecLibOrders_v5.DatasetOrderOperation memory datasetOrderOperation;
        datasetOrderOperation.order = datasetOrder; //DatasetOrder
        datasetOrderOperation.operation = IexecLibOrders_v5.OrderOperationEnum.SIGN; //OrderOperationEnum
        datasetOrderOperation.sign = nullSign; //bytes

        m_pocoDelegate.manageDatasetOrder(datasetOrderOperation);

        return datasetOrder;
    }

    function createRequestOrder(
        address _protectedData,
        address _workerpoolAddress,
        string calldata _contentPath
    ) internal returns (IexecLibOrders_v5.RequestOrder memory) {
        string memory params = generateParams(_contentPath);

        //create RequestOrder
        IexecLibOrders_v5.RequestOrder memory requestOrder;
        requestOrder.app = appAddress; //address
        requestOrder.appmaxprice = 0; //uint256
        requestOrder.dataset = _protectedData; //address
        requestOrder.datasetmaxprice = 0; //uint256
        requestOrder.workerpool = _workerpoolAddress; //address
        requestOrder.workerpoolmaxprice = 0; //uint256
        requestOrder.requester = address(this); //address
        requestOrder.volume = 1; //uint256
        requestOrder.tag = TAG; //bytes32
        requestOrder.category = 0; //uint256
        requestOrder.trust = TRUST; //uint256
        requestOrder.beneficiary = msg.sender; //address
        requestOrder.callback = address(0); //address
        requestOrder.params = params; //string
        requestOrder.salt = getSalt(_protectedData); //bytes23
        requestOrder.sign = nullSign; //bytes

        //create RequestOrderOperation
        IexecLibOrders_v5.RequestOrderOperation memory requestOrderOperation;
        requestOrderOperation.order = requestOrder; //RequestOrder
        requestOrderOperation.operation = IexecLibOrders_v5.OrderOperationEnum.SIGN; //OrderOperationEnum
        requestOrderOperation.sign = nullSign; //bytes

        m_pocoDelegate.manageRequestOrder(requestOrderOperation);

        return requestOrder;
    }

    function getSalt(address _protectedData) private view returns (bytes32) {
        return keccak256(abi.encodePacked(block.timestamp, _protectedData));
    }

    function setAppAddress(address _appAddress) public onlyOwner {
        appAddress = _appAddress;
    }

    //TODO: should be specific for each Collection
    function updateParams(
        string memory _resultStorageProvider,
        string memory _resultStorageProxy,
        string memory _contentPath
    ) public onlyOwner {
        iexec_result_storage_provider = _resultStorageProvider;
        iexec_result_storage_proxy = _resultStorageProxy;
        iexec_args = _contentPath;
    }

    function generateParams(string calldata _contentPath) private view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '{"iexec_result_storage_provider":"',
                    iexec_result_storage_provider,
                    '","iexec_result_storage_proxy":"',
                    iexec_result_storage_proxy,
                    '","iexec_result_encryption":',
                    "true",
                    ',"iexec_args":"',
                    _contentPath,
                    '"}'
                )
            );
    }
}
