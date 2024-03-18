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

import "./IDataProtectorSharing.sol";
import "./IAppWhitelist.sol";

interface IAppWhitelistRegistry {
    /**
     * Creates a new AppWhitelist contract and registers it under the specified owner.
     * This function facilitates the dynamic creation and onboarding of new applications
     * into the platform's whitelist system, expanding the ecosystem.
     *
     * @param owner - The address that will own the newly created AppWhitelist contract.
     * @return IAppWhitelist - The newly created and registered AppWhitelist contract.
     */
    function createAppWhitelist(address owner) external returns (IAppWhitelist);
}
