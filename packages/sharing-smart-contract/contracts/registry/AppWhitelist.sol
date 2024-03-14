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

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IDataProtectorSharing.sol";
import "../interfaces/IAppWhitelist.sol";
import "../interfaces/IRegistry.sol";

contract AppWhitelist is IAppWhitelist, OwnableUpgradeable {
    // ---------------------AppWhitelist state------------------------------------
    IProtectedDataSharing internal _protectedDataSharing;
    IRegistry internal _appRegistry;
    mapping(address => bool) public appWhitelisted;

    /***************************************************************************
     *                        Constructor                                      *
     **************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IProtectedDataSharing protectedDataSharing_,
        IRegistry appRegistry_,
        address initialOwner
    ) public initializer {
        __Ownable_init(initialOwner);
        _appRegistry = appRegistry_;
        _protectedDataSharing = protectedDataSharing_;
    }

    /***************************************************************************
     *                        Functions                                        *
     **************************************************************************/
    function addApp(address _app) public onlyOwner {
        if (_appRegistry.ownerOf(uint256(uint160(_app))) != address(_protectedDataSharing)) {
            revert AppNotOwnByContract(_app);
        }
        appWhitelisted[_app] = true;
        emit NewAppAddedToAppWhitelist(_app);
    }
}
