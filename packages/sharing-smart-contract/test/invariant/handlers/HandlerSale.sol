// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {ISale} from "../../../contracts/DataProtectorSharing.sol";
import {IRental} from "../../../contracts/interfaces/IRental.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {GhostStorage} from "./GhostStorage.sol";
import {HandlerGlobal} from "./HandlerGlobal.sol";
import {DataProtectorSharing} from "../../../contracts/DataProtectorSharing.sol";

contract HandlerSale is Test {
    using EnumerableSet for EnumerableSet.AddressSet;

    // ---------------------Global variables------------------------------------
    HandlerGlobal private handlerGlobal;
    DataProtectorSharing private dataProtectorSharing;

    constructor(HandlerGlobal _handlerGlobal) {
        handlerGlobal = _handlerGlobal;
        dataProtectorSharing = _handlerGlobal.dataProtectorSharing();
    }

    function setProtectedDataForSale(uint256 protectedDataIdx, uint72 price) public {
        price = price % (1 gwei);

        uint256 length = handlerGlobal.protectedDatasInCollectionLength();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);

        (
            uint256 collection,
            ,
            uint48 lastRentalExpiration,
            bool inSubscription,
            IRental.RentingParams memory rentingParams,

        ) = dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);

        // check if the protectedData is already in subscription or rented
        if (inSubscription || rentingParams.duration > 0 || lastRentalExpiration >= block.timestamp) {
            return;
        }

        vm.startPrank(from);
        dataProtectorSharing.setProtectedDataForSale(protectedData, price);
    }

    function buyProtectedData(uint256 protectedDataIdx, uint256 userNo, uint256 userNo2) public {
        address buyer = address(uint160(userNo % 5) + 1);
        address beneficiary = address(uint160(userNo2 % 5) + 1);
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);
        (, , , , , ISale.SellingParams memory sellingParams) = dataProtectorSharing.protectedDataDetails(protectedData);

        if (!sellingParams.isForSale) {
            return;
        }

        vm.startPrank(buyer);
        vm.deal(buyer, sellingParams.price * (1 gwei));

        handlerGlobal.POCO_DELEGATE().approve(address(dataProtectorSharing), sellingParams.price);
        handlerGlobal.POCO_DELEGATE().deposit{value: sellingParams.price * 1e9}();
        dataProtectorSharing.buyProtectedData(protectedData, beneficiary, sellingParams.price);
        handlerGlobal.protectedDatasInCollectionRemove(protectedData);
        handlerGlobal.protectedDatasAdd(protectedData);

        (, , , , , sellingParams) = dataProtectorSharing.protectedDataDetails(protectedData);
        assert(!sellingParams.isForSale);
    }
}
