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

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IAddOnlyAppWhitelistRegistry} from "../interfaces/IAddOnlyAppWhitelistRegistry.sol";
import {AddOnlyAppWhitelist, IAddOnlyAppWhitelist} from "./AddOnlyAppWhitelist.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract AddOnlyAppWhitelistRegistry is IAddOnlyAppWhitelistRegistry, Initializable, ERC721Upgradeable {
    // ---------------------AddOnlyAppWhitelistRegistry state------------------------------------
    AddOnlyAppWhitelist public _implementationAddress;

    /***************************************************************************
     *                        Constructor                                      *
     **************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC721_init(
            "iExec DataProtectorSharing Application Whitelist Registry",
            "iExecDataProtectorSharingAddOnlyAppWhitelist"
        );
        _implementationAddress = new AddOnlyAppWhitelist();
    }

    /***************************************************************************
     *                        Functions                                        *
     **************************************************************************/
    function createAddOnlyAppWhitelist(address owner) external returns (IAddOnlyAppWhitelist) {
        address clone = Clones.clone(address(_implementationAddress));
        _safeMint(owner, uint256(uint160(clone)));
        return IAddOnlyAppWhitelist(clone);
    }

    function _isAuthorized(
        address owner,
        address spender,
        uint256 tokenId
    ) internal view virtual override returns (bool) {
        // super call will revert of tokenId does not exist
        return super._isAuthorized(owner, spender, tokenId) || uint256(uint160(spender)) == tokenId;
    }

    function isAuthorized(address spender, uint256 tokenId) public view returns (bool) {
        return _isAuthorized(ownerOf(tokenId), spender, tokenId);
    }
}
