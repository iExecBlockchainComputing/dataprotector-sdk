// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC721} from "forge-std/interfaces/IERC721.sol";
import {Test} from "forge-std/Test.sol";
import {ISale} from "../../../contracts/DataProtectorSharing.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {GhostStorage} from "./GhostStorage.sol";
import {HandlerCollection} from "./HandlerCollection.sol";

contract HandlerSale is Test {
    // using EnumerableSet for EnumerableSet.AddressSet;

    // // ---------------------Global variables------------------------------------
    // GhostStorage private ghostStorage;

    // constructor(GhostStorage _ghostStorage) {
    //     ghostStorage = _ghostStorage;
    // }

    // function setProtectedDataForSale(uint256 protectedDataIdx, uint72 price) public {
    //     price = price % (1 gwei);

    //     uint256 length = protectedDatasInCollection.length();

    //     if (length == 0) {
    //         return;
    //     }

    //     protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
    //     address protectedData = protectedDatasInCollection.at(protectedDataIdx);

    //     (uint256 collection, , , , , ) = _dataProtectorSharing.protectedDataDetails(protectedData);
    //     address from = IERC721(address(_dataProtectorSharing)).ownerOf(collection);

    //     vm.startPrank(from);
    //     _dataProtectorSharing.setProtectedDataForSale(protectedData, price);

    //     protectedDatasAvailableForSale.add(protectedData);
    // }

    // function buyProtectedData(uint256 protectedDataIdx, uint256 userNo, uint256 userNo2) public {
    //     address buyer = address(uint160(userNo % 5) + 1);
    //     address beneficiary = address(uint160(userNo2 % 5) + 1);
    //     uint256 length = protectedDatasAvailableForSale.length();

    //     if (length == 0) {
    //         return;
    //     }

    //     protectedDataIdx = protectedDataIdx % length; // tokenIdx = random 0 ... length - 1
    //     address protectedData = protectedDatasAvailableForSale.at(protectedDataIdx);
    //     (, , , , , ISale.SellingParams memory sellingParams) = _dataProtectorSharing.protectedDataDetails(
    //         protectedData
    //     );

    //     vm.startPrank(buyer);
    //     vm.deal(buyer, sellingParams.price * (1 gwei));

    //     POCO_DELEGATE.approve(address(_dataProtectorSharing), sellingParams.price);
    //     POCO_DELEGATE.deposit{value: sellingParams.price * 1e9}();
    //     _dataProtectorSharing.buyProtectedData(protectedData, beneficiary, sellingParams.price);
    //     protectedDatasAvailableForSale.remove(protectedData);
    //     protectedDatasInCollection.remove(protectedData);
    //     protectedDatas.add(protectedData);

    //     (, , , , , sellingParams) = _dataProtectorSharing.protectedDataDetails(protectedData);
    //     assert(!sellingParams.isForSale);
    // }
}
