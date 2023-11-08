# Changelog

All notable changes to this project will be documented in this file.

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
