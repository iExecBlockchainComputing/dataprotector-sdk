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

import "./Collection.sol";

contract Subscription is Collection {
    //contentCreatorId => subscriber
    mapping(uint256 => SubscriptionParams) public subscriptionParams;

    struct SubscriptionParams {
        uint256 price;
        uint256 duration;
    }

    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/
    event NewSubscriptionParams(SubscriptionParams subscriptionParams);

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(IDatasetRegistry _registry) Collection(_registry) {}

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function setSubscriptionParams(
        uint256 _collectionId,
        SubscriptionParams memory _subscriptionParams
    ) public onlyCollectionOwner(_collectionId) {
        subscriptionParams[_collectionId] = _subscriptionParams;
        emit NewSubscriptionParams(_subscriptionParams);
    }
}
