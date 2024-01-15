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

import "./modules/ConsumeProtectedData.sol";
import "./modules/Subscription.sol";

// This contract will own protectedData & the Dapp
contract ProtectedDataSharing is ConsumeProtectedData, Subscription {
    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(
        IExecPocoDelegate _proxy,
        IDatasetRegistry _registry
    ) ConsumeProtectedData(_proxy) Subscription(_registry) {}

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    fallback() external payable {
        revert();
    }

    receive() external payable {
        revert();
    }
}
