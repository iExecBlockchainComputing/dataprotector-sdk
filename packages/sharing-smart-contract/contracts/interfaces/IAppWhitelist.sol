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

interface IAppWhitelist {
    /**
     * Custom revert error indicating that the application is not owned by the contract.
     *
     * @param appAddress - The address added to the appWhitelist.
     */
    event NewAppAddedToAppWhitelist(address appAddress);

    /**
     * Custom revert error indicating that the application is not owned by the contract.
     *
     * @param appAddress - The address of the application that is not owned by the contract.
     */
    error AppNotOwnByContract(address appAddress);

    /**
     * Allow owner of the whitelist to add an app.
     *
     * @param _app - The address of the app to add.
     */
    function addApp(address _app) external;

    /**
     * Return true if the app is registered or not
     *
     * @param _app - The address of the app to add.
     */
    function isRegistered(address _app) external view returns (bool);
}
