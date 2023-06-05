<p align="center">
  <a href="https://iex.ec/" rel="noopener" target="_blank"><img width="150" src="./logo.jpg" alt="iExec logo"/></a>
</p>

<h1 align="center">DataProtector</h1>

**DataProtector** offers developers methods to create apps that provide users with unparalleled ownership over their data.

Through DataProtector, users may allow apps to use their data without ever revealing the data itself. This revolutionary approach to data management relies on:

- end-to-end encryption backed by a secure hardware environment that prevents apps from accessing users’ unencrypted data
- smart contracts that manage apps’ rights to use users’ encrypted data.

DataProtector bundles 5 methods:

- protectData — that safeguards any type of data via end-to-end encryption and hardware security while recording data ownership on a smart contract to ensure verifiability and traceability
- grantAccess — that enables an app to use users’ data without ever revealing the data itself
- revokeAccess — that disables an app to use users’ data without ever disclosing it
- fetchProtectedData — that retrieves the data that has already been protected by DataProtector
- fetchGrantedAccess — that provides the list of the apps that are allowed to use existing protected data.

<div align="center">

**[Stable channel v1](https://iex.ec/)**

[![npm](https://img.shields.io/npm/v/@iexec/dataprotector)](https://www.npmjs.com/package/@iexec/dataprotector) [![license](https://img.shields.io/badge/license-Apache%202-blue)](/LICENSE)

</div>

## Installation

DataProtector is available as an [npm package](https://www.npmjs.com/package/@iexec/dataprotector).

**npm:**

```sh
npm install @iexec/dataprotector
```

**yarn:**

```sh
yarn add @iexec/dataprotector
```

## Get started

### Browser

```ts
import { IExecDataProtector } from '@iexec/dataprotector';

const web3Provider = window.ethereum;
const dataProtector = new IExecDataProtector(web3Provider);
```

### NodeJS

```ts
import { IExecDataProtector, getWeb3Provider } from '@iexec/dataprotector';
import { Wallet } from 'ethers';

const { PRIVATE_KEY } = process.env;

const web3Provider = getWeb3Provider(PRIVATE_KEY);
const dataProtector = new IExecDataProtector(web3Provider);
```

## Documentation

- [DataProtector](https://tools.docs.iex.ec/tools/dataprotector)

## License

This project is licensed under the terms of the
[Apache 2.0](/LICENSE).
