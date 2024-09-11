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

import {BitMaps} from "@openzeppelin/contracts/utils/structs/BitMaps.sol";

contract ERC734 {
    using BitMaps for BitMaps.BitMap;
    mapping(bytes32 => BitMaps.BitMap) internal _store;

    // should respect the Poco interface & be public
    function keyHasPurpose(bytes32 key, uint256 purpose) public view returns (bool) {
        return _store[key].get(purpose);
    }

    function _setKeyHasPurpose(bytes32 key, uint256 purpose, bool enable) internal {
        _store[key].setTo(purpose, enable);
    }
}
