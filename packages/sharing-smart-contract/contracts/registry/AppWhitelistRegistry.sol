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

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../interfaces/IAppWhitelistRegistry.sol";
import "../interfaces/IProtectedDataSharing.sol";
import "../interfaces/IRegistry.sol";

contract AppWhitelistRegistry is IAppWhitelistRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;

    // ---------------------AppWhitelistRegistry state------------------------------------
    IProtectedDataSharing internal immutable _protectedDataSharing;
    IRegistry internal immutable _appRegistry;

    EnumerableSet.AddressSet private _registeredAppWhitelistSet;

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(IProtectedDataSharing protectedDataSharing_, IRegistry appRegistry_) {
        _appRegistry = appRegistry_;
        _protectedDataSharing = protectedDataSharing_;
    }

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function isRegistered(IAppWhitelist _appWhitelist) external view returns (bool) {
        return _registeredAppWhitelistSet.contains(address(_appWhitelist));
    }

    function createAppWhitelist(address owner) external returns (IAppWhitelist) {
        AppWhitelist newAppWhitelist = new AppWhitelist(_protectedDataSharing, _appRegistry, owner);
        _registeredAppWhitelistSet.add(address(newAppWhitelist));
        emit AppWhitelistCreated(address(newAppWhitelist), owner);
        return newAppWhitelist;
    }
}
