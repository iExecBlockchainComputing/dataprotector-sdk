# Sharing Smart Contracts

Note: all of the following commands should be executed inside `packages/sharing-smart-contract`.

## Installation

```bash
npm ci
```

## Build

To clean and compile the project:

```bash
npm run compile
```

### Test

Start a local Hardhat node that, by default, forks Bellecour network:

```bash
npx hardhat node
```

Open a new terminal and run :

```bash
npm run test -- --network localhost
```

## Deployment

To deploy contracts, set up a private key in `.env` file and run:

```bash
npm run deploy -- --network <name>
```

**Note**: Deployment on chains that support CreateX factory will deploy contracts using `create2` strategy.

### Mainnets deployment

Deploying on any mainnet must happen through the dedicated Github action.
The action can be triggered from Github UI or using Github CLI:

```sh
gh workflow run 'Sharing Smart Contract - Deployment' \
  -f environment=<name> \ # testnets | mainnets
  -f network=<name>
 # [ --ref <branch name> ]
```

The output should be something like:

```
✓ Created workflow_dispatch event for sharing-smart-contract-deploy.yml at feature/sharing-deployment-with-actions
```

Then check the execution on [Github](https://github.com/iExecBlockchainComputing/dataprotector-sdk/actions/workflows/sharing-smart-contract-deploy.yml).

### Testnets deployments

It is **highly recommended** to use Github Actions to deploy on live testnets, especially for "final" versions that are going to be used by other services.

It is ok to deploy manually on testnets in dev mode. In that case use random create2 salts to not interfere with the configured salt.

### Verification

First, set up the target explorer API key in `.env` file.

1. To verify contracts that are deployed using Hardhat Ignition, run:

```bash
# Get deployment id using:
npx hardhat ignition deployments

# Verify
npm run verify:ignition -- <deploymentId> # e.g. chain-421614
```

**Note**: contracts deployed using Github Actions are automatically verified.

2. To verify any contract, run

```bash
npm run verify -- <address> --network <name>
```

## Docs and diagrams

#### UML Diagrams

To generate UML diagrams for smart contracts (storage + class):

```bash
npm run uml
```

#### Solidity to UML

To convert Solidity files to storage UML diagrams:

```bash
npm run sol-to-uml
```

#### Storage to diagrams

To convert Solidity files to class UML diagrams:

```bash
npm run storage-to-diagrams
```

#### Issues

Do not use a more recent version of hardhat than the current one (2.20.1). Cf issue : <https://github.com/NomicFoundation/hardhat/issues/4974>
