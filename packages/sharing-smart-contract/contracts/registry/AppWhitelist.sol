// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2020 IEXEC BLOCKCHAIN TECH                                       *
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

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProtectedDataSharing.sol";
import "../interfaces/IAppWhitelist.sol";
import "../interfaces/IRegistry.sol";

contract AppWhitelist is IAppWhitelist, Ownable {
    // ---------------------AppWhitelist state------------------------------------
    IProtectedDataSharing internal immutable _protectedDataSharing;
    IRegistry internal immutable _appRegistry;
    mapping(address => bool) public appWhitelisted;

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(
        IProtectedDataSharing protectedDataSharing_,
        IRegistry appRegistry_,
        address _owner
    ) Ownable(_owner) {
        _appRegistry = appRegistry_;
        _protectedDataSharing = protectedDataSharing_;
    }

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function addApp(address _app) public onlyOwner {
        if (_appRegistry.ownerOf(uint256(uint160(_app))) != address(_protectedDataSharing)) {
            revert AppNotOwnByContract(_app);
        }
        appWhitelisted[_app] = true;
        emit NewAppAddedToAppWhitelist(_app, address(this));
    }

    // from IERC734, for matchOrder in POCO
    function keyHasPurpose(bytes32 _appAddress, uint256 _purpose) public view returns (bool) {
        (_purpose);
        return appWhitelisted[address(uint160(uint256(_appAddress)))];
    }
}
