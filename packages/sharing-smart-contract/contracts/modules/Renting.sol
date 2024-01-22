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

contract Renting is Store {
    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/
    event ProtectedDataAddedToRenting(
        uint256 _collectionId,
        address _protectedData,
        uint112 _price,
        uint48 _duration
    );
    event ProtectedDataRemovedFromRenting(uint256 _collectionId, address _protectedData);

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function setProtectedDataToRenting(
        uint256 _collectionId,
        address _protectedData,
        uint112 _price,
        uint48 _duration
    ) public onlyProtectedDataInCollection(_collectionId, _protectedData) {
        protectedDataInRenting[_collectionId][_protectedData].inRenting = true;
        protectedDataInRenting[_collectionId][_protectedData].price = _price;
        protectedDataInRenting[_collectionId][_protectedData].duration = _duration;
        emit ProtectedDataAddedToRenting(_collectionId, _protectedData, _price, _duration);
    }

    function removeProtectedDataFromRenting(
        uint256 _collectionId,
        address _protectedData
    )
        public
        onlyProtectedDataInCollection(_collectionId, _protectedData)
        onlyProtectedDataNotForRent(_collectionId, _protectedData)
    {
        protectedDataInRenting[_collectionId][_protectedData].inRenting = false;
        emit ProtectedDataRemovedFromRenting(_collectionId, _protectedData);
    }
}
