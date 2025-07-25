# Changelog

All notable changes to this project will be documented in this file.

## Next

### Changed

- CI fixes and add support for Arbitrum mainnet deployment (#469)
- Deploy on testnet and save artifacts (#444, #445)
- Deploy DPS contract using Github action (#443)
- Refactor sharing contract CI to use reusable workflows (#442)
- Import Ignition deployment in OZ upgrades plugin (#441)
- Deploy contracts using Hardhat Ignition (#440)
- [BREAKING] Remove result proxy url from contract config and deal params (#438).
- Fix Sharing contract constructor arguments order (#433)
- Update blockscout url

## [2.0.0]

### Changed

- [BREAKING] changed duration units from uint48 to uint40 to avoid possible overflow (this change breaks the upgrade storage and requires a new instance deployment)

## [1.0.0] Initial release
