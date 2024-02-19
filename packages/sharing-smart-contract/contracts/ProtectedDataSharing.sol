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
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./ManageOrders.sol";
import "./interface/IProtectedDataSharing.sol";
import "./interface/IRegistry.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract ProtectedDataSharing is
    Initializable,
    ReentrancyGuardUpgradeable,
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

    // TODO: This should probably be used to replace many mappings
    // struct DataDetails {
    //     uint256                    collection,
    //     address                    app,
    //     bool                       inSubscription,
    //     uint48                     rentalExpiration,
    //     mapping(address => uint48) renters,
    //     RentingParams              rentingParams,
    //     SellingParams              sellingParams,
    // }
    // struct DataDetails {
    //     uint256                    size,
    //     uint48                     subscriptionExpiration,
    //     mapping(address => uint48) subscribers,
    //     SubscriptionParams         subscriptionParams,
    // }
    // mapping(address => DataDetails) internal dataDetails;
    // mapping(uint256 => CollectionDetails) internal collectionDetails;

    //collectionTokenId => (ProtectedDataTokenId => ProtectedDataAddress)
    mapping(uint256 => mapping(uint160 => address)) public protectedDatas;
    // collectionTokenId => (protectedDataAddress: address => App:address)
    mapping(uint256 => mapping(address => address)) public appForProtectedData;
    // collectionTokenId => protectedtedDataNumber
    mapping(uint256 => uint256) public protectedDataInCollection;
    // userAddresss => balances
    mapping(address => uint256) public balances; // TODO: name should be changed. This can be confused with ERC721.balanceOf.

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
    ) ManageOrders(_proxy) {
        _disableInitializers();
        appRegistry = _appRegistry;
        protectedDataRegistry = _protectedDataRegistry;
    }

    function initialize(address defaultAdmin) public initializer {
        __ERC721_init("Collection", "CT");
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        updateEnv("ipfs", "https://result.v8-bellecour.iex.ec");
    }

    /***************************************************************************
     *                        Modifiers                                        *
     ***************************************************************************/
    modifier onlyCollectionOperator(uint256 _collectionTokenId) {
        if (!_isAuthorized(ownerOf(_collectionTokenId), msg.sender, _collectionTokenId)) {
            revert NotCollectionOwner(_collectionTokenId);
        }
        _;
    }

    modifier onlyProtectedDataInCollection(uint256 _collectionTokenId, address _protectedData) {
        if (protectedDatas[_collectionTokenId][uint160(_protectedData)] == address(0)) {
            revert NoProtectedDataInCollection(_collectionTokenId, _protectedData);
        }
        _;
    }

    modifier onlyCollectionNotSubscribed(uint256 _collectionTokenId) {
        if (lastSubscriptionExpiration[_collectionTokenId] >= block.timestamp) {
            revert OnGoingCollectionSubscriptions(_collectionTokenId);
        }
        _;
    }

    modifier onlyProtectedDataNotRented(address _protectedData) {
        if (lastRentalExpiration[_protectedData] >= block.timestamp) {
            revert ProtectedDataCurrentlyBeingRented(_protectedData);
        }
        _;
    }

    modifier onlyProtectedDataNotForSale(uint256 _collectionTokenId, address _protectedData) {
        if (protectedDataForSale[_collectionTokenId][_protectedData].isForSale) {
            revert ProtectedDataForSale(_collectionTokenId, _protectedData);
        }
        _;
    }

    modifier onlyProtectedDataForSale(uint256 _collectionTokenId, address _protectedData) {
        if (!protectedDataForSale[_collectionTokenId][_protectedData].isForSale) {
            revert ProtectedDataNotForSale(_collectionTokenId, _protectedData);
        }
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
        bool isNotRented = renters[_protectedData][msg.sender] < block.timestamp;
        bool isNotInSub = !protectedDataInSubscription[_collectionTokenId][_protectedData] ||
            subscribers[_collectionTokenId][msg.sender] < block.timestamp;
        if (isNotRented && isNotInSub) {
            revert NoValidRentalOrSubscription(_collectionTokenId, _protectedData);
        }
        address appAddress = appForProtectedData[_collectionTokenId][_protectedData];
        if (appRegistry.ownerOf(uint256(uint160(appAddress))) != address(this)) {
            revert AppNotOwnByContract(appAddress);
        }
        if (_workerpoolOrder.workerpoolprice > 0) {
            revert WorkerpoolOrderNotFree(_workerpoolOrder);
        }
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
        if (isNotRented) {
            _mode = mode.SUBSCRIPTION;
        } else {
            _mode = mode.RENTING;
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

    function _isValidAmountSent(uint256 _expectedAmount, uint256 _receivedAmount) private pure {
        if (_expectedAmount != _receivedAmount) {
            revert WrongAmountSent(_expectedAmount, _receivedAmount);
        }
    }

    function withdraw() public nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds to withdraw");
        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed.");
        emit Whithdraw(msg.sender, amount);
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
    /// @inheritdoc ICollection
    function createCollection() public returns (uint256) {
        uint256 tokenId = ++_nextCollectionTokenId;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /// @inheritdoc ICollection
    function removeCollection(
        uint256 _collectionTokenId
    ) public onlyCollectionOperator(_collectionTokenId) {
        if (protectedDataInCollection[_collectionTokenId] > 0) {
            revert CollectionNotEmpty(_collectionTokenId);
        }
        _burn(_collectionTokenId);
    }

    /// @inheritdoc ICollection
    function addProtectedDataToCollection(
        uint256 _collectionTokenId,
        address _protectedData,
        address _appAddress
    ) public onlyCollectionOperator(_collectionTokenId) {
        if (appRegistry.ownerOf(uint256(uint160(_appAddress))) != address(this)) {
            revert AppNotOwnByContract(_appAddress);
        }
        uint256 tokenId = uint256(uint160(_protectedData));
        if (protectedDataRegistry.getApproved(tokenId) != address(this)) {
            revert ERC721InsufficientApproval(address(this), uint256(uint160(_protectedData)));
        }
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
    )
        public
        onlyCollectionOperator(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
        onlyCollectionNotSubscribed(_collectionTokenId)
        onlyProtectedDataNotRented(_protectedData)
    {
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
        if (subscriptionParams[_collectionTokenId].duration == 0) {
            revert NoSubscriptionParams(_collectionTokenId);
        }
        _isValidAmountSent(subscriptionParams[_collectionTokenId].price, msg.value);
        uint48 endDate = uint48(block.timestamp) + subscriptionParams[_collectionTokenId].duration;
        subscribers[_collectionTokenId][msg.sender] = endDate;
        if (lastSubscriptionExpiration[_collectionTokenId] < endDate) {
            lastSubscriptionExpiration[_collectionTokenId] = endDate;
        }
        balances[ownerOf(_collectionTokenId)] += msg.value;
        emit NewSubscription(_collectionTokenId, msg.sender, endDate);
        return endDate;
    }

    /// @inheritdoc ISubscription
    function setProtectedDataToSubscription(
        uint256 _collectionTokenId,
        address _protectedData
    )
        public
        onlyCollectionOperator(_collectionTokenId)
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
        onlyCollectionOperator(_collectionTokenId)
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
    ) public onlyCollectionOperator(_collectionTokenId) {
        subscriptionParams[_collectionTokenId] = _subscriptionParams;
        emit NewSubscriptionParams(_collectionTokenId, _subscriptionParams);
    }

    /***************************************************************************
     *                        Rental                                           *
     ***************************************************************************/
    /// @inheritdoc IRental
    function rentProtectedData(uint256 _collectionTokenId, address _protectedData) public payable {
        if (protectedDataForRenting[_collectionTokenId][_protectedData].duration == 0) {
            revert ProtectedDataNotAvailableForRenting(_collectionTokenId, _protectedData);
        }
        _isValidAmountSent(
            protectedDataForRenting[_collectionTokenId][_protectedData].price,
            msg.value
        );
        uint48 endDate = uint48(block.timestamp) +
            protectedDataForRenting[_collectionTokenId][_protectedData].duration;
        renters[_protectedData][msg.sender] = endDate;
        if (lastRentalExpiration[_protectedData] < endDate) {
            lastRentalExpiration[_protectedData] = endDate;
        }
        balances[ownerOf(_collectionTokenId)] += msg.value;
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
        onlyCollectionOperator(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
        onlyProtectedDataNotForSale(_collectionTokenId, _protectedData)
    {
        if (_duration == 0) {
            revert DurationInvalide(_duration);
        }
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
        onlyCollectionOperator(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
    {
        protectedDataForRenting[_collectionTokenId][_protectedData].duration = 0;
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
        onlyCollectionOperator(_collectionTokenId)
        onlyProtectedDataInCollection(_collectionTokenId, _protectedData)
        onlyProtectedDataNotRented(_protectedData) // wait for last rental expiration
    {
        if (protectedDataInSubscription[_collectionTokenId][_protectedData]) {
            revert ProtectedDataAvailableInSubscription(_collectionTokenId, _protectedData); // the data is not included in any subscription
        }
        if (protectedDataForRenting[_collectionTokenId][_protectedData].duration > 0) {
            revert ProtectedDataAvailableForRenting(_collectionTokenId, _protectedData); // no one can rent the data
        }
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
        onlyCollectionOperator(_collectionTokenId)
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
    )
        public
        payable
        onlyCollectionOperator(_collectionTokenIdTo)
        onlyProtectedDataForSale(_collectionTokenIdFrom, _protectedData)
    {
        _isValidAmountSent(
            protectedDataForSale[_collectionTokenIdFrom][_protectedData].price,
            msg.value
        );
        delete appForProtectedData[_collectionTokenIdFrom][_protectedData];
        appForProtectedData[_collectionTokenIdTo][_protectedData] = _appAddress;
        _swapCollection(_collectionTokenIdFrom, _collectionTokenIdTo, _protectedData, _appAddress);
        delete protectedDataForSale[_collectionTokenIdFrom][_protectedData];
        balances[ownerOf(_collectionTokenIdFrom)] += msg.value;
        emit ProtectedDataSold(_collectionTokenIdFrom, address(this), _protectedData);
    }

    /// @inheritdoc ISale
    function buyProtectedData(
        uint256 _collectionTokenIdFrom,
        address _protectedData,
        address _to
    ) public payable onlyProtectedDataForSale(_collectionTokenIdFrom, _protectedData) {
        _isValidAmountSent(
            protectedDataForSale[_collectionTokenIdFrom][_protectedData].price,
            msg.value
        );
        delete protectedDataForSale[_collectionTokenIdFrom][_protectedData];
        _safeTransferFrom(_to, _protectedData);
        balances[ownerOf(_collectionTokenIdFrom)] += msg.value;
        emit ProtectedDataSold(_collectionTokenIdFrom, _to, _protectedData);
    }
}
