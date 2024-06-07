<p align="center">
  <a href="https://iex.ec/" rel="noopener" target="_blank"><img width="150" src="/logo-iexec.png" alt="iExec logo"/></a>
</p>

<h1 align="center">DataProtector</h1>

**DataProtector** offers developers methods to create apps that give users more ownership and privacy over their data.

DataProtector relies on:

- end-to-end encryption backed by a confidential computing technology
- smart contracts that manage apps’ rights to use users’ encrypted data

<div align="center">

[![npm](https://img.shields.io/badge/npm-2.0.0--beta-blue)](https://www.npmjs.com/package/@iexec/dataprotector/v/beta) [![license](https://img.shields.io/badge/license-Apache%202-blue)](/packages/sdk/LICENSE)

</div>

## Installation

DataProtector is available as an [npm package](https://www.npmjs.com/package/@iexec/dataprotector).

**npm:**

```sh
npm install @iexec/dataprotector@beta --save-exact
```

**yarn:**

```sh
yarn add @iexec/dataprotector@beta --exact
```

## Get started

Two modules:
 - "Core"
 - "Sharing"

Depending on your project's requirements, you can instantiate the SDK using the
umbrella module for full functionality or opt for one of the submodules to
access specific sets of features.

### Instantiate using the umbrella module

For projects requiring the full functionality of the SDK, including both core
and sharing functions.

#### Browser

```ts
import { IExecDataProtector } from '@iexec/dataprotector';

const web3Provider = window.ethereum;
// Instantiate using the umbrella module for full functionality
const dataProtector = new IExecDataProtector(web3Provider);

const dataProtectorCore = dataProtector.core;
const dataProtectorSharing = dataProtector.sharing;
```

#### NodeJS

```ts
import { IExecDataProtector, getWeb3Provider } from '@iexec/dataprotector';

const { PRIVATE_KEY } = process.env;
// Get Web3 provider from a private key
const web3Provider = getWeb3Provider(PRIVATE_KEY);

// Instantiate using the umbrella module for full functionality
const dataProtector = new IExecDataProtector(web3Provider);

const dataProtectorCore = dataProtector.core; // access to core methods
const dataProtectorSharing = dataProtector.sharing; // access to sharing methods
```

## Documentation

- [DataProtector documentation](https://documentation-tools.vercel.app/)
- [iExec Protocol documentation](https://protocol.docs.iex.ec)

## License

This project is licensed under the terms of the
[Apache 2.0](/packages/sdk/LICENSE).
