// SPDX-License-Identifier: Apache-2.0

/**
 * ============================================================================
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
 * ============================================================================
 */
pragma solidity ^0.8.24;

import "./IAppWhitelist.sol";

interface IAppWhitelistRegistry {
    /**
     * Event emitted when a new AppWhitelist contract is created.
     *
     * @param appWhitelist - The address of the newly created AppWhitelist contract.
     * @param owner - The address of the owner of the new AppWhitelist contract.
     */
    event AppWhitelistCreated(address indexed appWhitelist, address owner);

    /**
     * Checks if an AppWhitelist contract is registered within the platform.
     * This function is essential for verifying the legitimacy and registration status
     * of an AppWhitelist, ensuring it is recognized and authorized by the platform.
     *
     * @param _appWhitelist - The AppWhitelist contract to check registration status for.
     * @return bool - True if the AppWhitelist is registered, false otherwise.
     */
    function isRegistered(IAppWhitelist _appWhitelist) external view returns (bool);

    /**
     * Creates a new AppWhitelist contract and registers it under the specified owner.
     * This function facilitates the dynamic creation and onboarding of new applications
     * into the platform's whitelist system, expanding the ecosystem.
     *
     * @param owner - The address that will own the newly created AppWhitelist contract.
     * @return AppWhitelist - The newly created and registered AppWhitelist contract.
     */
    function createAppWhitelist(address owner) external returns (IAppWhitelist);
}
