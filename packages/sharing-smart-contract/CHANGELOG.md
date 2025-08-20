# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0](https://github.com/iExecBlockchainComputing/dataprotector-sdk/compare/sharing-smart-contracts-v3.0.0-beta...sharing-smart-contracts-v3.0.0) (2025-08-20)


### Added

* **packages/subgraph:** trigger release for subgraph component ([5f679ec](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/5f679ec0056a3824e5195c5a7f97182af63efbbd))
* **packages/subgraph:** update subgraph component ([3946b69](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/3946b699ad8ea08af97ebf265e72a2f9f701e9d5))
* sharing smart contracts v3.0.0 ([#486](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/486)) ([8803fa5](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/8803fa56642f372c927f7151aebc21719cdfe853))


### Changed

* dataProtector contract verification ([#477](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/477)) ([7e388ed](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/7e388ed4fc6b4a10e08f91848bbe881b3c36dfd4))


### Misc

* force release for subgraph component ([e10c0e6](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/e10c0e670030516d8de04c90ae730302455507b7))
* release subgraph v3.1.0 ([a19aabb](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/a19aabbd42d3336f8597c396d875a4d99ce049b7))
* release subgraph v3.1.0 ([dc363e7](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/dc363e78709f779cf8852688398cff8b6433b48e))
* reset sdk to beta versioning ([2cef3a3](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/2cef3a30bf8a4cb703c458693e8d91c9eab67ab4))

## [3.0.0-beta](https://github.com/iExecBlockchainComputing/dataprotector-sdk/compare/sharing-contracts-v2.0.0...sharing-contracts-v3.0.0-beta) (2025-07-30)

### ⚠ BREAKING CHANGES

- **sharing:** Remove result proxy address from sharing contract config and matched deal ([#438](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/438))

### Added

- deploy-on-arbitrumSepolia ([#475](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/475)) ([6681fcf](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/6681fcf9d6ec34c9ab075a90caa96d347cc06f92))
- integrate-zod-validation ([#431](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/431)) ([68e05f5](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/68e05f525026530b5a8038b0eb54628ef5a2f55c))
- **sharing:** Deploy contracts using Hardhat Ignition ([#440](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/440)) ([e7c3e71](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/e7c3e71cd5a3ab653362888f6adbe52fde7dfb6f))
- **sharing:** Deploy DPS contract using Github action ([#443](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/443)) ([ceb7645](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/ceb76457f94d49050adc79c400118f4e600bdd8a))
- **sharing:** Deploy on testnet and save artifacts ([#444](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/444)) ([b6ead68](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/b6ead6853e57966e9667a898dfb312487246a640))
- **sharing:** Deploy using testnets deployer ([#445](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/445)) ([73b90e6](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/73b90e612a50ed3b26733f18217e1f6488cdd082))
- **sharing:** Import Ignition deployment in OZ upgrades plugin ([#441](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/441)) ([5e32a6a](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/5e32a6a20d45d8d7e8758a72ea85b4395bbf9776))
- **sharing:** Refactor sharing contract CI to use reusable workflows ([#442](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/442)) ([50c6c98](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/50c6c9817f20ae0490ff06af6fb5b17f964bbcfc))
- **sharing:** Remove result proxy address from sharing contract config and matched deal ([#438](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/438)) ([6582e96](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/6582e96b11ec57265a38f78f2aff68e5c3de8cc0))

### Changed

- Fix Sharing contract constructor arguments order ([#433](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/433)) ([230e035](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/230e035c4b06bcd26b4bce21c72916fc9c12ecde))
- Init proxy contracts at deployment ([#472](https://github.com/iExecBlockchainComputing/dataprotector-sdk/issues/472)) ([66be383](https://github.com/iExecBlockchainComputing/dataprotector-sdk/commit/66be383d0f1fefa29e243c180cc2b83c5813db25))

## [2.0.0]

### Changed

- [BREAKING] changed duration units from uint48 to uint40 to avoid possible overflow (this change breaks the upgrade storage and requires a new instance deployment)

## [1.0.0] Initial release
