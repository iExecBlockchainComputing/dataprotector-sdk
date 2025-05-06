// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2024-2025 IEXEC BLOCKCHAIN TECH                                       *
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

import {ERC721BurnableUpgradeable, ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {MulticallUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {DataProtectorSharing} from "../DataProtectorSharing.sol";
import {AddOnlyAppWhitelistRegistry, IAddOnlyAppWhitelist} from "../registry/AddOnlyAppWhitelistRegistry.sol";
import {IRegistry} from "../interfaces/IRegistry.sol";
import {ManageOrders} from "../ManageOrders.sol";

/**
 * @notice This contract is for upgradeability testing purposes only.
 */

contract DataProtectorSharingV2Mock is DataProtectorSharing {
    string public newStorage;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor()
        DataProtectorSharing(
            address(0),
            IRegistry(address(0)),
            AddOnlyAppWhitelistRegistry(address(0))
        )
    {}

    function initializeV2(string calldata foo) public reinitializer(2) {
        newStorage = foo;
    }
}
