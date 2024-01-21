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

import "../Store.sol";

contract Sale is Store {
    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/
    event ProtectedDataAddedForSale(uint256 _collectionId, address _protectedData, uint112 _price);
    event ProtectedDataRemovedFromSale(uint256 _collectionId, address _protectedData);
    event ProtectedDataSold(
        uint256 _collectionIdFrom,
        uint256 _collectionIdTo,
        address _protectedData
    );

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function setProtectedDataForSale(
        uint256 _collectionId,
        address _protectedData,
        uint112 _price
    ) public onlyProtectedDataInCollection(_collectionId, _protectedData) {
        protectedDataForSale[_collectionId][_protectedData].inSaling = true;
        protectedDataForSale[_collectionId][_protectedData].price = _price;
        emit ProtectedDataAddedForSale(_collectionId, _protectedData, _price);
    }

    function removeProtectedDataForSale(
        uint256 _collectionId,
        address _protectedData
    ) public onlyProtectedDataInCollection(_collectionId, _protectedData) {
        protectedDataForSale[_collectionId][_protectedData].inSaling = false;
        emit ProtectedDataRemovedFromSale(_collectionId, _protectedData);
    }

    function buyProtectedData(
        uint256 _collectionIdFrom,
        uint256 _collectionIdTo,
        address _protectedData
    ) public payable onlyCollectionOwner(_collectionIdTo) {
        require(
            protectedDataForSale[_collectionIdFrom][_protectedData].inSaling,
            "ProtectedData not for sale"
        );
        require(
            protectedDataForSale[_collectionIdFrom][_protectedData].price == msg.value,
            "Wrong amount sent"
        );
        m_collection.swapCollection(
            _collectionIdFrom,
            _collectionIdTo,
            _protectedData
        );
        delete protectedDataForSale[_collectionIdFrom][_protectedData];
        emit ProtectedDataSold(_collectionIdFrom, _collectionIdTo, _protectedData);
    }
}
