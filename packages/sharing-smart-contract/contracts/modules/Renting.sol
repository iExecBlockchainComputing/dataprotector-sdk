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
import "./Collection.sol";

contract Renting is Collection {
    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(IDatasetRegistry _registry) Collection(_registry) {}

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function setProtectedDataAsRentable(
        uint256 _collectionId,
        address _protectedData
    ) public onlyProtectedDataOwnByCollection(_collectionId, _protectedData) {}

    function removeProtectedDataAsRentable(
        uint256 _collectionId,
        address _protectedData
    ) public onlyProtectedDataOwnByCollection(_collectionId, _protectedData) {}
}
