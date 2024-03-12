# Changelog

All notable changes to this project will be documented in this file.

## NEXT

### Added

- Added `workerpool` option for `processProtectedData` to override the workerpool to use
- Added a dockerized local stack for testing

### Changed

- Run tests on a local stack forked from bellecour
- Support ENS names for `owner` option of `fetchProtectedData`
- Fixed a bug that allowed `"any"` to be passed as `newOwner` to `transferOwnership`
- Fixed a bug that allowed `"any"` to be passed as `protectedData` to `processProtectedData`
- Fixed a bug that allowed `"any"` to be passed as `app` to `processProtectedData`
- Fixed a bug that may cause the user to pay gas fees when creating a protected data
- Fixed a bug that may cause incorrect requestorder max prices in `processProtectedData`
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

- Fixed `gantAccess` method to give access to whitelist smart contract

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
