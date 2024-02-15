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

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./ManageOrders.sol";
import "./interface/IProtectedDataSharing.sol";
import "./interface/IRegistry.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract ProtectedDataSharing is
    Initializable,
    ERC721Upgradeable,
    ERC721Holder,
    ManageOrders,
    AccessControlUpgradeable,
    IProtectedDataSharing
{
    // ---------------------Collection state------------------------------------
    IRegistry private immutable protectedDataRegistry;
    IRegistry private immutable appRegistry;
    uint256 private _nextCollectionTokenId;
    //collectionTokenId => (ProtectedDataTokenId => ProtectedDataAddress)
    mapping(uint256 => mapping(uint160 => address)) public protectedDatas;
    // collectionTokenId => (protectedDataAddress: address => App:address)
    mapping(uint256 => mapping(address => address)) public appForProtectedData;
    // collectionTokenId => protectedtedDataNumber
    mapping(uint256 => uint256) public protectedDataInCollection;

    // ---------------------Subscription state----------------------------------
    // collectionTokenId => (protectedDataAddress: address => inSubscription: bool)
    mapping(uint256 => mapping(address => bool)) public protectedDataInSubscription;
    // collectionTokenId => (subscriberAddress => endTimestamp(48 bit for full timestamp))
    mapping(uint256 => mapping(address => uint48)) public subscribers;
    // collectionTokenId => subscriptionParams:  SubscriptionParams
    mapping(uint256 => SubscriptionParams) public subscriptionParams;
    // collectionTokenId => last subsciption end timestamp
    mapping(uint256 => uint48) public lastSubscriptionExpiration;

    // ---------------------Rental state----------------------------------
    // collectionTokenId => (protectedDataAddress: address => rentingParams: RentingParams)
    mapping(uint256 => mapping(address => RentingParams)) public protectedDataForRenting;
    // protectedData => (RenterAddress => endTimestamp(48 bit for full timestamp))
    mapping(address => mapping(address => uint48)) public renters;
    // protectedData => last rental end timestamp
    mapping(address => uint48) public lastRentalExpiration;

    // ---------------------Sale state----------------------------------
    // collectionTokenId => (protectedDataAddress: address => sellingParams: SellingParams)
    mapping(uint256 => mapping(address => SellingParams)) public protectedDataForSale;

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        IExecPocoDelegate _proxy,
        IRegistry _appRegistry,
        IRegistry _protectedDataRegistry
    ) {
        _disableInitializers();
        m_pocoDelegate = _proxy;
        appRegistry = _appRegistry;
        protectedDataRegistry = _protectedDataRegistry;
    }

    function initialize(address defaultAdmin) public initializer {
        __ERC721_init("Collection", "CT");
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        updateEnv("ipfs", "https://result.v8-bellecour.iex.ec");
    }

    /***************************************************************************
     *                        Modifiers                                        *
     ***************************************************************************/
    modifier onlyCollectionOwner(uint256 _collectionTokenId) {
        require(msg.sender == ownerOf(_collectionTokenId), "Not the collection's owner");
        _;
    }

    modifier onlyProtectedDataInCollection(uint256 _collectionTokenId, address _protectedData) {
        require(
            protectedDatas[_collectionTokenId][uint160(_protectedData)] != address(0),
            "ProtectedData is not in collection"
        );
        _;
    }

    modifier onlyCollectionNotSubscribed(uint256 _collectionTokenId) {
        require(
            lastSubscriptionExpiration[_collectionTokenId] < block.timestamp,
            "Collection has ongoing subscriptions"
        );
        _;
    }

    modifier onlyProtectedDataNotAvailableInSubscription(
        uint256 _collectionTokenId,
        address _protectedData
    ) {
        require(
            protectedDataInSubscription[_collectionTokenId][_protectedData] == false,
            "ProtectedData is available in subscription"
        );
        _;
    }

    modifier onlyProtectedDataNotRented(address _protectedData) {
        require(
            lastRentalExpiration[_protectedData] < block.timestamp,
            "ProtectedData is currently being rented"
        );
        _;
    }

    modifier onlyProtectedDataNotForRenting(uint256 _collectionTokenId, address _protectedData) {
        require(
            protectedDataForRenting[_collectionTokenId][_protectedData].isForRent == false,
            "ProtectedData available for renting"
        );
        _;
    }

    modifier onlyProtectedDataNotForSale(uint256 _collectionTokenId, address _protectedData) {
        require(
            protectedDataForSale[_collectionTokenId][_protectedData].isForSale == false,
            "ProtectedData for sale"
        );
        _;
    }

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function consumeProtectedData(
        uint256 _collectionTokenId,
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        string calldata _contentPath
    ) external returns (bytes32) {
        bool isRented = renters[_protectedData][msg.sender] > block.timestamp;
        require(
            isRented ||
                (protectedDataInSubscription[_collectionTokenId][_protectedData] &&
                    subscribers[_collectionTokenId][msg.sender] > block.timestamp),
            "No valid rental or subscription"
        );
        address appAddress = appForProtectedData[_collectionTokenId][_protectedData];
        require(
            appRegistry.ownerOf(uint256(uint160(appAddress))) == address(this),
            "ProtectedDataSharing contract doesn't own the app"
        );
        IexecLibOrders_v5.AppOrder memory appOrder = createAppOrder(
            _protectedData,
            appAddress,
            _workerpoolOrder.workerpool
        );
        IexecLibOrders_v5.DatasetOrder memory datasetOrder = createDatasetOrder(
            _protectedData,
            appAddress,
            _workerpoolOrder.workerpool
        );
        IexecLibOrders_v5.RequestOrder memory requestOrder = createRequestOrder(
            _protectedData,
            appAddress,
            _workerpoolOrder.workerpool,
            _workerpoolOrder.category,
            _contentPath
        );
        bytes32 dealid = m_pocoDelegate.matchOrders(
            appOrder,
            datasetOrder,
            _workerpoolOrder,
            requestOrder
        );
        mode _mode;
        if (isRented) {
            _mode = mode.RENTING;
        } else {
            _mode = mode.SUBSCRIPTION;
        }
        emit ProtectedDataConsumed(dealid, _protectedData, _mode);
        return dealid;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * Swaps a protected data ERC-721 token from one collection to another.
     * @param _collectionTokenIdFrom The ID of the collection from which the protected data is being transferred.
     * @param _collectionTokenIdTo The ID of the collection to which the protected data is being transferred.
     * @param _protectedData The address of the protected data being transferred.
     * @param _appAddress The address of the approved application to consume the protected data.
     */
    function _swapCollection(
        uint256 _collectionTokenIdFrom,
        uint256 _collectionTokenIdTo,
        address _protectedData,
        address _appAddress
    ) private {
        delete protectedDatas[_collectionTokenIdFrom][uint160(_protectedData)];
        emit ProtectedDataRemovedFromCollection(_collectionTokenIdFrom, _protectedData);
        protectedDatas[_collectionTokenIdTo][uint160(_protectedData)] = _protectedData;
        emit ProtectedDataAddedToCollection(_collectionTokenIdTo, _protectedData, _appAddress);
    }

    /**
     * Safely transfers a protected data item to a specified address.
     * @param _to The address to which the protected data is being transferred.
     * @param _protectedData The address of the protected data being transferred.
     */
    function _safeTransferFrom(address _to, address _protectedData) private {
        protectedDataRegistry.safeTransferFrom(
            address(this),
            _to,
            uint256(uint160(_protectedData))
        );
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
    function updateEnv(
        string memory _iexec_result_storage_provider,
        string memory _iexec_result_storage_proxy
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        iexec_result_storage_provider = _iexec_result_storage_provider;
        iexec_result_storage_proxy = _iexec_result_storage_proxy;
    }

    /***************************************************************************
     *                        Collection                                       *
     ***************************************************************************/
    function _safeMint(address to) private {
        uint256 tokenId = _nextCollectionTokenId++;
        _safeMint(to, tokenId);
    }

    /// @inheritdoc ICollection
    function createCollection() public returns (uint256) {
        uint256 tokenId = _nextCollectionTokenId;
        _safeMint(msg.sender);
        return tokenId;
    }

    /// @inheritdoc ICollection
    function removeCollection(
        uint256 _collectionTokenId
    ) public onlyCollectionOwner(_collectionTokenId) {
        require(protectedDataInCollection[_collectionTokenId] == 0, "Collection not empty");
        _burn(_collectionTokenId);
    }

    /// @inheritdoc ICollection
    function addProtectedDataToCollection(
        uint256 _collectionTokenId,
        address _protectedData,
        address _appAddress
    ) public onlyCollectionOwner(_collectionTokenId) {
        require(
            appRegistry.ownerOf(uint256(uint160(_appAddress))) == address(this),
            "App owner is not ProtectedDataSharing contract"
        );
        uint256 tokenId = uint256(uint160(_protectedData));
        require(
            protectedDataRegistry.getApproved(tokenId) == address(this),
            "ProtectedDataSharing Contract not approved"
        );
        appForProtectedData[_collectionTokenId][_protectedData] = _appAddress;
        protectedDataRegistry.safeTransferFrom(msg.sender, address(this), tokenId);
        protectedDatas[_collectionTokenId][uint160(_protectedData)] = _protectedData;
        protectedDataInCollection[_collectionTokenId] += 1;
        emit ProtectedDataAddedToCollection(_collectionTokenId, _protectedData, _appAddress);
    }

    /// @inheritdoc ICollection
    function removeProtectedDataFromCollection(
        uint256 _collectionTokenId,
        address _protectedData
    ) public onlyCollectionOwner(_collectionTokenId) onlyProtectedDataNotRented(_protectedData) {
        if (protectedDataInSubscription[_collectionTokenId][_protectedData]) {
            require(
                lastSubscriptionExpiration[_collectionTokenId] < block.timestamp,
                "Collection has ongoing subscriptions"
            );
        }
        require(
            protectedDatas[_collectionTokenId][uint160(_protectedData)] != address(0),
            "ProtectedData not in collection"
        );
        protectedDataRegistry.safeTransferFrom(
            address(this),
            msg.sender,
            uint256(uint160(_protectedData))
        );
        delete protectedDatas[_collectionTokenId][uint160(_protectedData)];
        delete appForProtectedData[_collectionTokenId][_protectedData];
        protectedDataInCollection[_collectionTokenId] -= 1;
        emit ProtectedDataRemovedFromCollection(_collectionTokenId, _protectedData);
    }

    /***************************************************************************
     *                        Subscription                                     *
     ***************************************************************************/
    /// @inheritdoc ISubscription
    function subscribeTo(uint256 _collectionTokenId) public payable returns (uint256) {
        require(
            subscriptionParams[_collectionTokenId].duration > 0,
            "Subscription parameters not set"
        );
        require(msg.value == subscriptionParams[_collectionTokenId].price, "Wrong amount sent");
        uint48 endDate = uint48(block.timestamp) + subscriptionParams[_collectionTokenId].duration;
        subscribers[_collectionTokenId][msg.sender] = endDate;
        if (lastSubscriptionExpiration[_collectionTokenId] < endDate) {
            lastSubscriptionExpiration[_collectionTokenId] = endDate;
        }
        emit NewSubscription(_collectionTokenId, msg.sender, endDate);
        return endDate;
    }

    /// @inheritdoc ISubscription
    function setProtectedDataToSubscription(
        uint256 _collectionTokenId,
        address _protectedData
    )
        public
        onlyCollectionOwner(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
        onlyProtectedDataNotForSale(_collectionTokenId, _protectedData)
    {
        protectedDataInSubscription[_collectionTokenId][_protectedData] = true;
        emit ProtectedDataAddedForSubscription(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISubscription
    function removeProtectedDataFromSubscription(
        uint256 _collectionTokenId,
        address _protectedData
    )
        public
        onlyCollectionOwner(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
        onlyCollectionNotSubscribed(_collectionTokenId)
    {
        protectedDataInSubscription[_collectionTokenId][_protectedData] = false;
        emit ProtectedDataRemovedFromSubscription(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISubscription
    function setSubscriptionParams(
        uint256 _collectionTokenId,
        SubscriptionParams calldata _subscriptionParams
    ) public onlyCollectionOwner(_collectionTokenId) {
        subscriptionParams[_collectionTokenId] = _subscriptionParams;
        emit NewSubscriptionParams(_collectionTokenId, _subscriptionParams);
    }

    /***************************************************************************
     *                        Rental                                           *
     ***************************************************************************/
    /// @inheritdoc IRental
    function rentProtectedData(uint256 _collectionTokenId, address _protectedData) public payable {
        require(
            protectedDataForRenting[_collectionTokenId][_protectedData].isForRent,
            "ProtectedData not available for renting"
        );
        require(
            protectedDataForRenting[_collectionTokenId][_protectedData].price == msg.value,
            "Wrong amount sent"
        );
        uint48 endDate = uint48(block.timestamp) +
            protectedDataForRenting[_collectionTokenId][_protectedData].duration;
        renters[_protectedData][msg.sender] = endDate;
        if (lastRentalExpiration[_protectedData] < endDate) {
            lastRentalExpiration[_protectedData] = endDate;
        }
        emit NewRental(_collectionTokenId, _protectedData, msg.sender, endDate);
    }

    /// @inheritdoc IRental
    function setProtectedDataToRenting(
        uint256 _collectionTokenId,
        address _protectedData,
        uint112 _price,
        uint48 _duration
    )
        public
        onlyCollectionOwner(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
        onlyProtectedDataNotForSale(_collectionTokenId, _protectedData)
    {
        require(_duration > 0, "Duration param invalide");
        protectedDataForRenting[_collectionTokenId][_protectedData].isForRent = true;
        protectedDataForRenting[_collectionTokenId][_protectedData].price = _price;
        protectedDataForRenting[_collectionTokenId][_protectedData].duration = _duration;
        emit ProtectedDataAddedForRenting(_collectionTokenId, _protectedData, _price, _duration);
    }

    /// @inheritdoc IRental
    function removeProtectedDataFromRenting(
        uint256 _collectionTokenId,
        address _protectedData
    )
        public
        onlyCollectionOwner(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
    {
        protectedDataForRenting[_collectionTokenId][_protectedData].isForRent = false;
        emit ProtectedDataRemovedFromRenting(_collectionTokenId, _protectedData);
    }

    /***************************************************************************
     *                        Sale                                             *
     ***************************************************************************/
    /// @inheritdoc ISale
    function setProtectedDataForSale(
        uint256 _collectionTokenId,
        address _protectedData,
        uint112 _price
    )
        public
        onlyCollectionOwner(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
        onlyProtectedDataNotAvailableInSubscription(_collectionTokenId, _protectedData) // the data is not included in any subscription
        onlyProtectedDataNotForRenting(_collectionTokenId, _protectedData) // no one can rent the data
        onlyProtectedDataNotRented(_protectedData) // wait for last rental expiration
    {
        protectedDataForSale[_collectionTokenId][_protectedData].isForSale = true;
        protectedDataForSale[_collectionTokenId][_protectedData].price = _price;
        emit ProtectedDataAddedForSale(_collectionTokenId, _protectedData, _price);
    }

    /// @inheritdoc ISale
    function removeProtectedDataForSale(
        uint256 _collectionTokenId,
        address _protectedData
    )
        public
        onlyCollectionOwner(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
    {
        protectedDataForSale[_collectionTokenId][_protectedData].isForSale = false;
        emit ProtectedDataRemovedFromSale(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISale
    function buyProtectedDataForCollection(
        uint256 _collectionTokenIdFrom,
        address _protectedData,
        uint256 _collectionTokenIdTo,
        address _appAddress
    ) public payable onlyCollectionOwner(_collectionTokenIdTo) {
        require(
            protectedDataForSale[_collectionTokenIdFrom][_protectedData].isForSale,
            "ProtectedData not for sale"
        );
        require(
            protectedDataForSale[_collectionTokenIdFrom][_protectedData].price == msg.value,
            "Wrong amount sent"
        );
        delete appForProtectedData[_collectionTokenIdFrom][_protectedData];
        appForProtectedData[_collectionTokenIdTo][_protectedData] = _appAddress;
        _swapCollection(_collectionTokenIdFrom, _collectionTokenIdTo, _protectedData, _appAddress);
        delete protectedDataForSale[_collectionTokenIdFrom][_protectedData];
        emit ProtectedDataSold(_collectionTokenIdFrom, address(this), _protectedData);
    }

    /// @inheritdoc ISale
    function buyProtectedData(
        uint256 _collectionTokenIdFrom,
        address _protectedData,
        address _to
    ) public payable {
        require(
            protectedDataForSale[_collectionTokenIdFrom][_protectedData].isForSale,
            "ProtectedData not for sale"
        );
        require(
            protectedDataForSale[_collectionTokenIdFrom][_protectedData].price == msg.value,
            "Wrong amount sent"
        );
        delete protectedDataForSale[_collectionTokenIdFrom][_protectedData];
        _safeTransferFrom(_to, _protectedData);
        emit ProtectedDataSold(_collectionTokenIdFrom, _to, _protectedData);
    }
}
