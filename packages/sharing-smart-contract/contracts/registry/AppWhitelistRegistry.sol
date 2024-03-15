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

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../interfaces/IAppWhitelistRegistry.sol";
import "../interfaces/IRegistry.sol";
import "./AppWhitelist.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract AppWhitelistRegistry is IAppWhitelistRegistry, Initializable, ERC721Upgradeable {
    // ---------------------AppWhitelistRegistry state------------------------------------
    IRegistry internal immutable _appRegistry;
    IProtectedDataSharing internal _protectedDataSharing;
    AppWhitelist public immutable _implementationAddress = new AppWhitelist();

    /***************************************************************************
     *                        Constructor                                      *
     **************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(IRegistry appRegistry_) {
        _disableInitializers();
        _appRegistry = appRegistry_;
    }

    function initialize(IProtectedDataSharing protectedDataSharing_) public initializer {
        __ERC721_init("AppWhitelist", "AppWhitelist");
        _protectedDataSharing = protectedDataSharing_;
    }

    /***************************************************************************
     *                        Functions                                        *
     **************************************************************************/
    function createAppWhitelist(address owner) external returns (IAppWhitelist) {
        address clone = Clones.clone(address(_implementationAddress));
        AppWhitelist(clone).initialize(_protectedDataSharing, _appRegistry, owner); // Initialize the clone
        _safeMint(owner, uint256(uint160(clone)));
        emit AppWhitelistCreated(clone, owner);
        return IAppWhitelist(clone);
    }

    // Override safeTransferFrom to update the owner of the AppWhitelist contract 
    // on ERC721 token transfer
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        AppWhitelist(address(uint160(tokenId))).transferOwnership(to);
        safeTransferFrom(from, to, tokenId, data);
    }
}
