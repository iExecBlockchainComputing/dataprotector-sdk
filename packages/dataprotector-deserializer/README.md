<p align="center">
  <a href="https://iex.ec/" rel="noopener" target="_blank"><img width="150" src="./logo-iexec.png" alt="iExec logo"/></a>
</p>

<h1 align="center">DataProtector Deserializer</h1>

This package helps nodejs iExec dapps to deserialize protected data created with `@iexec/dataprotector`

<div align="center">

[![npm](https://img.shields.io/npm/v/@iexec/dataprotector-deserializer)](https://www.npmjs.com/package/@iexec/dataprotector-deserializer) [![license](https://img.shields.io/badge/license-Apache%202-blue)](/LICENSE)

</div>

## Installation

```sh
npm install @iexec/dataprotector-deserializer
```

## Get started

In your nodejs iExec dapp

```js
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const deserializer = new IExecDataProtectorDeserializer();

const value1 = await deserializer.getValue('path.to.value1', 'bool');
const value2 = await deserializer.getValue('path.to.value2', 'string');
```
