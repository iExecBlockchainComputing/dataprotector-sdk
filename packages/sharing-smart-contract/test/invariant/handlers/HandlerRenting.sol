// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {HandlerGlobal} from "./HandlerGlobal.sol";
import {IRental} from "../../../contracts/interfaces/IRental.sol";
import {ISale} from "../../../contracts/interfaces/ISale.sol";
import {DataProtectorSharing} from "../../../contracts/DataProtectorSharing.sol";

contract HandlerRenting is Test {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    // ---------------------Global variables------------------------------------
    HandlerGlobal private handlerGlobal;
    DataProtectorSharing private dataProtectorSharing;

    constructor(HandlerGlobal _handlerGlobal) {
        handlerGlobal = _handlerGlobal;
        dataProtectorSharing = _handlerGlobal.dataProtectorSharing();
    }

    function setProtectedDataToRenting(uint256 protectedDataIdx, uint72 price, uint40 duration) public {
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();
        price = price % (1 gwei);

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);

        (
            uint256 collection,
            ,
            ,
            ,
            IRental.RentingParams memory rentingParams,
            ISale.SellingParams memory sellingParams
        ) = dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);

        if (sellingParams.isForSale || rentingParams.duration == 0) {
            return;
        }

        vm.startPrank(from);
        dataProtectorSharing.setProtectedDataToRenting(protectedData, IRental.RentingParams(price, duration));
    }

    function removeProtectedDataFromRenting(uint256 protectedDataIdx) public {
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);

        (uint256 collection, , , , , ) = dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        dataProtectorSharing.removeProtectedDataFromRenting(protectedData);
    }

    function rentProtectedData(uint256 protectedDataIdx, uint256 userNo) public {
        uint256 length = handlerGlobal.protectedDatasInCollectionLength();
        address renter = address(uint160(userNo % 5) + 1);

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = handlerGlobal.protectedDatasInCollectionAt(protectedDataIdx);

        (, , , , IRental.RentingParams memory rentingParams, ) = dataProtectorSharing.protectedDataDetails(
            protectedData
        );

        if (rentingParams.duration == 0) {
            // Not available for renting
            return;
        }

        vm.startPrank(renter);
        vm.deal(renter, rentingParams.price * (1 gwei));

        handlerGlobal.POCO_DELEGATE().approve(address(dataProtectorSharing), rentingParams.price);
        handlerGlobal.POCO_DELEGATE().deposit{value: rentingParams.price * 1e9}();
        // if (endDate = uint48(block.timestamp) + _protectedDataDetails.rentingParams.duration)> type(uint48).max => it will revert
        dataProtectorSharing.rentProtectedData(protectedData, rentingParams);
    }
}
