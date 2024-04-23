pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DataProtectorSharing} from "../contracts/DataProtectorSharing.sol";
import {IExecPocoDelegate} from "../contracts/interfaces/IExecPocoDelegate.sol";
import {AddOnlyAppWhitelistRegistry} from "../contracts/registry/AddOnlyAppWhitelistRegistry.sol";
import {IRegistry} from "../contracts/interfaces/IRegistry.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

contract SupportsInterface is Test {
    DataProtectorSharing private _dataProtectorSharing;

    function setUp() external {
        _dataProtectorSharing = new DataProtectorSharing(
            IExecPocoDelegate(address(0)),
            IRegistry(address(0)),
            AddOnlyAppWhitelistRegistry(address(0))
        );
    }

    function testSupports721Interface() external view {
        assertTrue(_dataProtectorSharing.supportsInterface(type(IAccessControl).interfaceId));
    }

    function testSupportsAccessControlInterface() external view {
        assertTrue(_dataProtectorSharing.supportsInterface(type(IERC721).interfaceId));
        assertTrue(_dataProtectorSharing.supportsInterface(type(IERC721Metadata).interfaceId));
    }
}
