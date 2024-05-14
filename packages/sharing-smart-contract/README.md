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

### Verify

To verify the contracts:

```bash
npm run verify
```

### Deploy (Production)

To deploy the project on the production network - bellecour.
⚠️ Be sure before deploying on bellecour

```bash
npm run script:prod
```

### Deploy (Test)

To deploy the project on the test network - localhost.
You need first to start a local hardhat node which will be a fork of bellecour network :

```bash
npx hardhat node
```

Open a new terminal and run :

```bash
npm run script:test
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

#### Issue

Do not use a more recent version of hardhat than the current one (2.20.1). Cf issue : <https://github.com/NomicFoundation/hardhat/issues/4974>
