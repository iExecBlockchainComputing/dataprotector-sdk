# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0-beta.2] (To be released)

### Added

- `consumeProtectedData()`: Add two new status to ConsumeProtectedDataStatuses: "FETCH_WORKERPOOL_ORDERBOOK" and "PUSH_ENCRYPTION_KEY"

### Changed

- fixed `addToCollection()` method issue when the DataProtectorSharing contract is previously approved for the protected data

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
  - instantiate one of the desired module: `IExecDataProtector` or `IExecDataProtectorSharing`.
  - instantiate whole `IExecDataProtector` and access to both modules.
- [breaking] Revise the naming of the fetch function to designate them as "get" instead.
- [breaking] Changed serialization of protected data to support more non binary data
- [breaking] Changed data types in schema (`bool`, `f64`, `i128`, `string`)

### Removed

- [breaking] Removed `protectDataObservable` method. You can now use `protectData` and pass it an `onStatusUpdate` callback to get similar "events" at each step of the process.
- [breaking] Removed `revokeAllAccessObservable` method. You can now use `revokeAllAccess` and pass it an `onStatusUpdate` callback to get similar "events" at each step of the process.

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

- Changed `fetchGrantedAccess` response: Previously a list of `GrantedAccess` was returned, now an object is returned containing the list of `GrantedAccess` and `count` properties.

## [0.2.0] (2023-09-20)

### Added

- Added `dataprotectorContract` in the constructor options to customize the `CONTRACT_ADDRESS`

- Added `dataprotectorSubgraph` in the constructor options to customize the `DATAPROTECTOR_SUBGRAPH_ENDPOINT`

- Moved `ipfsNode` and `ipfsGateway` options to constructor (breaking change)

- Added method `processProtectedData` to the sdk that triggers the execution of an iExec dapp to process a created data.

- Added method `transferOwnership` to the sdk that sets a new owner of the protected.

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
