// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2024-2025 IEXEC BLOCKCHAIN TECH                                       *
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

import {IexecLibOrders_v5} from "./interfaces/IPoCo.sol";
import {IPoCo} from "./interfaces/IPoCo.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
// eslint-disable-next-line quotes
abstract contract ManageOrders {
    using IexecLibOrders_v5 for IexecLibOrders_v5.OrderOperationEnum;
    using IexecLibOrders_v5 for IexecLibOrders_v5.AppOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.WorkerpoolOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.DatasetOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.RequestOrder;
    using IexecLibOrders_v5 for IexecLibOrders_v5.AppOrderOperation;
    using IexecLibOrders_v5 for IexecLibOrders_v5.DatasetOrderOperation;
    using IexecLibOrders_v5 for IexecLibOrders_v5.RequestOrderOperation;

    // ---------------------ManageOrders state----------------------------------
    IPoCo internal immutable POCO_DELEGATE;
    bytes32 internal constant TAG =
        0x0000000000000000000000000000000000000000000000000000000000000003; // [tee,scone]
    uint256 internal constant TRUST = 0; // No replication
    string internal _iexecResultStorageProvider;
    // This value is not used anymore but it must be kept
    // to not break deployed proxies when upgrading them.
    string internal _iexecResultStorageProxy;
    uint256 private _salt;

    /***************************************************************************
     *                        Constructor                                      *
     **************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address pocoAddress) {
        POCO_DELEGATE = IPoCo(pocoAddress);
    }

    /***************************************************************************
     *                        Functions                                        *
     **************************************************************************/
    function _createAppOrder(
        address _appAddress
    ) internal view returns (IexecLibOrders_v5.AppOrder memory) {
        //create AppOrderOperation
        return
            IexecLibOrders_v5.AppOrder({
                app: _appAddress,
                appprice: 0,
                volume: type(uint256).max,
                tag: TAG,
                datasetrestrict: address(0),
                workerpoolrestrict: address(0),
                requesterrestrict: address(this), // this
                salt: bytes32(0),
                sign: new bytes(0)
            });
    }

    function _createPreSignAppOrder(
        address _appAddress
    ) internal returns (IexecLibOrders_v5.AppOrder memory _appOrder) {
        _appOrder = _createAppOrder(_appAddress);
        // presign
        POCO_DELEGATE.manageAppOrder(
            IexecLibOrders_v5.AppOrderOperation({
                order: _appOrder,
                operation: IexecLibOrders_v5.OrderOperationEnum.SIGN, //OrderOperationEnum
                sign: new bytes(0)
            })
        );
    }

    function _createDatasetOrder(
        address _protectedData,
        address _appWhitelist
    ) internal view returns (IexecLibOrders_v5.DatasetOrder memory) {
        //create DatasetOrderOperation
        return
            IexecLibOrders_v5.DatasetOrder({
                dataset: _protectedData,
                datasetprice: 0,
                volume: type(uint256).max,
                tag: TAG,
                apprestrict: _appWhitelist,
                workerpoolrestrict: address(0),
                requesterrestrict: address(this),
                salt: bytes32(0),
                sign: new bytes(0)
            });
    }

    function _createPreSignDatasetOrder(
        address _protectedData,
        address _appWhitelist
    ) internal returns (IexecLibOrders_v5.DatasetOrder memory _datasetOrder) {
        _datasetOrder = _createDatasetOrder(_protectedData, _appWhitelist);
        // presign
        POCO_DELEGATE.manageDatasetOrder(
            IexecLibOrders_v5.DatasetOrderOperation({
                order: _datasetOrder,
                operation: IexecLibOrders_v5.OrderOperationEnum.SIGN, //OrderOperationEnum
                sign: new bytes(0)
            })
        );
    }

    function _createPreSignRequestOrder(
        address _protectedData,
        address _appAddress,
        address _workerpoolAddress,
        uint256 _category
    ) internal returns (IexecLibOrders_v5.RequestOrder memory) {
        //create RequestOrderOperation
        IexecLibOrders_v5.RequestOrderOperation memory requestOrderOperation = IexecLibOrders_v5
            .RequestOrderOperation({
                order: IexecLibOrders_v5.RequestOrder({
                    app: _appAddress, //address
                    appmaxprice: 0, //uint256
                    dataset: _protectedData, //address
                    datasetmaxprice: 0, //uint256
                    workerpool: _workerpoolAddress, //address
                    workerpoolmaxprice: 0, //uint256
                    requester: address(this), //address
                    volume: 1, //uint256
                    tag: TAG, //bytes32
                    category: _category, //uint256
                    trust: TRUST, //uint256
                    beneficiary: msg.sender, //address
                    callback: address(0), //address
                    params: generateParams(), //string
                    salt: getSalt(), //bytes32
                    sign: new bytes(0)
                }),
                operation: IexecLibOrders_v5.OrderOperationEnum.SIGN, //OrderOperationEnum
                sign: new bytes(0)
            });

        // presign
        POCO_DELEGATE.manageRequestOrder(requestOrderOperation);

        return requestOrderOperation.order;
    }

    function getSalt() private returns (bytes32) {
        return bytes32(++_salt);
    }

    function generateParams() private view returns (string memory) {
        return
            string.concat(
                // eslint-disable-next-line quotes
                '{"iexec_result_encryption":true', // solhint-disable-line quotes
                ',"iexec_result_storage_provider":"', // solhint-disable-line quotes
                _iexecResultStorageProvider,
                '"}' // solhint-disable-line quotes
            );
    }
}
