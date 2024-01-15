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

pragma solidity ^0.8.23;

interface IDatasetRegistry {
    // Returns the owner of a dataset with the given tokenId.
    function ownerOf(uint256 tokenId) external view returns (address);

    // Safely transfers a dataset from one address to another.
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    // Checks if a dataset is registered in the registry.
    function isRegistered(address _entry) external view returns (bool);

    // Approves another address to transfer a dataset with the given tokenId.
    function approve(address to, uint256 tokenId) external;

    // Returns the address approved to transfer a dataset with the given tokenId.
    function getApproved(uint256 tokenId) external view returns (address);
}
