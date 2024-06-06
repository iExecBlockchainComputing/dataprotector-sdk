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

import {ERC721BurnableUpgradeable, ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {MulticallUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IDataProtectorSharing, IexecLibOrders_v5, ICollection, ISubscription, IRental, ISale, IVoucher} from "./interfaces/IDataProtectorSharing.sol";
import {AddOnlyAppWhitelistRegistry, IAddOnlyAppWhitelist} from "./registry/AddOnlyAppWhitelistRegistry.sol";
import {ManageOrders, IExecPocoDelegate} from "./ManageOrders.sol";
import {IRegistry} from "./interfaces/IRegistry.sol";
import {IVoucherHub} from "./interfaces/IVoucherHub.sol";

/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract DataProtectorSharing is
    Initializable,
    ERC721BurnableUpgradeable,
    MulticallUpgradeable,
    ERC721Holder,
    ManageOrders,
    AccessControlUpgradeable,
    IDataProtectorSharing
{
    using Math for uint48;
    // ---------------------Collection state------------------------------------
    IVoucherHub internal immutable VOUCHER_HUB;
    AddOnlyAppWhitelistRegistry public immutable ADD_ONLY_APP_WHITELIST_REGISTRY;
    IRegistry internal immutable PROTECTED_DATA_REGISTRY;
    uint256 private _nextCollectionTokenId;

    // userAddress => earning
    mapping(address => uint256) public earning;
    // protectedDataAddress => ProtectedDataDetails
    mapping(address => ProtectedDataDetails) public protectedDataDetails;
    // collectionTokenId => ProtectedDataDetails
    mapping(uint256 => CollectionDetails) public collectionDetails;

    /***************************************************************************
     *                        Constructor                                      *
     **************************************************************************/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        IExecPocoDelegate _proxy,
        IRegistry protectedDataRegistry_,
        AddOnlyAppWhitelistRegistry addOnlyAppWhitelistRegistry_,
        IVoucherHub _voucherHub
    ) ManageOrders(_proxy) {
        _disableInitializers();
        PROTECTED_DATA_REGISTRY = protectedDataRegistry_;
        ADD_ONLY_APP_WHITELIST_REGISTRY = addOnlyAppWhitelistRegistry_;
        VOUCHER_HUB = _voucherHub;
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
            revert NotCollectionOperator(_collectionTokenId);
        }
    }

    function _checkProtectedDataOperator(address _protectedData) internal view {
        uint256 protectedDataTokenId = uint256(uint160(_protectedData));
        address owner = PROTECTED_DATA_REGISTRY.ownerOf(protectedDataTokenId);

        if (
            !(msg.sender == owner ||
                PROTECTED_DATA_REGISTRY.getApproved(protectedDataTokenId) == msg.sender ||
                PROTECTED_DATA_REGISTRY.isApprovedForAll(owner, msg.sender))
        ) {
            revert NotAnOwnerOrApprovedOperator();
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

    function _checkAndGetConsumeProtectedDataMode(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder
    ) internal view returns (Mode) {
        // TODO: Remove that => will be payant with Voucher
        if (_workerpoolOrder.workerpoolprice > 0) {
            revert WorkerpoolOrderNotFree(_workerpoolOrder);
        }

        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 collectionTokenId = _protectedDataDetails.collection;
        if (_protectedDataDetails.renters[msg.sender] >= block.timestamp) {
            return Mode.RENTING;
        } else if (
            collectionTokenId != 0 &&
            _protectedDataDetails.inSubscription &&
            collectionDetails[collectionTokenId].subscribers[msg.sender] >= block.timestamp
        ) {
            return Mode.SUBSCRIPTION;
        } else {
            revert NoValidRentalOrSubscription(collectionTokenId, _protectedData);
        }
    }

    /***************************************************************************
     *                        Functions                                        *
     **************************************************************************/
    /// @inheritdoc IDataProtectorSharing
    function consumeProtectedData(
        address _protectedData,
        IexecLibOrders_v5.WorkerpoolOrder calldata _workerpoolOrder,
        address _app,
        bool _useVoucher
    ) external returns (bytes32 dealid) {
        Mode _mode = _checkAndGetConsumeProtectedDataMode(_protectedData, _workerpoolOrder);
        IexecLibOrders_v5.DatasetOrder memory _datasetOrder = _createDatasetOrder(
            _protectedData,
            address(protectedDataDetails[_protectedData].addOnlyAppWhitelist)
        );
        IexecLibOrders_v5.AppOrder memory _appOrder = _createPreSignAppOrder(_app);
        IexecLibOrders_v5.RequestOrder memory requestOrder = _createPreSignRequestOrder(
            _protectedData,
            _app,
            _workerpoolOrder.workerpool,
            _workerpoolOrder.category
        );

        if (_useVoucher) {
            IVoucher _voucher = IVoucher(VOUCHER_HUB.getVoucher(msg.sender));
            if (_voucher.isAccountAuthorized(address(this))) {
                dealid = _voucher.matchOrders(_appOrder, _datasetOrder, _workerpoolOrder, requestOrder);
            }
            revert UnauthorizedVoucherAccess(_voucher);
        } else {
            dealid = POCO_DELEGATE.matchOrders(_appOrder, _datasetOrder, _workerpoolOrder, requestOrder);
        }
        emit ProtectedDataConsumed(dealid, _protectedData, _mode);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Overide burn function from ERC721BurnableUpgradeable.
    // Enable to burn a collectionTokenID.
    function _update(address to, uint256 _collectionTokenId, address auth) internal virtual override returns (address) {
        CollectionDetails storage _collectionDetails = collectionDetails[_collectionTokenId];
        if (to == address(0)) {
            if (_collectionDetails.size > 0) {
                revert CollectionNotEmpty(_collectionTokenId);
            }
            if (_collectionDetails.lastSubscriptionExpiration > block.timestamp) {
                revert OnGoingCollectionSubscriptions(_collectionTokenId);
            }
        }
        return super._update(to, _collectionTokenId, auth);
    }

    /// @inheritdoc IDataProtectorSharing
    function getProtectedDataRenter(address _protectedData, address _renterAddress) public view returns (uint48) {
        return protectedDataDetails[_protectedData].renters[_renterAddress];
    }

    /// @inheritdoc IDataProtectorSharing
    function getCollectionSubscriber(
        uint256 _collectionTokenId,
        address _subscriberAddress
    ) public view returns (uint48) {
        return collectionDetails[_collectionTokenId].subscribers[_subscriberAddress];
    }

    /// @inheritdoc IDataProtectorSharing
    function receiveApproval(address _sender, uint256, address, bytes calldata _extraData) public returns (bool) {
        if (msg.sender != address(POCO_DELEGATE)) {
            revert OnlyPocoCallerAuthorized(msg.sender);
        }
        if (_extraData.length == 0) {
            revert EmptyCallData();
        }
        bytes4 selector = bytes4(_extraData[:4]);

        if (selector == this.subscribeToCollection.selector) {
            (uint256 collectionTokenId, SubscriptionParams memory subscriptionParams) = abi.decode(
                _extraData[4:],
                (uint256, SubscriptionParams)
            );
            _subscribeToCollection(collectionTokenId, _sender, subscriptionParams);
            return true;
        } else if (selector == this.rentProtectedData.selector) {
            (address protectedData, RentingParams memory rentingParams) = abi.decode(
                _extraData[4:],
                (address, RentingParams)
            );
            _rentProtectedData(protectedData, _sender, rentingParams);
            return true;
        } else if (selector == this.buyProtectedData.selector) {
            (address protectedData, address to, uint72 price) = abi.decode(_extraData[4:], (address, address, uint72));
            _buyProtectedData(protectedData, _sender, to, price);
            return true;
        }

        return false;
    }

    /***************************************************************************
     *                         Admin                                           *
     **************************************************************************/
    function updateEnv(
        string memory iexecResultStorageProvider_,
        string memory iexecResultStorageProxy_
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _iexecResultStorageProvider = iexecResultStorageProvider_;
        _iexecResultStorageProxy = iexecResultStorageProxy_;
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
        IAddOnlyAppWhitelist _appWhitelist
    ) public {
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataOperator(_protectedData);

        ADD_ONLY_APP_WHITELIST_REGISTRY.ownerOf(uint256(uint160(address(_appWhitelist))));
        PROTECTED_DATA_REGISTRY.safeTransferFrom(
            PROTECTED_DATA_REGISTRY.ownerOf(uint256(uint160(_protectedData))),
            address(this),
            uint256(uint160(_protectedData))
        );
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        _protectedDataDetails.addOnlyAppWhitelist = _appWhitelist;
        _protectedDataDetails.collection = _collectionTokenId;
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
        PROTECTED_DATA_REGISTRY.safeTransferFrom(address(this), msg.sender, uint256(uint160(_protectedData)));
        emit ProtectedDataTransfer(_protectedData, 0, _collectionTokenId, address(0));
    }

    /***************************************************************************
     *                        Subscription                                     *
     **************************************************************************/
    /// @inheritdoc ISubscription
    function subscribeToCollection(
        uint256 _collectionTokenId,
        SubscriptionParams memory _subscriptionParams
    ) public returns (uint48 endDate) {
        return _subscribeToCollection(_collectionTokenId, msg.sender, _subscriptionParams);
    }

    function _subscribeToCollection(
        uint256 _collectionTokenId,
        address spender,
        SubscriptionParams memory _subscriptionParams
    ) private returns (uint48 endDate) {
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
        endDate = uint48(block.timestamp) + uint48(_collectionDetails.subscriptionParams.duration);
        _collectionDetails.subscribers[spender] = endDate;
        _collectionDetails.lastSubscriptionExpiration = uint48(
            Math.max(endDate, _collectionDetails.lastSubscriptionExpiration)
        );
        POCO_DELEGATE.transferFrom(spender, ownerOf(_collectionTokenId), _collectionDetails.subscriptionParams.price);
        emit NewSubscription(_collectionTokenId, spender, endDate);
    }

    /// @inheritdoc ISubscription
    function setProtectedDataToSubscription(address _protectedData) public {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 _collectionTokenId = _protectedDataDetails.collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataNotForSale(_protectedData);

        _protectedDataDetails.inSubscription = true;
        emit ProtectedDataAddedForSubscription(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISubscription
    function removeProtectedDataFromSubscription(address _protectedData) public {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 _collectionTokenId = _protectedDataDetails.collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkCollectionNotSubscribed(_collectionTokenId);

        _protectedDataDetails.inSubscription = false;
        emit ProtectedDataRemovedFromSubscription(_collectionTokenId, _protectedData);
    }

    /// @inheritdoc ISubscription
    function setSubscriptionParams(uint256 _collectionTokenId, SubscriptionParams calldata _subscriptionParams) public {
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
        RentingParams memory _rentingParams
    ) public returns (uint48 endDate) {
        return _rentProtectedData(_protectedData, msg.sender, _rentingParams);
    }

    function _rentProtectedData(
        address _protectedData,
        address spender,
        RentingParams memory _rentingParams
    ) private returns (uint48 endDate) {
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

        endDate = uint48(block.timestamp) + uint48(_protectedDataDetails.rentingParams.duration);
        _protectedDataDetails.renters[spender] = endDate;
        // Limiting the rental duration of the protectedData it's a security measure to prevent indefinite access by end users.
        // This is a security to protect the protectedData of collectionOwner.
        _protectedDataDetails.lastRentalExpiration = uint48(
            Math.max(endDate, _protectedDataDetails.lastRentalExpiration)
        );

        POCO_DELEGATE.transferFrom(
            spender,
            ownerOf(_protectedDataDetails.collection),
            _protectedDataDetails.rentingParams.price
        );
        emit NewRental(_protectedDataDetails.collection, _protectedData, spender, endDate);
    }

    /// @inheritdoc IRental
    function setProtectedDataToRenting(address _protectedData, RentingParams calldata _rentingParams) public {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 _collectionTokenId = _protectedDataDetails.collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataNotForSale(_protectedData);

        if (_rentingParams.duration == 0) {
            revert DurationInvalid(_rentingParams.duration);
        }
        _protectedDataDetails.rentingParams = _rentingParams;
        emit ProtectedDataAddedForRenting(_collectionTokenId, _protectedData, _rentingParams);
    }

    /// @inheritdoc IRental
    function removeProtectedDataFromRenting(address _protectedData) public {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 _collectionTokenId = _protectedDataDetails.collection;
        _checkCollectionOperator(_collectionTokenId);

        _protectedDataDetails.rentingParams.duration = 0;
        emit ProtectedDataRemovedFromRenting(_collectionTokenId, _protectedData);
    }

    /***************************************************************************
     *                        Sale                                             *
     **************************************************************************/
    /// @inheritdoc ISale
    function buyProtectedData(address _protectedData, address _to, uint72 _price) public {
        return _buyProtectedData(_protectedData, msg.sender, _to, _price);
    }

    function _buyProtectedData(address _protectedData, address spender, address _to, uint72 _price) private {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        _checkProtectedDataForSale(_protectedData);
        if (_protectedDataDetails.sellingParams.price != _price) {
            revert InvalidPriceForPurchase(_protectedData, _price);
        }

        PROTECTED_DATA_REGISTRY.safeTransferFrom(address(this), _to, uint256(uint160(_protectedData)));
        POCO_DELEGATE.transferFrom(
            spender,
            ownerOf(_protectedDataDetails.collection),
            _protectedDataDetails.sellingParams.price
        );
        emit ProtectedDataSold(_protectedDataDetails.collection, _to, _protectedData);
        delete protectedDataDetails[_protectedData];
    }

    /// @inheritdoc ISale
    function setProtectedDataForSale(address _protectedData, uint72 _price) public {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 _collectionTokenId = _protectedDataDetails.collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataNotRented(_protectedData);

        if (_protectedDataDetails.inSubscription) {
            revert ProtectedDataAvailableInSubscription(_collectionTokenId, _protectedData);
        }
        if (_protectedDataDetails.rentingParams.duration > 0) {
            revert ProtectedDataAvailableForRenting(_collectionTokenId, _protectedData);
        }
        _protectedDataDetails.sellingParams.isForSale = true;
        _protectedDataDetails.sellingParams.price = _price;
        emit ProtectedDataAddedForSale(_collectionTokenId, _protectedData, _price);
    }

    /// @inheritdoc ISale
    function removeProtectedDataForSale(address _protectedData) public {
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 _collectionTokenId = _protectedDataDetails.collection;
        _checkCollectionOperator(_collectionTokenId);

        _protectedDataDetails.sellingParams.isForSale = false;
        emit ProtectedDataRemovedFromSale(_collectionTokenId, _protectedData);
    }
}
