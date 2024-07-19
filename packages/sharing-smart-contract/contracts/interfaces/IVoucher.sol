// SPDX-FileCopyrightText: 2024 IEXEC BLOCKCHAIN TECH <contact@iex.ec>
// SPDX-License-Identifier: Apache-2.0

import {IexecLibOrders_v5} from "../libs/IexecLibOrders_v5.sol";

pragma solidity ^0.8.20;

interface IVoucher {
    event AccountAuthorized(address indexed account);
    event AccountUnauthorized(address indexed account);
    event OrdersMatchedWithVoucher(bytes32 dealId);
    event OrdersBoostMatchedWithVoucher(bytes32 dealId);
    event TaskClaimedWithVoucher(bytes32 taskId);

    function authorizeAccount(address account) external;

    function unauthorizeAccount(address account) external;

    function matchOrders(
        IexecLibOrders_v5.AppOrder calldata appOrder,
        IexecLibOrders_v5.DatasetOrder calldata datasetOrder,
        IexecLibOrders_v5.WorkerpoolOrder calldata workerpoolOrder,
        IexecLibOrders_v5.RequestOrder calldata requestOrder
    ) external returns (bytes32);

    function matchOrdersBoost(
        IexecLibOrders_v5.AppOrder calldata appOrder,
        IexecLibOrders_v5.DatasetOrder calldata datasetOrder,
        IexecLibOrders_v5.WorkerpoolOrder calldata workerpoolOrder,
        IexecLibOrders_v5.RequestOrder calldata requestOrder
    ) external returns (bytes32);

    function claim(bytes32 taskId) external;

    function claimBoost(bytes32 dealId, uint256 taskIndex) external;

    function getVoucherHub() external view returns (address);

    function getType() external view returns (uint256);

    function getExpiration() external view returns (uint256);

    function getBalance() external view returns (uint256);

    function isAccountAuthorized(address account) external view returns (bool);

    function getSponsoredAmount(bytes32 dealId) external view returns (uint256);
}
