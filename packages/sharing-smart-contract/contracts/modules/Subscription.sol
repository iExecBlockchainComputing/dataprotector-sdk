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
    // collectionId => (ProtectedDataTokenId => ProtectedData)
    mapping(uint256 => mapping(uint160 => address)) public protectedDataInSubscription;
    // collectionId => (subscriberAddress => endTimestamp)
    mapping(uint256 => mapping(address => uint256)) public subscribers;
    // collectionId => subscriptionParams
    mapping(uint256 => SubscriptionParams) public subscriptionParams;

    struct SubscriptionParams {
        uint256 price;
        uint256 duration;
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
    // can subscribe for an illimited duration ?
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
        subscribers[_collectionId][msg.sender] = endDate;
        emit NewSubscription(msg.sender, endDate);
        return endDate;
    }

    // est ce que cette fonctions met toute la collection a la souscription ou 1 protectedData par une ????
    function setProtectedDataToSubscription(
        uint256 _collectionId,
        address _protectedData
    ) public onlyProtectedDataOwnByCollection(_collectionId, _protectedData) {
        protectedDataInSubscription[_collectionId][uint160(_protectedData)] = _protectedData;
    }

    function setSubscriptionParams(
        uint256 _collectionId,
        SubscriptionParams memory _subscriptionParams
    ) public onlyCollectionOwner(_collectionId) {
        subscriptionParams[_collectionId] = _subscriptionParams;
        emit NewSubscriptionParams(_subscriptionParams);
    }
}
