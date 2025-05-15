# Changelog

All notable changes to this project will be documented in this file.

## Next

### Changed

- Refactor sharing contract CI to use reusable workflows (#442)
- [BREAKING] Remove result proxy url from contract config and deal params (#438).
- Fix Sharing contract constructor arguments order (#433)
- Update blockscout url

## [2.0.0]

### Changed

- [BREAKING] changed duration units from uint48 to uint40 to avoid possible overflow (this change breaks the upgrade storage and requires a new instance deployment)

## [1.0.0] Initial release
