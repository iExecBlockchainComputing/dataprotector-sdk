<p align="center">
  <a href="https://iex.ec/" rel="noopener" target="_blank"><img width="150" src="./logo-iexec.png" alt="iExec logo"/></a>
</p>

<h1 align="center">DataProtector</h1>

**DataProtector** offers developers methods to create apps that give users unparalleled ownership and privacy over their data.

Through DataProtector, users may allow apps to use their data–without ever revealing the data itself. This revolutionary approach to data management relies on:

- end-to-end encryption backed by a confidential computing technology that prevents apps from accessing users’ unencrypted data
- smart contracts that manage apps’ rights to use users’ encrypted data

DataProtector bundles 6 methods:

- **protectData** — that safeguards any data. It takes responsibility for encrypting the data and recording ownership on a smart contract
- **grantAccess** — that authorizes an app to use users’ data without ever revealing the data itself
- **revokeAllAccess** — that revokes all apps' access to users’ data
- **revokeOneAccess** — that revokes an app's access to users’ data
- **fetchProtectedData** — that retrieves data protected by DataProtector
- **fetchGrantedAccess** — that provides the list of authorization with associated apps and users to use existing protected data

<div align="center">

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

const { PRIVATE_KEY } = process.env;

const web3Provider = getWeb3Provider(PRIVATE_KEY);
const dataProtector = new IExecDataProtector(web3Provider);
```

## Documentation

- [DataProtector documentation](https://tools.docs.iex.ec/tools/dataprotector)
- [DataProtector technical design](./technical-design/index.md)
- [iExec Protocol documentation](https://protocol.docs.iex.ec)

## License

This project is licensed under the terms of the
[Apache 2.0](/LICENSE).
