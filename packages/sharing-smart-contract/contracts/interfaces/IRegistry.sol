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

pragma solidity ^0.8.23;

interface IRegistry {
    /**
     * Return the owner of the specified token ID.
     *
     * @param tokenId The ID of the token to query the owner for.
     * @return The address of the owner of the token.
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * Safely transfers the ownership of a given token ID to another address.
     *
     * @param from The current owner of the token.
     * @param to The new owner.
     * @param tokenId The token ID to transfer.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * Check if an ERC-721 protectedData is registered.
     *
     * @param _entry The protected data address to check for registration.
     * @return True if the address is registered, false otherwise.
     */
    function isRegistered(address _entry) external view returns (bool);

    /**
     * Approve another address to transfer the given token ID.
     *
     * @param to The address to grant approval to.
     * @param tokenId The token ID to be approved for transfer.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * Gets the approved address for a token ID, or zero if no address is set.
     *
     * @param tokenId The ID of the token to query.
     * @return The approved address for the given token ID, or zero if no approval is set.
     */
    function getApproved(uint256 tokenId) external view returns (address);
}
