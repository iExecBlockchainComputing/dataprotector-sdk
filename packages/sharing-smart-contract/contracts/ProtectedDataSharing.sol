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
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IProtectedDataSharing.sol";
import "./interfaces/IAppWhitelistRegistry.sol";
import "./interfaces/IRegistry.sol";
import "./ManageOrders.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract ProtectedDataSharing is
    Initializable,
    ERC721Upgradeable,
    MulticallUpgradeable,
    ERC721Holder,
    ManageOrders,
    AccessControlUpgradeable,
    IProtectedDataSharing
{
    // ---------------------Collection state------------------------------------
    IRegistry internal immutable _protectedDataRegistry;
    IRegistry internal immutable _appRegistry;
    IAppWhitelistRegistry internal immutable _appWhitelistRegistry;
    uint256 private _nextCollectionTokenId;

    // userAddress => earning
    mapping(address => uint256) public earning;
    // protectedDataAddress => ProtectedDataDetails
    mapping(address => ProtectedDataDetails) public protectedDataDetails;
    // collectionTokenId => ProtectedDataDetails
    mapping(uint256 => CollectionDetails) public collectionDetails;

    /***************************************************************************
     *                        Constructor                                      *
     ***************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        IExecPocoDelegate _proxy,
        IRegistry appRegistry_,
        IRegistry protectedDataRegistry_,
        IAppWhitelistRegistry appWhitelistRegistry_
    ) ManageOrders(_proxy) {
        _disableInitializers();
        _appRegistry = appRegistry_;
        _protectedDataRegistry = protectedDataRegistry_;
        _appWhitelistRegistry = appWhitelistRegistry_;
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
    modifier onlyCollectionOperator(uint256 _collectionTokenId) {
        if (!_isAuthorized(ownerOf(_collectionTokenId), msg.sender, _collectionTokenId)) {
            revert NotCollectionOwner(_collectionTokenId);
        }
        _;
    }

    modifier onlyProtectedDataInCollection(uint256 _collectionTokenId, address _protectedData) {
        if (protectedDataDetails[_protectedData].collection == 0) {
            revert NoProtectedDataInCollection(_collectionTokenId, _protectedData);
        }
        _;
    }

    modifier onlyCollectionNotSubscribed(uint256 _collectionTokenId) {
        if (collectionDetails[_collectionTokenId].lastSubscriptionExpiration >= block.timestamp) {
            revert OnGoingCollectionSubscriptions(_collectionTokenId);
        }
        _;
    }

    modifier onlyProtectedDataNotRented(address _protectedData) {
        if (protectedDataDetails[_protectedData].lastRentalExpiration >= block.timestamp) {
            revert ProtectedDataCurrentlyBeingRented(_protectedData);
        }
        _;
    }

    modifier onlyProtectedDataNotForSale(address _protectedData) {
        if (protectedDataDetails[_protectedData].sellingParams.isForSale) {
            revert ProtectedDataForSale(_protectedData);
        }
        _;
    }

    modifier onlyProtectedDataForSale(address _protectedData) {
        if (!protectedDataDetails[_protectedData].sellingParams.isForSale) {
            revert ProtectedDataNotForSale(_protectedData);
        }
        _;
    }

    /***************************************************************************
     *                        Functions                                        *
     ***************************************************************************/
    function _verifyConsumePermissions(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        address _app
    ) private view returns (bool isRented, bool isInSubscription) {
        // check voucherOwner == msg.sender
        // check voucher isAuthorized(this)
        ProtectedDataDetails storage details = protectedDataDetails[_protectedData];
        uint256 collectionTokenId = details.collection;
        isRented = details.renters[msg.sender] >= block.timestamp;
        isInSubscription =
            collectionTokenId != 0 &&
            details.inSubscription &&
            collectionDetails[collectionTokenId].subscribers[msg.sender] >= block.timestamp;

        if (!isRented && !isInSubscription) {
            revert NoValidRentalOrSubscription(collectionTokenId, _protectedData);
        }

        AppWhitelist appWhitelist = details.appWhitelist;
        if (!appWhitelist.appWhitelisted(_app)) {
            revert AppNotWhitelistedForProtectedData(_app);
        }
        if (_workerpoolOrder.workerpoolprice > 0) {
            revert WorkerpoolOrderNotFree(_workerpoolOrder);
        }
    }

    /// @inheritdoc IProtectedDataSharing
    function consumeProtectedData(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        string calldata _contentPath,
        address _app
    ) external returns (bytes32) {
        (bool isRented, ) = _verifyConsumePermissions(
            _protectedData,
            _workerpoolOrder,
            _app
        );

        IexecLibOrders_v5.AppOrder memory appOrder = createAppOrder(
            _protectedData,
            _app,
            _workerpoolOrder.workerpool
        );
        IexecLibOrders_v5.DatasetOrder memory datasetOrder = createDatasetOrder(
            _protectedData,
            _app,
            _workerpoolOrder.workerpool
        );
        IexecLibOrders_v5.RequestOrder memory requestOrder = createRequestOrder(
            _protectedData,
            _app,
            _workerpoolOrder.workerpool,
            _workerpoolOrder.category,
            _contentPath
        );

        // if voucher ? voucher.matchOrder : pococDelegate.matchorder

        bytes32 dealid = _pocoDelegate.matchOrders(
            appOrder,
            datasetOrder,
            _workerpoolOrder,
            requestOrder
        );

        mode _mode = isRented ? mode.RENTING : mode.SUBSCRIPTION;

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
     * @param _appWhitelist The address of the application whitelist that could consume the protected data.
     */
    function _swapCollection(
        uint256 _collectionTokenIdFrom,
        uint256 _collectionTokenIdTo,
        address _protectedData,
        AppWhitelist _appWhitelist
    ) private {
        protectedDataDetails[_protectedData].collection = _collectionTokenIdTo;
        emit ProtectedDataTransfer(
            _protectedData,
            _collectionTokenIdTo,
            _collectionTokenIdFrom,
            address(_appWhitelist)
        );
    }

    /**
     * Safely transfers a protected data item to a specified address.
     * @param _to The address to which the protected data is being transferred.
     * @param _protectedData The address of the protected data being transferred.
     */
    function _safeTransferFrom(address _to, address _protectedData) private {
        _protectedDataRegistry.safeTransferFrom(
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

    /// @inheritdoc IProtectedDataSharing
    function withdraw() public {
        uint256 amount = earning[msg.sender];
        earning[msg.sender] = 0;

        Address.sendValue(payable(msg.sender), amount);
        emit Withdraw(msg.sender, amount);
    }

    /// @inheritdoc IProtectedDataSharing
    function getProtectedDataRenter(
        address _protectedData,
        address _renterAddress
    ) public view returns (uint48) {
        return protectedDataDetails[_protectedData].renters[_renterAddress];
    }

    /// @inheritdoc IProtectedDataSharing
    function getCollectionSubscriber(
        uint256 _collectionTokenId,
        address _subscriberAddress
    ) public view returns (uint48) {
        return collectionDetails[_collectionTokenId].subscribers[_subscriberAddress];
    }

    /***************************************************************************
     *                         Admin                                           *
     ***************************************************************************/
    function updateEnv(
        string memory iexec_result_storage_provider_,
        string memory iexec_result_storage_proxy_
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _iexec_result_storage_provider = iexec_result_storage_provider_;
        _iexec_result_storage_proxy = iexec_result_storage_proxy_;
    }

    /***************************************************************************
     *                        Collection                                       *
     ***************************************************************************/
    /// @inheritdoc ICollection
    function createCollection(address _to) public returns (uint256) {
        uint256 tokenId = ++_nextCollectionTokenId; // collection with tokenId 0 is forbiden
        _safeMint(_to, tokenId);
        return tokenId;
    }

    /// @inheritdoc ICollection
    function removeCollection(
        uint256 _collectionTokenId
    ) public onlyCollectionOperator(_collectionTokenId) {
        if (collectionDetails[_collectionTokenId].size > 0) {
            revert CollectionNotEmpty(_collectionTokenId);
        }
        _burn(_collectionTokenId);
    }

    /// @inheritdoc ICollection
    function addProtectedDataToCollection(
        uint256 _collectionTokenId,
        address _protectedData,
        AppWhitelist _appWhitelist
    ) public onlyCollectionOperator(_collectionTokenId) {
        uint256 tokenId = uint256(uint160(_protectedData));
        if (_protectedDataRegistry.getApproved(tokenId) != address(this)) {
            revert ERC721InsufficientApproval(address(this), uint256(uint160(_protectedData)));
        }
        if (!_appWhitelistRegistry.isRegistered(_appWhitelist)) {
            revert InvalidAppWhitelist(address(_appWhitelist));
        }
        protectedDataDetails[_protectedData].appWhitelist = _appWhitelist;
        _protectedDataRegistry.safeTransferFrom(msg.sender, address(this), tokenId);
        protectedDataDetails[_protectedData].collection = _collectionTokenId;
        collectionDetails[_collectionTokenId].size += 1;
        emit ProtectedDataTransfer(_protectedData, _collectionTokenId, 0, address(_appWhitelist));
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
        _protectedDataRegistry.safeTransferFrom(
            address(this),
            msg.sender,
            uint256(uint160(_protectedData))
        );
        delete protectedDataDetails[_protectedData];
        collectionDetails[_collectionTokenId].size -= 1;
        emit ProtectedDataTransfer(_protectedData, 0, _collectionTokenId, address(0));
    }

    /***************************************************************************
     *                        Subscription                                     *
     ***************************************************************************/
    /// @inheritdoc ISubscription
    function subscribeTo(uint256 _collectionTokenId) public payable returns (uint256) {
        if (collectionDetails[_collectionTokenId].subscriptionParams.duration == 0) {
            revert NoSubscriptionParams(_collectionTokenId);
        }
        _isValidAmountSent(
            collectionDetails[_collectionTokenId].subscriptionParams.price,
            msg.value
        );
        uint48 endDate = uint48(block.timestamp) +
            collectionDetails[_collectionTokenId].subscriptionParams.duration;
        collectionDetails[_collectionTokenId].subscribers[msg.sender] = endDate;
        if (collectionDetails[_collectionTokenId].lastSubscriptionExpiration < endDate) {
            collectionDetails[_collectionTokenId].lastSubscriptionExpiration = endDate;
        }
        earning[ownerOf(_collectionTokenId)] += msg.value;
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
        onlyProtectedDataNotForSale(_protectedData)
    {
        protectedDataDetails[_protectedData].inSubscription = true;
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
        protectedDataDetails[_protectedData].inSubscription = false;
        delete collectionDetails[_collectionTokenId].subscriptionParams;
        emit ProtectedDataRemovedFromSubscription(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISubscription
    function setSubscriptionParams(
        uint256 _collectionTokenId,
        SubscriptionParams calldata _subscriptionParams
    ) public onlyCollectionOperator(_collectionTokenId) {
        collectionDetails[_collectionTokenId].subscriptionParams = _subscriptionParams;
        emit NewSubscriptionParams(_collectionTokenId, _subscriptionParams);
    }

    /***************************************************************************
     *                        Rental                                           *
     ***************************************************************************/
    /// @inheritdoc IRental
    function rentProtectedData(uint256 _collectionTokenId, address _protectedData) public payable {
        if (protectedDataDetails[_protectedData].rentingParams.duration == 0) {
            revert ProtectedDataNotAvailableForRenting(_collectionTokenId, _protectedData);
        }
        _isValidAmountSent(protectedDataDetails[_protectedData].rentingParams.price, msg.value);
        uint48 endDate = uint48(block.timestamp) +
            protectedDataDetails[_protectedData].rentingParams.duration;
        protectedDataDetails[_protectedData].renters[msg.sender] = endDate;
        if (protectedDataDetails[_protectedData].lastRentalExpiration < endDate) {
            protectedDataDetails[_protectedData].lastRentalExpiration = endDate;
        }
        earning[ownerOf(_collectionTokenId)] += msg.value;
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
        onlyProtectedDataNotForSale(_protectedData)
    {
        if (_duration == 0) {
            revert DurationInvalide(_duration);
        }
        protectedDataDetails[_protectedData].rentingParams.price = _price;
        protectedDataDetails[_protectedData].rentingParams.duration = _duration;
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
        protectedDataDetails[_protectedData].rentingParams.duration = 0;
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
        if (protectedDataDetails[_protectedData].inSubscription) {
            revert ProtectedDataAvailableInSubscription(_collectionTokenId, _protectedData);
        }
        if (protectedDataDetails[_protectedData].rentingParams.duration > 0) {
            revert ProtectedDataAvailableForRenting(_collectionTokenId, _protectedData);
        }
        protectedDataDetails[_protectedData].sellingParams.isForSale = true;
        protectedDataDetails[_protectedData].sellingParams.price = _price;
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
        protectedDataDetails[_protectedData].sellingParams.isForSale = false;
        emit ProtectedDataRemovedFromSale(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISale
    function buyProtectedDataForCollection(
        uint256 _collectionTokenIdFrom,
        address _protectedData,
        uint256 _collectionTokenIdTo,
        AppWhitelist _appWhitelist
    )
        public
        payable
        onlyCollectionOperator(_collectionTokenIdTo)
        onlyProtectedDataForSale(_protectedData)
    {
        _isValidAmountSent(protectedDataDetails[_protectedData].sellingParams.price, msg.value);
        delete protectedDataDetails[_protectedData]; // is it very necessary ?
        _swapCollection(
            _collectionTokenIdFrom,
            _collectionTokenIdTo,
            _protectedData,
            _appWhitelist
        );
        protectedDataDetails[_protectedData].appWhitelist = _appWhitelist;
        earning[ownerOf(_collectionTokenIdFrom)] += msg.value;
        emit ProtectedDataSold(_collectionTokenIdFrom, address(this), _protectedData);
    }

    /// @inheritdoc ISale
    function buyProtectedData(
        uint256 _collectionTokenIdFrom,
        address _protectedData,
        address _to
    ) public payable onlyProtectedDataForSale(_protectedData) {
        _isValidAmountSent(protectedDataDetails[_protectedData].sellingParams.price, msg.value);
        delete protectedDataDetails[_protectedData];
        _safeTransferFrom(_to, _protectedData);
        earning[ownerOf(_collectionTokenIdFrom)] += msg.value;
        emit ProtectedDataSold(_collectionTokenIdFrom, _to, _protectedData);
    }
}
