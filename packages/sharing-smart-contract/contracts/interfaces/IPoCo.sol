// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2025 IEXEC BLOCKCHAIN TECH                                       *
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

import {IexecOrderManagement} from "@iexec/poco/contracts/modules/interfaces/IexecOrderManagement.v8.sol";
import {IexecPoco1} from "@iexec/poco/contracts/modules/interfaces/IexecPoco1.v8.sol";

interface IPoCo is IexecOrderManagement, IexecPoco1 {
    // Add missing functions where inheritance is not possible because
    // of different Solidity versions.

    // IexecEscrowNative
    function deposit() external payable returns (bool); // Native mode

    // TODO support both token and native modes.
    // IexecEscrowToken
    // function deposit(uint256) external returns (bool); // Token mode

    // IexecERC20
    function approve(address spender, uint256 amount) external returns (bool);
    function approveAndCall(
        address spender,
        uint256 value,
        bytes calldata extraData
    ) external returns (bool);
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}
