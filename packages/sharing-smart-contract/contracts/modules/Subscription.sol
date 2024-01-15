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
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "./Collection.sol";

contract Subscription is Collection {
    //contentCreatorId => subscriber
    mapping(uint256 => SubscriptionInfo) public subscriptionInfos;
    //contentCreatorId => subscriberParams
    mapping(uint256 => SubscriptionParams) public subscriptionParams;

    struct SubscriptionParams {
        uint256 price;
        uint256 duration;
    }
    struct SubscriptionInfo {
        address subscriber;
        uint256 endDate;
    }

    /***************************************************************************
     *                        event/modifier                                   *
     ***************************************************************************/
    event NewSubscriptionParams(SubscriptionParams subscriptionParams);
    event NewSubscription(address indexed subscriber, uint256 endDate);

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(IDatasetRegistry _registry) Collection(_registry) {}

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function subscribeTo(uint256 _collectionId) public payable returns (uint256) {
        require(subscriptionParams[_collectionId].duration > 0, "Subscription parameters not set");
        require(msg.value >= subscriptionParams[_collectionId].price, "Fund sent insufficient");

        uint256 extraFunds = msg.value % subscriptionParams[_collectionId].price;
        uint256 nbSubscription = msg.value / subscriptionParams[_collectionId].price;
        if (extraFunds > 0) {
            (bool success, ) = msg.sender.call{value: extraFunds}("");
            require(success, "Failed to send back extra funds");
        }
        uint256 endDate = block.timestamp +
            subscriptionParams[_collectionId].duration *
            nbSubscription;
        subscriptionInfos[_collectionId] = SubscriptionInfo(msg.sender, endDate);
        emit NewSubscription(msg.sender, endDate);
        return endDate;
    }

    function setCollectionToSubscription(
        uint256 _collectionId,
        address _protectedData
    )
        public
        onlyCollectionOwner(_collectionId)
        onlyProtectedDataOwnByCollection(_collectionId, _protectedData)
    {
        contents[_collectionId][uint160(_protectedData)].inSubscription = true;
    }

    function setSubscriptionParams(
        uint256 _collectionId,
        SubscriptionParams memory _subscriptionParams
    ) public onlyCollectionOwner(_collectionId) {
        subscriptionParams[_collectionId] = _subscriptionParams;
        emit NewSubscriptionParams(_subscriptionParams);
    }
}
