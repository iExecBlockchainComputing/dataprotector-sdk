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

import {AddOnlyAppWhitelistRegistry} from "./AddOnlyAppWhitelistRegistry.sol";
import {IAddOnlyAppWhitelist} from "../interfaces/IAddOnlyAppWhitelist.sol";
import {ERC734} from "./ERC734.sol";

contract AddOnlyAppWhitelist is IAddOnlyAppWhitelist, ERC734 {
    AddOnlyAppWhitelistRegistry public immutable APP_WHITELIST_REGISTRY = AddOnlyAppWhitelistRegistry(msg.sender);

    // ---------------------AddOnlyAppWhitelist state------------------------------------
    uint256 internal constant GROUP_MEMBER_PURPOSE = 4;

    modifier onlyOperator() {
        if (!APP_WHITELIST_REGISTRY.isAuthorized(msg.sender, uint256(uint160(address(this))))) {
            revert NotAddOnlyAppWhitelistOperator();
        }
        _;
    }

    /***************************************************************************
     *                        Functions                                        *
     **************************************************************************/
    function addApp(address _app) public onlyOperator {
        _setKeyHasPurpose(bytes32(uint256(uint160(_app))), GROUP_MEMBER_PURPOSE, true);
        emit NewAppAddedToAddOnlyAppWhitelist(_app);
    }

    function isRegistered(address _app) public view returns (bool) {
        return keyHasPurpose(bytes32(uint256(uint160(_app))), GROUP_MEMBER_PURPOSE);
    }

    function owner() public view returns (address) {
        return APP_WHITELIST_REGISTRY.ownerOf(uint256(uint160(address(this))));
    }

    function transferOwnership(address newOwner) public onlyOperator {
        APP_WHITELIST_REGISTRY.transferFrom(owner(), newOwner, uint256(uint160(address(this))));
    }
}
