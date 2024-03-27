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

import "hardhat/console.sol";

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
    ) internal view returns (bool isRented, bool isInSubscription) {
        // check voucherOwner == msg.sender
        // check voucher isAuthorized(this)
        ProtectedDataDetails storage _protectedDataDetails = protectedDataDetails[_protectedData];
        uint256 collectionTokenId = _protectedDataDetails.collection;
        isRented = _protectedDataDetails.renters[msg.sender] >= block.timestamp;
        isInSubscription =
            collectionTokenId != 0 &&
            _protectedDataDetails.inSubscription &&
            collectionDetails[collectionTokenId].subscribers[msg.sender] >= block.timestamp;

        if (!isRented && !isInSubscription) {
            revert NoValidRentalOrSubscription(collectionTokenId, _protectedData);
        }

        if (_workerpoolOrder.workerpoolprice > 0) {
            revert WorkerpoolOrderNotFree(_workerpoolOrder);
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
        (bool isRented, ) = _checkConsumeProtectedData(_protectedData, _workerpoolOrder);
        IexecLibOrders_v5.DatasetOrder memory _datasetOrder = _createDatasetOrder(
            _protectedData,
            address(protectedDataDetails[_protectedData].appWhitelist)
        ).order;

        IexecLibOrders_v5.AppOrder memory _appOrder = _createPreSignAppOrder(_app);
        IexecLibOrders_v5.RequestOrder memory requestOrder = _createPreSignRequestOrder(
            _protectedData,
            _app,
            _workerpoolOrder.workerpool,
            _workerpoolOrder.category,
            _contentPath
        );

        // if voucher ? voucher.matchOrder : pococDelegate.matchorder
        dealid = _pocoDelegate.matchOrders(
            _appOrder,
            _datasetOrder,
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
     * @param _appWhitelist The application whitelist that could consume the protected data.
     */
    function _swapCollection(
        uint256 _collectionTokenIdFrom,
        uint256 _collectionTokenIdTo,
        address _protectedData,
        IAppWhitelist _appWhitelist
    ) internal {
        protectedDataDetails[_protectedData].collection = _collectionTokenIdTo;
        protectedDataDetails[_protectedData].appWhitelist = _appWhitelist;
        collectionDetails[_collectionTokenIdFrom].size -= 1;
        collectionDetails[_collectionTokenIdTo].size += 1;
        emit ProtectedDataTransfer(
            _protectedData,
            _collectionTokenIdTo,
            _collectionTokenIdFrom,
            address(_appWhitelist)
        );
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
        return super._update(to, _collectionTokenId, auth);
    }

    function _isValidAmountSent(
        uint256 _expectedAmountNRLC,
        uint256 _receivedAmountWEI
    ) internal pure {
        if (1e9 * _expectedAmountNRLC != _receivedAmountWEI) {
            revert WrongAmountSent(_expectedAmountNRLC, _receivedAmountWEI);
        }
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

    receive() external payable {}

    fallback() external payable {}

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

        appWhitelistRegistry.ownerOf(uint256(uint160(address(IAppWhitelist(_appWhitelist)))));
        uint256 tokenId = uint256(uint160(_protectedData));
        _protectedDataRegistry.safeTransferFrom(msg.sender, address(this), tokenId);

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
        uint48 _duration
    ) public payable returns (uint48 endDate) {
        _isValidAmountSent(
            collectionDetails[_collectionTokenId].subscriptionParams.price,
            msg.value
        );
        endDate = _processSubscription(_collectionTokenId, _duration);

        Address.functionCallWithValue(
            address(_pocoDelegate),
            abi.encodeWithSignature("depositFor(address)", ownerOf(_collectionTokenId)),
            msg.value
        );
    }

    /// @inheritdoc ISubscription
    function subscribeToCollectionWithAccount(
        uint256 _collectionTokenId,
        uint48 _duration
    ) public returns (uint48 endDate) {
        uint256 price = collectionDetails[_collectionTokenId].subscriptionParams.price;
        endDate = _processSubscription(_collectionTokenId, _duration);

        bytes memory data = Address.functionCall(
            address(_pocoDelegate),
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                ownerOf(_collectionTokenId),
                price
            )
        );
        console.logBytes(data);
    }

    function _processSubscription(
        uint256 _collectionTokenId,
        uint48 _duration
    ) internal returns (uint48 endDate) {
        CollectionDetails storage _collectionDetails = collectionDetails[_collectionTokenId];
        if (
            _collectionDetails.subscriptionParams.duration == 0 ||
            _collectionDetails.subscriptionParams.duration != _duration
        ) {
            revert InvalidSubscriptionDuration(
                _collectionTokenId,
                _collectionDetails.subscriptionParams.duration
            );
        }

        // Limiting the subscription duration of the protectedData it's a security measure
        // to prevent indefinite access by end users. This is a security to protect the
        // protectedData of collectionOwner.
        endDate =
            uint48(block.timestamp) +
            collectionDetails[_collectionTokenId].subscriptionParams.duration;
        collectionDetails[_collectionTokenId].subscribers[msg.sender] = endDate;
        collectionDetails[_collectionTokenId].lastSubscriptionExpiration = uint48(
            Math.max(endDate, collectionDetails[_collectionTokenId].lastSubscriptionExpiration)
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
        delete collectionDetails[_collectionTokenId].subscriptionParams;
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
    function rentProtectedData(address _protectedData) public payable returns (uint48 endDate) {
        _isValidAmountSent(protectedDataDetails[_protectedData].rentingParams.price, msg.value);
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        endDate = _processRental(_protectedData);
        Address.functionCallWithValue(
            address(_pocoDelegate),
            abi.encodeWithSignature("depositFor(address)", ownerOf(_collectionTokenId)),
            msg.value
        );
    }

    /// @inheritdoc IRental
    function rentProtectedDataWithAccount(address _protectedData) public returns (uint48 endDate) {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        uint256 price = collectionDetails[_collectionTokenId].subscriptionParams.price;
        endDate = _processRental(_protectedData);
        Address.functionCall(
            address(_pocoDelegate),
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                ownerOf(_collectionTokenId),
                price
            )
        );
    }

    function _processRental(address _protectedData) internal returns (uint48 endDate) {
        if (protectedDataDetails[_protectedData].rentingParams.duration == 0) {
            revert ProtectedDataNotAvailableForRenting(_protectedData);
        }

        endDate =
            uint48(block.timestamp) +
            protectedDataDetails[_protectedData].rentingParams.duration;
        protectedDataDetails[_protectedData].renters[msg.sender] = endDate;
        // Limiting the rental duration of the protectedData it's a security measure to prevent indefinite access by end users.
        // This is a security to protect the protectedData of collectionOwner.
        protectedDataDetails[_protectedData].lastRentalExpiration = uint48(
            Math.max(endDate, protectedDataDetails[_protectedData].lastRentalExpiration)
        );
        emit NewRental(_protectedData, msg.sender, endDate);
    }

    /// @inheritdoc IRental
    function setProtectedDataToRenting(
        address _protectedData,
        uint64 _price,
        uint48 _duration
    ) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenId);
        _checkProtectedDataNotForSale(_protectedData);

        if (_duration == 0) {
            revert DurationInvalide(_duration);
        }
        protectedDataDetails[_protectedData].rentingParams.price = _price;
        protectedDataDetails[_protectedData].rentingParams.duration = _duration;
        emit ProtectedDataAddedForRenting(_collectionTokenId, _protectedData, _price, _duration);
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
    function buyProtectedDataForCollection(
        address _protectedData,
        uint256 _collectionTokenIdTo,
        IAppWhitelist _appWhitelist
    ) public payable {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _processBuyProtectedDataForCollection(_protectedData, _collectionTokenIdTo, _appWhitelist);
        Address.functionCallWithValue(
            address(_pocoDelegate),
            abi.encodeWithSignature("depositFor(address)", ownerOf(_collectionTokenId)),
            msg.value
        );
    }

    /// @inheritdoc ISale
    function buyProtectedDataForCollectionWithAccount(
        address _protectedData,
        uint256 _collectionTokenIdTo,
        IAppWhitelist _appWhitelist
    ) public payable {
        _isValidAmountSent(protectedDataDetails[_protectedData].sellingParams.price, msg.value);

        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        uint256 price = collectionDetails[_collectionTokenId].subscriptionParams.price;
        _processBuyProtectedDataForCollection(_protectedData, _collectionTokenIdTo, _appWhitelist);

        Address.functionCall(
            address(_pocoDelegate),
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                ownerOf(_collectionTokenId),
                price
            )
        );
    }

    function _processBuyProtectedDataForCollection(
        address _protectedData,
        uint256 _collectionTokenIdTo,
        IAppWhitelist _appWhitelist
    ) internal {
        uint256 _collectionTokenIdFrom = protectedDataDetails[_protectedData].collection;
        _checkCollectionOperator(_collectionTokenIdTo);
        _checkProtectedDataForSale(_protectedData);

        delete protectedDataDetails[_protectedData];
        _swapCollection(
            _collectionTokenIdFrom,
            _collectionTokenIdTo,
            _protectedData,
            _appWhitelist
        );
        protectedDataDetails[_protectedData].appWhitelist = _appWhitelist;
        emit ProtectedDataSold(_collectionTokenIdFrom, address(this), _protectedData);
    }

    /// @inheritdoc ISale
    function buyProtectedData(address _protectedData, address _to) public payable {
        _isValidAmountSent(protectedDataDetails[_protectedData].sellingParams.price, msg.value);

        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        _processBuyProtectedData(_protectedData, _to);

        Address.functionCallWithValue(
            address(_pocoDelegate),
            abi.encodeWithSignature("depositFor(address)", ownerOf(_collectionTokenId)),
            msg.value
        );
    }

    /// @inheritdoc ISale
    function buyProtectedDataWithAccount(address _protectedData, address _to) public {
        uint256 _collectionTokenId = protectedDataDetails[_protectedData].collection;
        uint256 price = collectionDetails[_collectionTokenId].subscriptionParams.price;
        _processBuyProtectedData(_protectedData, _to);

        Address.functionCall(
            address(_pocoDelegate),
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                ownerOf(_collectionTokenId),
                price
            )
        );
    }

    function _processBuyProtectedData(address _protectedData, address _to) internal {
        uint256 _collectionTokenIdFrom = protectedDataDetails[_protectedData].collection;
        _checkProtectedDataForSale(_protectedData);

        delete protectedDataDetails[_protectedData];
        _protectedDataRegistry.safeTransferFrom(
            address(this),
            _to,
            uint256(uint160(_protectedData))
        );
        emit ProtectedDataSold(_collectionTokenIdFrom, _to, _protectedData);
    }
}
