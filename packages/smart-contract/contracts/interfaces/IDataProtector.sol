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

pragma solidity ^0.8.29;

import "./IDatasetRegistry.sol";

interface IDataProtector {
    /**
     * Event emitted when new ProtectedData is created.
     *
     * @param dataset - The ID of ProtectedData (ERC721).
     * @param schema - The schema of the data containing in the ProtectedData created.
     */
    event DatasetSchema(IDataset indexed dataset, string schema);

    /**
     * Create a new protectedData.
     *
     * @param _datasetOwner - The owner of the ProtectedData.
     * @param _datasetName - The name of the ProtectedData (metadata).
     * @param _datasetSchema - The schema of the data containing in the ProtectedData
     * @param _datasetMultiaddr - The multiaddress of the ProtectedData.
     * @param _datasetChecksum -The checksum of the ProtectedData.
     * @return IDataset - The ProtcetedData instance created.
     */
    function createDatasetWithSchema(
        address _datasetOwner,
        string calldata _datasetName,
        string calldata _datasetSchema,
        bytes calldata _datasetMultiaddr,
        bytes32 _datasetChecksum
    ) external returns (IDataset);
}
