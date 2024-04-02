// SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2024 IEXEC BLOCKCHAIN TECH                                       *
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
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IDataProtectorSharing.sol";
import "./registry/AppWhitelistRegistry.sol";
import "./registry/AppWhitelist.sol";
import "./interfaces/IRegistry.sol";
import "./ManageOrders.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract DataProtectorSharing is
    Initializable,
    ERC721BurnableUpgradeable,
    MulticallUpgradeable,
    ERC721Holder,
    ManageOrders,
    AccessControlUpgradeable,
    IProtectedDataSharing
{
    using Math for uint48;
    // ---------------------Collection state------------------------------------

    AppWhitelistRegistry public immutable appWhitelistRegistry;
    IRegistry internal immutable _protectedDataRegistry;
    uint256 private _nextCollectionTokenId;

    // userAddress => earning
    mapping(address => uint256) public earning;
    // protectedDataAddress => ProtectedDataDetails
    mapping(address => ProtectedDataDetails) public protectedDataDetails;
    // collectionTokenId => ProtectedDataDetails
    mapping(uint256 => CollectionDetails) public collectionDetails;
    // appAddress => AppOrder
    mapping(address => IexecLibOrders_v5.AppOrder) _appOrders;

    /***************************************************************************
     *                        Constructor                                      *
     **************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        IExecPocoDelegate _proxy,
        IRegistry protectedDataRegistry_,
        AppWhitelistRegistry appWhitelistRegistry_
    ) ManageOrders(_proxy) {
        _disableInitializers();
        _protectedDataRegistry = protectedDataRegistry_;
        appWhitelistRegistry = appWhitelistRegistry_;
    }

    function initialize() public initializer {
        __ERC721_init("iExec DataProtectorSharing", "iExecDataProtectorSharing");
        __ERC721Burnable_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        updateEnv("ipfs", "https://result.v8-bellecour.iex.ec");
    }

    /***************************************************************************
     *                        preflight check                                  *
     **************************************************************************/
    function _checkCollectionOperator(uint256 _collectionTokenId) internal view {
        if (!_isAuthorized(ownerOf(_collectionTokenId), msg.sender, _collectionTokenId)) {
            revert NotCollectionOwner(_collectionTokenId);
        }
    }

    function _checkCollectionNotSubscribed(uint256 _collectionTokenId) internal view {
        if (collectionDetails[_collectionTokenId].lastSubscriptionExpiration >= block.timestamp) {
            revert OnGoingCollectionSubscriptions(_collectionTokenId);
        }
    }

    function _checkProtectedDataNotRented(address _protectedData) internal view {
        if (protectedDataDetails[_protectedData].lastRentalExpiration >= block.timestamp) {
            revert ProtectedDataCurrentlyBeingRented(_protectedData);
        }
    }

    function _checkProtectedDataNotForSale(address _protectedData) internal view {
        if (protectedDataDetails[_protectedData].sellingParams.isForSale) {
            revert ProtectedDataForSale(_protectedData);
        }
    }

    function _checkProtectedDataForSale(address _protectedData) internal view {
        if (!protectedDataDetails[_protectedData].sellingParams.isForSale) {
            revert ProtectedDataNotForSale(_protectedData);
        }
    }

    function _checkConsumeProtectedData(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder
    ) internal view returns (mode) {
        if (_workerpoolOrder.workerpoolprice > 0) {
            revert WorkerpoolOrderNotFree(_workerpoolOrder);
        }

        // TODO: check voucherOwner == msg.sender
        // TODO: check voucher isAuthorized(this)
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 collectionTokenId = _protectedDataDetails.collection;
        if (_protectedDataDetails.renters[msg.sender] >= block.timestamp) {
            return mode.RENTING;
        } else if (
            collectionTokenId != 0 &&
            _protectedDataDetails.inSubscription &&
            collectionDetails[collectionTokenId].subscribers[msg.sender] >= block.timestamp
        ) {
            return mode.SUBSCRIPTION;
        } else {
            revert NoValidRentalOrSubscription(collectionTokenId, _protectedData);
        }
    }

    /***************************************************************************
     *                        Functions                                        *
     **************************************************************************/
    /// @inheritdoc IProtectedDataSharing
    function consumeProtectedData(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        string calldata _contentPath,
        address _app
    ) external returns (bytes32 dealid) {
        mode _mode = _checkConsumeProtectedData(_protectedData, _workerpoolOrder);
        IexecLibOrders_v5.DatasetOrder memory _datasetOrder = _createDatasetOrder(
            _protectedData,
            address(protectedDataDetails[_protectedData].appWhitelist)
        );

        IexecLibOrders_v5.AppOrder memory _appOrder = _createPreSignAppOrder(_app);
        IexecLibOrders_v5.RequestOrder memory requestOrder = _createPreSignRequestOrder(
            _protectedData,
            _app,
            _workerpoolOrder.workerpool,
            _workerpoolOrder.category,
            _contentPath
        );

        // TODO: if voucher ? voucher.matchOrder : pococDelegate.matchorder
        dealid = _pocoDelegate.matchOrders(
            _appOrder,
            _datasetOrder,
            _workerpoolOrder,
            requestOrder
        );

        emit ProtectedDataConsumed(dealid, _protectedData, _mode);
        return dealid;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Overide burn function from ERC721BurnableUpgradeable.
    // Enable to burn a collectionTokenID.
    function _update(
        address to,
        uint256 _collectionTokenId,
        address auth
    ) internal virtual override returns (address) {
        if (to == address(0) && collectionDetails[_collectionTokenId].size > 0) {
            revert CollectionNotEmpty(_collectionTokenId);
        }
        if (
            to == address(0) &&
            collectionDetails[_collectionTokenId].lastSubscriptionExpiration > block.timestamp
        ) {
            revert OnGoingCollectionSubscriptions(_collectionTokenId);
        }
        return super._update(to, _collectionTokenId, auth);
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
     **************************************************************************/
    function updateEnv(
        string memory iexec_result_storage_provider_,
        string memory iexec_result_storage_proxy_
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _iexec_result_storage_provider = iexec_result_storage_provider_;
        _iexec_result_storage_proxy = iexec_result_storage_proxy_;
    }

    /***************************************************************************
     *                        Collection                                       *
     **************************************************************************/
    /// @inheritdoc ICollection
    function createCollection(address _to) public returns (uint256) {
        uint256 tokenId = ++_nextCollectionTokenId; // collection with tokenId 0 is forbiden
        _safeMint(_to, tokenId);
        return tokenId;
    }

    /// @inheritdoc ICollection
    function addProtectedDataToCollection(
        uint256 _collectionTokenId,
        address _protectedData,
        IAppWhitelist _appWhitelist
    ) public {
        _checkCollectionOperator(_collectionTokenId);

        appWhitelistRegistry.ownerOf(uint256(uint160(address(_appWhitelist))));
        _protectedDataRegistry.safeTransferFrom(
            msg.sender,
            address(this),
            uint256(uint160(_protectedData))
        );

        protectedDataDetails[_protectedData].appWhitelist = _appWhitelist;
        protectedDataDetails[_protectedData].collection = _collectionTokenId;
        collectionDetails[_collectionTokenId].size += 1;

        _createPreSignDatasetOrder(_protectedData, address(_appWhitelist));
        emit ProtectedDataTransfer(_protectedData, _collectionTokenId, 0, address(_appWhitelist));
    }

    /// @inheritdoc ICollection
    function removeProtectedDataFromCollection(address _protectedData) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkCollectionNotSubscribed(_collectionTokenId);
        _checkProtectedDataNotRented(_protectedData);

        delete protectedDataDetails[_protectedData];
        collectionDetails[_collectionTokenId].size -= 1;
        _protectedDataRegistry.safeTransferFrom(
            address(this),
            msg.sender,
            uint256(uint160(_protectedData))
        );
        emit ProtectedDataTransfer(_protectedData, 0, _collectionTokenId, address(0));
    }

    /***************************************************************************
     *                        Subscription                                     *
     **************************************************************************/
    /// @inheritdoc ISubscription
    function subscribeToCollection(
        uint256 _collectionTokenId,
        SubscriptionParams calldata _subscriptionParams
    ) public returns (uint48 endDate) {
        CollectionDetails storage _collectionDetails = collectionDetails[_collectionTokenId];
        if (
            _collectionDetails.subscriptionParams.price != _subscriptionParams.price ||
            _collectionDetails.subscriptionParams.duration != _subscriptionParams.duration
        ) {
            revert InvalidSubscriptionParams(_collectionTokenId, _subscriptionParams);
        }

        // Limiting the subscription duration of the protectedData it's a security measure
        // to prevent indefinite access by end users. This is a security to protect the
        // protectedData of collectionOwner.
        endDate = uint48(block.timestamp) + _collectionDetails.subscriptionParams.duration;
        _collectionDetails.subscribers[msg.sender] = endDate;
        _collectionDetails.lastSubscriptionExpiration = uint48(
            Math.max(endDate, _collectionDetails.lastSubscriptionExpiration)
        );
        _pocoDelegate.transferFrom(
            msg.sender,
            ownerOf(_collectionTokenId),
            _collectionDetails.subscriptionParams.price
        );
        emit NewSubscription(_collectionTokenId, msg.sender, endDate);
    }

    /// @inheritdoc ISubscription
    function setProtectedDataToSubscription(address _protectedData) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataNotForSale(_protectedData);

        protectedDataDetails[_protectedData].inSubscription = true;
        emit ProtectedDataAddedForSubscription(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISubscription
    function removeProtectedDataFromSubscription(address _protectedData) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkCollectionNotSubscribed(_collectionTokenId);

        protectedDataDetails[_protectedData].inSubscription = false;
        emit ProtectedDataRemovedFromSubscription(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISubscription
    function setSubscriptionParams(
        uint256 _collectionTokenId,
        SubscriptionParams calldata _subscriptionParams
    ) public {
        _checkCollectionOperator(_collectionTokenId);

        collectionDetails[_collectionTokenId].subscriptionParams = _subscriptionParams;
        emit NewSubscriptionParams(_collectionTokenId, _subscriptionParams);
    }

    /***************************************************************************
     *                        Rental                                           *
     **************************************************************************/
    /// @inheritdoc IRental
    function rentProtectedData(
        address _protectedData,
        RentingParams calldata _rentingParams
    ) public returns (uint48 endDate) {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        if (_protectedDataDetails.rentingParams.duration == 0) {
            revert ProtectedDataNotAvailableForRenting(_protectedData);
        }
        if (
            _protectedDataDetails.rentingParams.duration != _rentingParams.duration ||
            _protectedDataDetails.rentingParams.price != _rentingParams.price
        ) {
            revert InvalidRentingParams(_protectedData, _rentingParams);
        }

        endDate = uint48(block.timestamp) + _protectedDataDetails.rentingParams.duration;
        _protectedDataDetails.renters[msg.sender] = endDate;
        // Limiting the rental duration of the protectedData it's a security measure to prevent indefinite access by end users.
        // This is a security to protect the protectedData of collectionOwner.
        _protectedDataDetails.lastRentalExpiration = uint48(
            Math.max(endDate, _protectedDataDetails.lastRentalExpiration)
        );

        _pocoDelegate.transferFrom(
            msg.sender,
            ownerOf(_protectedDataDetails.collection),
            _protectedDataDetails.rentingParams.price
        );
        emit NewRental(_protectedData, msg.sender, endDate);
    }

    /// @inheritdoc IRental
    function setProtectedDataToRenting(
        address _protectedData,
        RentingParams calldata _rentingParams
    ) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataNotForSale(_protectedData);

        if (_rentingParams.duration == 0) {
            revert DurationInvalide(_rentingParams.duration);
        }
        protectedDataDetails[_protectedData].rentingParams = _rentingParams;
        emit ProtectedDataAddedForRenting(_collectionTokenId, _protectedData, _rentingParams);
    }

    /// @inheritdoc IRental
    function removeProtectedDataFromRenting(address _protectedData) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);

        protectedDataDetails[_protectedData].rentingParams.duration = 0;
        emit ProtectedDataRemovedFromRenting(_collectionTokenId, _protectedData);
    }

    /***************************************************************************
     *                        Sale                                             *
     **************************************************************************/
    /// @inheritdoc ISale
    function setProtectedDataForSale(address _protectedData, uint64 _price) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataNotRented(_protectedData);

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
    function removeProtectedDataForSale(address _protectedData) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);

        protectedDataDetails[_protectedData].sellingParams.isForSale = false;
        emit ProtectedDataRemovedFromSale(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISale
    function buyProtectedData(address _protectedData, address _to, uint64 _price) public {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        _checkProtectedDataForSale(_protectedData);
        if (_protectedDataDetails.sellingParams.price != _price) {
            revert InvalidPriceForPurchase(_protectedData, _price);
        }

        _protectedDataRegistry.safeTransferFrom(
            address(this),
            _to,
            uint256(uint160(_protectedData))
        );

        _pocoDelegate.transferFrom(
            msg.sender,
            ownerOf(_protectedDataDetails.collection),
            _protectedDataDetails.sellingParams.price
        );
        delete protectedDataDetails[_protectedData];
        emit ProtectedDataSold(_protectedDataDetails.collection, _to, _protectedData);
    }
}
