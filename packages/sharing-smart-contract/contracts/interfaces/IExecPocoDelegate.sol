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

import {IexecLibOrders_v5} from "../libs/IexecLibOrders_v5.sol";

interface IExecPocoDelegate {
    /**
     * Publish an on chain application order operation.
     *
     * @param operation The application order operation to be managed.
     */
    function manageAppOrder(IexecLibOrders_v5.AppOrderOperation calldata operation) external;

    /**
     * Publish an on chain dataset order operation.
     *
     * @param operation The dataset order operation to be managed.
     */
    function manageDatasetOrder(IexecLibOrders_v5.DatasetOrderOperation calldata operation) external;

    /**
     * Publish an on chain request order operation.
     *
     * @param operation The request order operation to be managed.
     */
    function manageRequestOrder(IexecLibOrders_v5.RequestOrderOperation calldata operation) external;

    /**
     * Matche orders to form a deal.
     *
     * @param appOrder The application order.
     * @param datasetOrder The dataset order.
     * @param workerpoolOrder The workerpool order.
     * @param requestOrder The request order.
     * @return The deal's unique identifier.
     */
    function matchOrders(
        IexecLibOrders_v5.AppOrder calldata appOrder,
        IexecLibOrders_v5.DatasetOrder calldata datasetOrder,
        IexecLibOrders_v5.WorkerpoolOrder calldata workerpoolOrder,
        IexecLibOrders_v5.RequestOrder calldata requestOrder
    ) external returns (bytes32);

    /**
     * Transfers tokens from sender's account to the specified recipient.
     *
     * @param sender The address of the spender.
     * @param recipient The address of the recipient.
     * @param amount The amount of tokens to transfer.
     * @return A boolean value indicating whether the transfer was successful.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @param owner The address of the account owning tokens.
     * @return The number of tokens owned by the specified address.
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * Allows a spender to withdraw from your account, multiple times, up to the value amount.
     * If this function is called again, it overwrites the current allowance with value.
     *
     * @param spender The address authorized to spend a certain amount of tokens on behalf of the msg.sender.
     * @param value The maximum amount of tokens that can be spent by the spender.
     * @return True if the approval was successful, otherwise false.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * Deposits a specified amount of tokens into the contract (ERC20 Satcked RLC).
     * The caller must ensure they have enough tokens and have approved the contract to spend
     * on their behalf.
     *
     * @return A boolean indicating whether the deposit was successful.
     */
    function deposit() external payable returns (bool);

    function approveAndCall(address spender, uint256 value, bytes calldata extraData) external returns (bool);
}
