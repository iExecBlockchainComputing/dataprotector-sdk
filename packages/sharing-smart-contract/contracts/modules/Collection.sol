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

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "../interface/IDatasetRegistry.sol";
import "./ERC721Receiver.sol";

contract Collection is ERC721Burnable, ERC721Receiver {
    IDatasetRegistry public immutable registry;

    uint256 private _nextCollectionId;
    //contentCreatorId => (contentId => protectedDataAddress)
    mapping(uint256 => mapping(uint160 => address)) public contents;

    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/
    event AddProtectedDataToCollection(uint256 collectionId, address protectedData);
    event RemoveProtectedDataFromCollection(uint256 collectionId, address protectedData);

    modifier onlyCollectionOwner(uint256 _collectionId) {
        require(msg.sender == ownerOf(_collectionId), "Not the collection's owner");
        _;
    }

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(IDatasetRegistry _registry) ERC721("Collection", "CT") {
        registry = _registry;
    }

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/

    function _safeMint(address to) private {
        uint256 tokenId = _nextCollectionId++;
        _safeMint(to, tokenId);
    }

    function createCollection() public returns (uint256) {
        uint256 tokenId = _nextCollectionId;
        _safeMint(msg.sender);
        return tokenId;
    }

    function deleteCollection(uint256 _collectionId) public onlyCollectionOwner(_collectionId) {
        burn(_collectionId);
    }

    //protectedData's owner should approve this SC
    function addProtectedDataToCollection(
        uint256 _collectionId,
        address _protectedData
    ) public onlyCollectionOwner(_collectionId) {
        uint256 tokenId = uint256(uint160(_protectedData));
        require(registry.getApproved(tokenId) == address(this), "Collection Contract not approved");
        registry.safeTransferFrom(msg.sender, address(this), tokenId);
        contents[_collectionId][uint160(_protectedData)] = _protectedData;
        emit AddProtectedDataToCollection(_collectionId, _protectedData);
    }

    function removeProtectedDataFromCollection(
        uint256 _collectionId,
        address _protectedData
    ) public onlyCollectionOwner(_collectionId) {
        require(
            contents[_collectionId][uint160(_protectedData)] != address(0),
            "ProtectedData not in collection"
        );
        registry.safeTransferFrom(address(this), msg.sender, uint256(uint160(_protectedData)));
        delete contents[_collectionId][uint160(_protectedData)];
        emit RemoveProtectedDataFromCollection(_collectionId, _protectedData);
    }
}
