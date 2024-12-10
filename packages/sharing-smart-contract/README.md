# Sharing Smart Contracts

Brief description of your project.

## Table of Contents

- [Installation](#installation)
- [Scripts](#scripts)
  - [Compile](#compile)
  - [Verify](#verify)
  - [Deploy (Production)](#deploy-production)
  - [Deploy (Test)](#deploy-test)
  - [Run Tests](#run-tests)
  - [Generate UML Diagrams](#generate-uml-diagrams)

## Installation

Describe the steps to install the project dependencies.

```bash
npm ci
```

## Scripts

### Compile

To clean and compile the project:

```bash
npm run compile
```

### Deploy locally

To deploy the project on the test network - localhost.
You need first to start a local hardhat node which will be a fork of bellecour network :

```bash
npx hardhat node
```

Open a new terminal and run :

```bash
npm run deploy
```

### Upgrade locally

upgrade the `DataprotectorSharing` contract implementation on a local bellecour fork.

```sh
npm run upgrade-local
```

### Run Tests

To deploy the project on the test network - localhost.
You need first to start a local hardhat node which will be a fork of bellecour network :

```bash
npx hardhat node
```

Open a new terminal and run :

```bash
npm run test
```

⚠️ Even if, the default network in the hardhat config is the local bellecour fork node. The tests will be run on a a simple snap hardhat node. That is why we need to specify the localhost network for the test which corresponds to the fork node of bellecour.

## Admin scripts

### Deploy

deploy the `AddOnlyAppRegistry` and `DataprotectorSharing` contracts

```bash
npm run deploy -- --network <network>
```

Use network `bellecour` to deploy the project on the production network - bellecour. ⚠️ Be sure before deploying on bellecour.

Environment params:

- `WALLET_PRIVATE_KEY`: deployer private key (bellecour network only)
- `POCO_ADDRESS`: iExec PoCo contract address (default address on bellecour)
- `DATASET_REGISTRY_ADDRESS`: iExec DatasetRegistry contract address (default address on bellecour)
- `VOUCHER_HUB_ADDRESS`: iExec VoucherHub contract address (default address on bellecour)

### Verify

verify the contracts on the network block explorer

```bash
npm run verify -- --network <network>
```

### update-env

configure `DataprotectorSharing` contract to use a specific result-proxy.

```sh
npm run update-env -- --network <network>
```

Environment params:

- `WALLET_PRIVATE_KEY`: DataprotectorSharing admin private key (bellecour network only)
- `ENV`: default environment to use (`prod` or `staging`)
- `DATAPROTECTOR_SHARING_ADDRESS`: iExec DataprotectorSharing contract address (default address on ENV)
- `RESULT_PROXY_URL`: iExec Result-Proxy service URL (default url on ENV)

### upgrade

upgrade the `DataprotectorSharing` contract implementation.

```sh
npm run upgrade -- --network <network>
```

Environment params:

- `WALLET_PRIVATE_KEY`: DataprotectorSharing admin private key (bellecour network only)
- `ENV`: default environment to use (`prod` or `staging`)
- `POCO_ADDRESS`: iExec PoCo contract address (default address on bellecour)
- `DATASET_REGISTRY_ADDRESS`: iExec DatasetRegistry contract address (default address on bellecour)
- `DATAPROTECTOR_SHARING_ADDRESS`: DataprotectorSharing proxy contract address (default address on ENV)
- `ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS`: AddOnlyAppRegistry contract address (default address on ENV)

<!--

(TODO: currently KO)

### Generate UML Diagrams

To generate UML diagrams for smart contracts (storage + class):

```bash
npm run uml
```

#### Solidity to UML

To convert Solidity files to storage UML diagrams:

```bash
npm run sol-to-uml
```

#### Storage to Diagrams

To convert Solidity files to class UML diagrams:

```bash
npm run storage-to-diagrams
```

-->

## Issue

Do not use a more recent version of hardhat than the current one (2.20.1). Cf issue : <https://github.com/NomicFoundation/hardhat/issues/4974>
