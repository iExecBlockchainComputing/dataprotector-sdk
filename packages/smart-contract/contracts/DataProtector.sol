// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2023 IEXEC BLOCKCHAIN TECH                                       *
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

pragma solidity ^0.8.19;
import "./interfaces/IDataProtector.sol";

contract DataProtector is IDataProtector {
    IDatasetRegistry public immutable registry;

    constructor(IDatasetRegistry _registry) {
        registry = _registry;
    }

    function createDatasetWithSchema(
        address _datasetOwner,
        string calldata _datasetName,
        string calldata _datasetSchema,
        bytes calldata _datasetMultiaddr,
        bytes32 _datasetChecksum
    ) external returns (IDataset) {
        IDataset dataset = registry.createDataset(
            _datasetOwner,
            _datasetName,
            _datasetMultiaddr,
            _datasetChecksum
        );
        emit DatasetSchema(dataset, _datasetSchema);
        return dataset;
    }
}
