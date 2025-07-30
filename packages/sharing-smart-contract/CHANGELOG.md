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

## [3.0.0-beta](https://github.com/iExecBlockchainComputing/dataprotector-sdk/compare/sharing-contracts-v2.0.0...sharing-contracts-v3.0.0-beta) (2025-07-30)


### ⚠ BREAKING CHANGES

* **sharing:** Remove result proxy address from sharing contract config and matched deal ([#438](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/438))

### Added

* deploy-on-arbitrumSepolia ([#475](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/475)) ([6681fcf](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/6681fcf9d6ec34c9ab075a90caa96d347cc06f92))
* integrate-zod-validation ([#431](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/431)) ([68e05f5](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/68e05f525026530b5a8038b0eb54628ef5a2f55c))
* **sharing:** Deploy contracts using Hardhat Ignition ([#440](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/440)) ([e7c3e71](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/e7c3e71cd5a3ab653362888f6adbe52fde7dfb6f))
* **sharing:** Deploy DPS contract using Github action ([#443](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/443)) ([ceb7645](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/ceb76457f94d49050adc79c400118f4e600bdd8a))
* **sharing:** Deploy on testnet and save artifacts ([#444](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/444)) ([b6ead68](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/b6ead6853e57966e9667a898dfb312487246a640))
* **sharing:** Deploy using testnets deployer ([#445](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/445)) ([73b90e6](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/73b90e612a50ed3b26733f18217e1f6488cdd082))
* **sharing:** Import Ignition deployment in OZ upgrades plugin ([#441](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/441)) ([5e32a6a](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/5e32a6a20d45d8d7e8758a72ea85b4395bbf9776))
* **sharing:** Refactor sharing contract CI to use reusable workflows ([#442](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/442)) ([50c6c98](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/50c6c9817f20ae0490ff06af6fb5b17f964bbcfc))
* **sharing:** Remove result proxy address from sharing contract config and matched deal ([#438](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/438)) ([6582e96](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/6582e96b11ec57265a38f78f2aff68e5c3de8cc0))


### Changed

* Fix Sharing contract constructor arguments order ([#433](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/433)) ([230e035](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/230e035c4b06bcd26b4bce21c72916fc9c12ecde))
* Init proxy contracts at deployment ([#472](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/472)) ([66be383](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/66be383d0f1fefa29e243c180cc2b83c5813db25))

## [2.0.0]

### Changed

- [BREAKING] changed duration units from uint48 to uint40 to avoid possible overflow (this change breaks the upgrade storage and requires a new instance deployment)

## [1.0.0] Initial release
