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

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC721Receiver.sol";
import "./ManageOrders.sol";
import "./Store.sol";

contract ProtectedDataSharing is ERC721Burnable, ERC721Receiver, ManageOrders, AccessControl {
    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    constructor(
        IExecPocoDelegate _proxy,
        IDatasetRegistry _registry,
        address defaultAdmin
    ) ERC721("Collection", "CT") {
        m_pocoDelegate = _proxy;
        registry = _registry;
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    }

    /***************************************************************************
     *                        Modifiers                                        *
     ***************************************************************************/
    modifier onlyCollectionOwner(uint256 _collectionId) {
        require(msg.sender == ownerOf(_collectionId), "Not the collection's owner");
        _;
    }

    modifier onlyProtectedDataInCollection(uint256 _collectionId, address _protectedData) {
        require(
            protectedDatas[_collectionId][uint160(_protectedData)] != address(0),
            "ProtectedData is not in collection"
        );
        _;
    }

    modifier onlyCollectionNotSubscribed(uint256 _collectionId) {
        require(
            lastSubscriptionExpiration[_collectionId] < block.timestamp,
            "Collection subscribed"
        );
        _;
    }

    modifier onlyProtectedDataNotAvailableInSubscription(
        uint256 _collectionId,
        address _protectedData
    ) {
        require(
            protectedDataInSubscription[_collectionId][_protectedData] == false,
            "ProtectedData available for subscription"
        );
        _;
    }

    modifier onlyProtectedDataNotRented(address _protectedData) {
        require(lastRentalExpiration[_protectedData] < block.timestamp, "ProtectedData rented");
        _;
    }

    modifier onlyProtectedDataNotForRenting(uint256 _collectionId, address _protectedData) {
        require(
            protectedDataForRenting[_collectionId][_protectedData].inRenting == false,
            "ProtectedData available for renting"
        );
        _;
    }

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function consumeProtectedData(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        string calldata _contentPath
    ) external returns (bytes32) {
        // subscription : check protectedData is avaible in Subscription & subscriber endTimestamp > block.timestamp
        // renting : check protectedData rental for tenant endTimestamp > block.timestamp
        IexecLibOrders_v5.AppOrder memory appOrder = createAppOrder(
            _protectedData,
            _workerpoolOrder.workerpool
        );

        IexecLibOrders_v5.DatasetOrder memory datasetOrder = createDatasetOrder(
            _protectedData,
            _workerpoolOrder.workerpool
        );

        IexecLibOrders_v5.RequestOrder memory requestOrder = createRequestOrder(
            _protectedData,
            _workerpoolOrder.workerpool,
            _contentPath
        );

        bytes32 dealid = m_pocoDelegate.matchOrders(
            appOrder,
            datasetOrder,
            _workerpoolOrder,
            requestOrder
        );
        emit DealId(dealid);
        return dealid;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    fallback() external payable {
        revert();
    }

    receive() external payable {
        revert();
    }

    /***************************************************************************
     *                         Admin                                           *
     ***************************************************************************/
    // swap a protectedData from one collection to an other : only for ProtectedDataSharing contract
    function _adminSwapCollection(
        uint256 _collectionIdFrom,
        uint256 _collectionIdTo,
        address _protectedData
    ) private onlyOwner {
        delete protectedDatas[_collectionIdFrom][uint160(_protectedData)];
        emit RemoveProtectedDataFromCollection(_collectionIdFrom, _protectedData);
        protectedDatas[_collectionIdTo][uint160(_protectedData)] = _protectedData;
        emit AddProtectedDataToCollection(_collectionIdTo, _protectedData);
    }

    function _adminSafeTransferFrom(address _to, address _protectedData) private onlyOwner {
        registry.safeTransferFrom(address(this), _to, uint256(uint160(_protectedData)));
    }

    /***************************************************************************
     *                        Collection                                       *
     ***************************************************************************/
    function _safeMint(address to) private {
        uint256 tokenId = _nextCollectionId++;
        _safeMint(to, tokenId);
    }

    function createCollection() public returns (uint256) {
        uint256 tokenId = _nextCollectionId;
        _safeMint(msg.sender);
        return tokenId;
    }

    function removeCollection(uint256 _collectionId) public onlyCollectionOwner(_collectionId) {
        burn(_collectionId);
    }

    //protectedData's owner should approve this SC
    function addProtectedDataToCollection(
        uint256 _collectionId,
        address _protectedData
    ) public onlyCollectionOwner(_collectionId) {
        uint256 tokenId = uint256(uint160(_protectedData));
        require(registry.getApproved(tokenId) == address(this), "Collection Contract not approved");
        registry.safeTransferFrom(msg.sender, address(this), tokenId);
        protectedDatas[_collectionId][uint160(_protectedData)] = _protectedData;
        emit AddProtectedDataToCollection(_collectionId, _protectedData);
    }

    // TODO: Should check there is no subscription available and renting
    function removeProtectedDataFromCollection(
        uint256 _collectionId,
        address _protectedData
    ) public onlyCollectionOwner(_collectionId) {
        require(
            protectedDatas[_collectionId][uint160(_protectedData)] != address(0),
            "ProtectedData not in collection"
        );
        registry.safeTransferFrom(address(this), msg.sender, uint256(uint160(_protectedData)));
        delete protectedDatas[_collectionId][uint160(_protectedData)];
        emit RemoveProtectedDataFromCollection(_collectionId, _protectedData);
    }

    /***************************************************************************
     *                        Subscription                                     *
     ***************************************************************************/
    function subscribeTo(uint256 _collectionId) public payable returns (uint256) {
        require(subscriptionParams[_collectionId].duration > 0, "Subscription parameters not set");
        require(msg.value == subscriptionParams[_collectionId].price, "Wrong amount sent");
        uint48 endDate = uint48(block.timestamp) + subscriptionParams[_collectionId].duration;
        subscribers[_collectionId][msg.sender] = endDate;
        if (lastSubscriptionExpiration[_collectionId] < endDate) {
            lastSubscriptionExpiration[_collectionId] = endDate;
        }
        emit NewSubscription(_collectionId, msg.sender, endDate);
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
        SubscriptionParams memory _subscriptionParams
    ) public onlyCollectionOwner(_collectionId) {
        subscriptionParams[_collectionId] = _subscriptionParams;
        emit NewSubscriptionParams(_collectionId, _subscriptionParams);
    }

    /***************************************************************************
     *                        Rental                                           *
     ***************************************************************************/
    function rentProtectedData(uint256 _collectionId, address _protectedData) public payable {
        require(
            protectedDataForRenting[_collectionId][_protectedData].inRenting,
            "ProtectedData not available for renting"
        );
        require(
            protectedDataForRenting[_collectionId][_protectedData].price == msg.value,
            "Wrong amount sent"
        );
        uint48 endDate = uint48(block.timestamp) +
            protectedDataForRenting[_collectionId][_protectedData].duration;
        tenants[_collectionId][msg.sender] = endDate;
        if (lastRentalExpiration[_protectedData] < endDate) {
            lastRentalExpiration[_protectedData] = endDate;
        }
        emit NewRental(_collectionId, _protectedData, endDate);
    }

    function setProtectedDataToRenting(
        uint256 _collectionId,
        address _protectedData,
        uint112 _price,
        uint48 _duration
    ) public onlyProtectedDataInCollection(_collectionId, _protectedData) {
        require(_duration > 0, "Duration param invalide");
        protectedDataForRenting[_collectionId][_protectedData].inRenting = true;
        protectedDataForRenting[_collectionId][_protectedData].price = _price;
        protectedDataForRenting[_collectionId][_protectedData].duration = _duration;
        emit ProtectedDataAddedToRenting(_collectionId, _protectedData, _price, _duration);
    }

    // cannot be rented anymore, pending rental are still valid
    function removeProtectedDataFromRenting(
        uint256 _collectionId,
        address _protectedData
    ) public onlyProtectedDataInCollection(_collectionId, _protectedData) {
        protectedDataForRenting[_collectionId][_protectedData].inRenting = false;
        emit ProtectedDataRemovedFromRenting(_collectionId, _protectedData);
    }

    /***************************************************************************
     *                        Sale                                             *
     ***************************************************************************/
    function setProtectedDataForSale(
        uint256 _collectionId,
        address _protectedData,
        uint112 _price
    )
        public
        onlyProtectedDataInCollection(_collectionId, _protectedData)
        onlyProtectedDataNotAvailableInSubscription(_collectionId, _protectedData) // the data is not included in any subscription
        onlyProtectedDataNotForRenting(_collectionId, _protectedData) // no one can rent the data
        onlyProtectedDataNotRented(_protectedData) // wait for last rental expiration
    {
        protectedDataForSale[_collectionId][_protectedData].forSale = true;
        protectedDataForSale[_collectionId][_protectedData].price = _price;
        emit ProtectedDataAddedForSale(_collectionId, _protectedData, _price);
    }

    function removeProtectedDataForSale(
        uint256 _collectionId,
        address _protectedData
    ) public onlyProtectedDataInCollection(_collectionId, _protectedData) {
        protectedDataForSale[_collectionId][_protectedData].forSale = false;
        emit ProtectedDataRemovedFromSale(_collectionId, _protectedData);
    }

    function buyProtectedData(
        uint256 _collectionIdFrom,
        address _protectedData,
        uint256 _collectionIdTo
    ) public payable onlyCollectionOwner(_collectionIdTo) {
        require(
            protectedDataForSale[_collectionIdFrom][_protectedData].forSale,
            "ProtectedData not for sale"
        );
        require(
            protectedDataForSale[_collectionIdFrom][_protectedData].price == msg.value,
            "Wrong amount sent"
        );
        _adminSwapCollection(_collectionIdFrom, _collectionIdTo, _protectedData);
        delete protectedDataForSale[_collectionIdFrom][_protectedData];
        emit ProtectedDataSold(_collectionIdFrom, address(this), _protectedData);
    }

    function buyProtectedData(
        uint256 _collectionIdFrom,
        address _protectedData,
        address _to
    ) public payable {
        require(
            protectedDataForSale[_collectionIdFrom][_protectedData].forSale,
            "ProtectedData not for sale"
        );
        require(
            protectedDataForSale[_collectionIdFrom][_protectedData].price == msg.value,
            "Wrong amount sent"
        );
        delete protectedDataForSale[_collectionIdFrom][_protectedData];
        _adminSafeTransferFrom(_to, _protectedData);
        emit ProtectedDataSold(_collectionIdFrom, _to, _protectedData);
    }
}
