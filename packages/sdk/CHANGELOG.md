# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0-beta.18](https://github.com/iExecBlockchainComputing/dataprotector-sdk/compare/dataprotector-v2.0.0-beta.17...dataprotector-v2.0.0-beta.18) (2025-07-29)


### Changed

* Add admin address input to initialize function in ABI ([#473](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/473)) ([74870fe](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/74870feb37c606894bdfaff29165cff3775dd6fd))
* **sdk:** move to latest arbitrum-sepolia-testnet deployment ([#476](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/476)) ([bf5fcfb](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/bf5fcfb4c5ec5fd75eed7091519d5c80ca64c7f3))

## [2.0.0-beta.17](https://github.com/iExecBlockchainComputing/dataprotector-sdk/compare/dataprotector-v2.0.0-beta.16...dataprotector-v2.0.0-beta.17) (2025-07-08)


### ⚠ BREAKING CHANGES

* **sharing:** Remove result proxy address from sharing contract config and matched deal ([#438](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/438))

### Added

* **sdk:** add arweave uploadMode option ([#448](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/448)) ([175231a](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/175231ad41197b56f5788c4b3c610775442d694e))
* **sdk:** add experimental networks ([#456](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/456)) ([62da0dc](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/62da0dc9d327299188c084381e2fceaace06b2eb))
* **sdk:** support dynamic config for multiple chains ([d104c61](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/d104c618e10fb354a3fae5f534b28f886264fc61))
* **sharing:** Remove result proxy address from sharing contract config and matched deal ([#438](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/438)) ([6582e96](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/6582e96b11ec57265a38f78f2aff68e5c3de8cc0))


### Changed

* add check for nested empty JSON objects ([#457](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/457)) ([5367bb3](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/5367bb35877da4338fcdf7033a8a1e567177f0b6))
* Fix Sharing contract constructor arguments order ([#433](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/433)) ([230e035](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/230e035c4b06bcd26b4bce21c72916fc9c12ecde))
* remove useless await ([a0a424f](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/a0a424ff58db26d35f950b9fe13bd5fc7af60abc))
* remove useless await ([#381](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/381)) ([6e7ab77](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/6e7ab771ea550aacc766149c1ff74b81e39c6dc6))
* scripts subgraph package ([#447](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/447)) ([ceaddaa](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/ceaddaa424064c0cae4c1f53506a16ad29097bf7))
* standardize subgraphName for `dataprotector-v2` ([#460](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/460)) ([54796d5](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/54796d5de7f68a4a1b37e3273e4d5493c69ab719))

## [2.0.0-beta.16] (2025-06-16)

### Changed

- Added support for Arweave storage via optional `uploadMode` parameter of `protectData()` method
- Updated the default base URL for subgraphs:
  - Production: <https://thegraph.iex.ec>
  - Staging: <https://thegraph-staging.iex.ec>

## [2.0.0-beta.15] (2025-04-04)

### Changed

- Rename `voucherAddress` to `voucherOwner`
- Fix internal bug

## [2.0.0-beta.14] (2025-04-01)

### Added

- support for iExec voucher in `processProtectedData()` via `useVoucher` option
- added `voucherAddress` option for using a non-owned voucher contract in `processProtectedData()`

## [2.0.0-beta.13] (2025-03-13)

### Changed

- Upgraded the iexec dependency to ^8.13.1, which includes:
  - Migrated default SMS URL to <https://sms.iex.ec>.
  - Migrated from the deprecated SMS apps secrets endpoint.

## [2.0.0-beta.12] (2025-02-04)

### Added

- Added optional `path` parameter to `processProtectedData` method

### Changed

- Moved `getResultFromCompletedTask` method from DataProtectorSharing module (DPS) to DataProtectorCore module (DPC).

## [2.0.0-beta.11] (2025-01-29)

### Added

- Added `allowDebug` option for `protectData` to allow using the protected data in TEE debug apps (default `false`)

### Changed

- `processProtectedData` and `getCollectionsByOwner` returns a ValidationError and not a WorkflowError anymore in case of a bad input parameter.

## [2.0.0-beta.10] (2024-09-20)

### Changed

- Added new `protectData` and `getProtectedData` return field: `multiaddr`.
- Improved the performance of `getCollectionOwners` and `getCollectionsByOwner`.
- The `collections` in `getCollectionOwners` are now ordered by `collections.creationTimestamp`.
- make input object for `getCollectionOwners`, `getCollectionSubscriptions` and `getRentals` optional

## [2.0.0-beta.9] (2024-09-02)

### Changed

- read PoCo registries address from IExec PoCo contract instead of using hardcoded addresses

## [2.0.0-beta.8] (2024-08-08)

### Changed

- update `kubo-rpc-client` from v3 to v4

## [2.0.0-beta.7] (2024-07-29)

### Added

- support for ethers `AbstractProvider` and `AbstractSigner` in constructor

### Changed

- Add new optional param `userWhitelist` into `processProtectedData()` function
- `getCollectionsByOwner()`: Order protected data by `creationTimestamp` desc
- updated `iexec` and `ethers` dependencies

## [2.0.0-beta.6] (2024-07-23)

### Added

- Add new parameter `path` to `consumeProtectedData()` to unzip the protected data and only return the file which name is the value given by `path`.

### Changed

- A more explicit error message in case you do not have enough xRLC in your iExec account

## [2.0.0-beta.5] (2024-07-17)

### Changed

- [BREAKING] Removed support for `any` as valid input for `protectedData`, `authorizedApp`, and `authorizedUser` parameters in the function getGrantedAccess.

Before:

```
getGrantedAccess({protectedData: 'any',...})
```

After (same behavior):

```
getGrantedAccess({})
```

- [BREAKING] Removed support for `any` as valid input for `authorizedUser` parameters in the function grantAccess.
- [BREAKING] Removed support for `any` as valid input for `workerpool` parameters in the function processProtectedData.
- [BREAKING] Removed support for `any` as valid input for `authorizedApp`,`authorizedUser` parameters in the function revokeAllAccess.
- [BREAKING] Ship ES2022 JavaScript instead of es2015 (aka es6) in order to support `cause` optional field in `Error`:
  - Minimum browser versions: <https://gist.github.com/Julien-Marcou/156b19aea4704e1d2f48adafc6e2acbf>
  - Minimum Node.js version: 18
- [BREAKING] Removed `originalError` from `WorkflowError`

- Upgraded to `iexec ^8.9.1`
- Use `approveAndCall` staked RLC (iExec account) for payable methods `buyProtectedData`, `rentProtectedData`, `subscribeToCollection` when the allowance is insufficient (approve and payment are made in the same transaction).
- Better error message when the account balance is insufficient to perform an action.

## [2.0.0-beta.4] (2024-06-18)

### Added

- Add new parameter `maxPrice` to `consumeProtectedData()` to define the maximum desired workerpool order price. Dataset and App max prices are managed by the sharing smart contract.

### Changed

- `getCollectionSubscriptions()`: Fix possible error when fetching subscriptions

## [2.0.0-beta.3] (2024-06-07)

A new instance of the DataProtectorSharing smart contract has been deployed. The previous beta version `2.0.0-beta.2` is now deprecated. Use the `2.0.0-beta.3`

### Changed

- Use DataProtectorSharing `2.0.0`
- Upgraded `iexec` dependency to ^8.8.0

## [2.0.0-beta.2] (2024-05-24)

### Added

- Add new method `setProtectedDataRentingParams()` to the dataProtectorSharing module.
- `consumeProtectedData()`: Add two new status to ConsumeProtectedDataStatuses: "FETCH_WORKERPOOL_ORDERBOOK" and "PUSH_ENCRYPTION_KEY"
- `processProtectedData()`: You can now pass an `onStatusUpdate` callback to get update events at each step of the process.
- Added support for an array of possible types in `getProtectedData()` `requiredSchema` parameter (example: `getProtectedData({ requiredSchema: { picture: ["image/png", "image/jpeg"] } })`)

### Changed

- Make the `ethProvider` constructor parameter optional, enabling access to read functions without requiring a wallet.
- `addToCollection()`: Fix issue when the DataProtectorSharing contract is previously approved for the protected data
- `processProtectedData()`: A new return type was created: `ProcessProtectedDataResponse`
- `getProtectedData()`: Still accept legacy types `"boolean"` and `"number"` in `requiredSchema`
- Type of `collectionId` returned by the read functions has been updated from hexadecimal to decimal
- `consumeProtectedData()`: Remove "CONSUME_TASK_ACTIVE", "CONSUME_TASK_ERROR" and "CONSUME_TASK_COMPLETED" statuses, just use a "CONSUME_TASK" status with `isDone` parameter

## [2.0.0-beta.1] (2024-05-02)

### Added

- New "Sharing" module, instantiate with `IExecDataProtectorSharing` constructor.
  - Featuring:
    - Collections
    - Renting
    - Subscription
    - Sale

### Changed

- [breaking] Migration to modules: two different ways to instantiate this SDK:
  - instantiate one of the desired module: `IExecDataProtector` or `IExecDataProtectorSharing`
  - instantiate whole `IExecDataProtector` and access to both modules
- [breaking] Revise the naming of the fetch function to designate them as "get" instead
- [breaking] Changed serialization of protected data to support more non binary data
- [breaking] Changed data types in schema (`bool`, `f64`, `i128`, `string`)

### Removed

- [breaking] Removed `protectDataObservable` method. You can now use `protectData` and pass it an `onStatusUpdate` callback to get similar "events" at each step of the process
- [breaking] Removed `revokeAllAccessObservable` method. You can now use `revokeAllAccess` and pass it an `onStatusUpdate` callback to get similar "events" at each step of the process

## [1.0.0] (2024-05-02)

This is a major version but there is NO breaking change compared to `v0.5.3`, you can safely update to this version: `npm install @iexec/dataprotector@1`

### Changed

- Upgraded `iexec` dependency to ^8.7.0

## [0.5.3] (2024-04-09)

### Changed

- Fixed README publication issue on npm

## [0.5.2] (2024-04-08)

### Added

- Added `workerpool` option for `processProtectedData` to override the workerpool to use
- Added `isAppStrict` and `isUserStrict` options for `fetchGrantedAccess` to exclude access granted to any app or user
- Added a dockerized local stack for testing

### Changed

- Run tests on a local stack forked from bellecour
- Support ENS names for `owner` option of `fetchProtectedData`
- Fixed a bug that allowed `"any"` to be passed as `newOwner` to `transferOwnership`
- Fixed a bug that allowed `"any"` to be passed as `protectedData` to `processProtectedData`
- Fixed a bug that allowed `"any"` to be passed as `app` to `processProtectedData`
- Fixed a bug that may cause the user to pay gas fees when creating a protected data
- Fixed a bug that may cause incorrect requestorder max prices in `processProtectedData`
- Fixed grantAccess to prevent address 0 to be used for authorizedApp
- Changed URL validation to be more permissive

## [0.5.1] (2024-01-11)

### Changed

- Handle protected data that potentially have an empty schema

## [0.5.0] (2024-01-08)

### Added

- Added pagination parameters to `fetchProtectedData` method

### Changed

- Handle file as `ArrayBuffer` in addition to `Uint8Array`

## [0.4.1] (2023-11-10)

### Changed

- Fixed `grantAccess` method to give access to whitelist smart contract

## [0.4.0] (2023-11-07)

### Changed

- Upgraded to `ethers@6` and `iexec@8.5.0`

## [0.3.0] (2023-11-02)

### Added

- Add linter (ESLint)

### Changed

- Changed `fetchGrantedAccess` response: Previously a list of `GrantedAccess` was returned, now an object is returned containing the list of `GrantedAccess` and `count` properties

## [0.2.0] (2023-09-20)

### Added

- Added `dataprotectorContract` in the constructor options to customize the `CONTRACT_ADDRESS`

- Added `dataprotectorSubgraph` in the constructor options to customize the `DATAPROTECTOR_SUBGRAPH_ENDPOINT`

- Moved `ipfsNode` and `ipfsGateway` options to constructor (breaking change)

- Added method `processProtectedData` to the sdk that triggers the execution of an iExec dapp to process a created data.

- Added method `transferOwnership` to the sdk that sets a new owner of the protected

## [0.1.2] (2023-09-20)

### Changed

- Improved error handling
- The `protectedData` param in `fetchGrantedAccess` is no longer required and now accepts `"any"`, when not specified the method will fetch granted access for any protectedData
- Removed bundle
- Updated iexec to version 8.2.1
- Updated supported MIME types (not supported will fallback to `application/octet-stream`):
  - application/octet-stream
  - application/pdf
  - application/xml
  - application/zip
  - audio/midi
  - audio/mpeg
  - audio/x-wav
  - image/bmp
  - image/gif
  - image/jpeg
  - image/png
  - image/webp
  - video/mp4
  - video/mpeg
  - video/x-msvideo

## [0.1.1]

### Changed

- fixed installation issue for Windows users
- changed the default IPFS node

## [0.1.0] Initial release
