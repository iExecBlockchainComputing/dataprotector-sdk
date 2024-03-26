<p align="center">
  <a href="https://iex.ec/" rel="noopener" target="_blank"><img width="150" src="./logo-iexec.png" alt="iExec logo"/></a>
</p>

<h1 align="center">DataProtector Consumer</h1>

This package helps nodejs iExec dapps to consume protected data created with `@iexec/dataprotector`

<div align="center">

[![npm](https://img.shields.io/npm/v/@iexec/dataprotector-consumer)](https://www.npmjs.com/package/@iexec/dataprotector-consumer) [![license](https://img.shields.io/badge/license-Apache%202-blue)](/LICENSE)

</div>

## Installation

**npm:**

```sh
npm install @iexec/dataprotector-consumer
```

**yarn:**

```sh
yarn add @iexec/dataprotector-consumer
```

## Get started

In your nodejs iExec dapp

```js
const dataprotectorConsumer = new IExecDataProtectorConsumer();

const value1 = await dataprotectorConsumer.getValue('path.to.value1', 'bool');
const value2 = await dataprotectorConsumer.getValue('path.to.value2', 'string');
```
