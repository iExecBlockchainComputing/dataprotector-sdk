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
import "../Store.sol";

contract Subscription is Store {
    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/
    event NewSubscriptionParams(SubscriptionParams subscriptionParams);
    event NewSubscription(address indexed subscriber, uint48 endDate);
    event AddProtectedDataForSubscription(uint256 _collectionId, address _protectedData);
    event RemoveProtectedDataFromSubscription(uint256 _collectionId, address _protectedData);

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function subscribeTo(uint256 _collectionId) public payable returns (uint256) {
        require(subscriptionParams[_collectionId].duration > 0, "Subscription parameters not set");
        require(msg.value == subscriptionParams[_collectionId].price, "Wrong amount sent");
        uint48 endDate = uint48(block.timestamp) + subscriptionParams[_collectionId].duration;
        subscribers[_collectionId][msg.sender] = endDate;
        if (lastSubscriptionExpiration[_collectionId] < endDate) {
            lastSubscriptionExpiration[_collectionId] = endDate;
        }
        emit NewSubscription(msg.sender, endDate);
        return endDate;
    }

    // set one protected data available in the subscription
    function setProtectedDataToSubscription(
        uint256 _collectionId,
        address _protectedData
    ) public onlyProtectedDataInCollection(_collectionId, _protectedData) {
        protectedDataInSubscription[_collectionId][_protectedData] = true;
        emit AddProtectedDataForSubscription(_collectionId, _protectedData);
    }

    // remove a protected data available in the subscription, subcribers cannot consume the protected data anymore
    function removeProtectedDataFromSubscription(
        uint256 _collectionId,
        address _protectedData
    )
        public
        onlyProtectedDataInCollection(_collectionId, _protectedData)
        onlyCollectionNotSubscribed(_collectionId)
    {
        protectedDataInSubscription[_collectionId][_protectedData] = false;
        emit RemoveProtectedDataFromSubscription(_collectionId, _protectedData);
    }

    function setSubscriptionParams(
        uint256 _collectionId,
        SubscriptionParams calldata _subscriptionParams
    ) public onlyCollectionOwner(_collectionId) {
        subscriptionParams[_collectionId] = _subscriptionParams;
        emit NewSubscriptionParams(_subscriptionParams);
    }
}
