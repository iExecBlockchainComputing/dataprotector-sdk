// SPDX-FileCopyrightText: 2024 IEXEC BLOCKCHAIN TECH <contact@iex.ec>
// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.20;

interface IVoucherHub {
    struct VoucherType {
        string description;
        uint256 duration;
    }
    event VoucherCreated(
        address indexed voucher,
        address owner,
        uint256 expiration,
        uint256 voucherType,
        uint256 value
    );
    event VoucherDebited(address indexed voucher, uint256 sponsoredAmount);
    event VoucherRefunded(address indexed voucher, uint256 amount);
    event VoucherTypeCreated(uint256 indexed id, string description, uint256 duration);
    event VoucherTypeDescriptionUpdated(uint256 indexed id, string description);
    event VoucherTypeDurationUpdated(uint256 indexed id, uint256 duration);
    event EligibleAssetAdded(uint256 indexed id, address asset);
    event EligibleAssetRemoved(uint256 indexed id, address asset);

    function createVoucherType(string memory description, uint256 duration) external;

    function updateVoucherTypeDescription(uint256 id, string memory description) external;

    function updateVoucherTypeDuration(uint256 id, uint256 duration) external;

    function addEligibleAsset(uint256 voucherTypeId, address asset) external;

    function removeEligibleAsset(uint256 voucherTypeId, address asset) external;

    function createVoucher(address owner, uint256 voucherType, uint256 value) external returns (address voucherAddress);

    function debitVoucher(
        uint256 voucherTypeId,
        address app,
        uint256 appPrice,
        address dataset,
        uint256 datasetPrice,
        address workerpool,
        uint256 workerpoolPrice,
        uint256 volume
    ) external returns (uint256 sponsoredAmount);

    function refundVoucher(uint256 amount) external;

    function getIexecPoco() external view returns (address);

    function getVoucherBeacon() external view returns (address);

    function getVoucherType(uint256 id) external view returns (VoucherType memory);

    function getVoucherTypeCount() external view returns (uint256);

    function isAssetEligibleToMatchOrdersSponsoring(uint256 voucherTypeId, address asset) external view returns (bool);

    function getVoucher(address account) external view returns (address);
}
