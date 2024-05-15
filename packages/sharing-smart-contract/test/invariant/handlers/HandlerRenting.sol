// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {HandlerCollection} from "./HandlerCollection.sol";
import {IRental} from "../../../contracts/interfaces/IRental.sol";

contract HandlerRenting is Test, HandlerCollection {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    function setProtectedDataToRenting(uint256 protectedDataIdx, uint72 price, uint48 duration) public {
        uint256 length = protectedDatasInCollection.length();
        price = price % (1 gwei);

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasInCollection.at(protectedDataIdx);

        (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.setProtectedDataToRenting(protectedData, IRental.RentingParams(price, duration));
        protectedDatasAvailableForRenting.add(protectedData);
    }

    function removeProtectedDataFromRenting(uint256 protectedDataIdx) public {
        uint256 length = protectedDatasInCollection.length();

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasInCollection.at(protectedDataIdx);

        (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(protectedData);
        address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

        vm.startPrank(from);
        _dataProtectorSharing.removeProtectedDataFromRenting(protectedData);
        protectedDatasAvailableForRenting.remove(protectedData);
    }

    function rentProtectedData(uint256 protectedDataIdx, uint256 userNo) public {
        uint256 length = protectedDatasInCollection.length();
        address renter = address(uint160(userNo % 5) + 1);

        if (length == 0) {
            return;
        }

        protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
        address protectedData = protectedDatasInCollection.at(protectedDataIdx);

        (, , , , IRental.RentingParams memory rentingParams, ) = _dataProtectorSharing.protectedDataDetails(
            protectedData
        );

        vm.startPrank(renter);
        vm.deal(renter, rentingParams.price * (1 gwei));

        POCO_DELEGATE.approve(address(_dataProtectorSharing), rentingParams.price);
        POCO_DELEGATE.deposit{value: rentingParams.price * 1e9}();
        _dataProtectorSharing.rentProtectedData(protectedData, rentingParams);
    }
}
