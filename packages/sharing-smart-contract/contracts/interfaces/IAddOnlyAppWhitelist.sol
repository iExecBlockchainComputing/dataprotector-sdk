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

interface IAddOnlyAppWhitelist {
    /**
     * Custom revert error indicating that the application is not owned by the contract.
     *
     * @param appAddress - The address added to the AddOnlyAppWhitelist.
     */
    event NewAppAddedToAddOnlyAppWhitelist(address appAddress);

    /**
     * Custom revert error indicating that the caller is not the autorized operator.
     *
     */
    error NotAddOnlyAppWhitelistOperator();

    /**
     * Allow operator of the whitelist can add an app.
     *
     * @param _app - The address of the app to add.
     */
    function addApp(address _app) external;

    /**
     * Return true if the app is registered or not in the AddOnlyAppWhitelist.
     *
     * @param _app - The address of the app to add.
     */
    function isRegistered(address _app) external view returns (bool);

    /**
     * Returns the address of the current owner.
     */
    function owner() external view returns (address);

    /**
     * Transfers ownership of the contract to a new address. Only the operator is allow to do that.
     *
     * @param newOwner - The address of the new owner.
     */
    function transferOwnership(address newOwner) external;
}
