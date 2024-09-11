# Dataprotector environments

This package centralize the configuration of dataprotector environments in [environments.json](./environments.json)

## Usage

### JSON

Directly get the value from [environments.json](./environments.json)

### ES module

Install this module as a dependency

```sh
npm install ./path/to/this/folder
```

Use it to generate the configuration for a specific environment

```js
import { getEnvironment } from "@iexec/dataprotector-environments";

const {
  smsUrl,
  iexecGatewayUrl,
  resultProxyUrl,
  ipfsGatewayUrl,
  ipfsNodeUrl,
  workerpoolProdAddress,
  dataprotectorContractAddress,
  dataprotectorStartBlock,
  dataprotectorSharingContractAddress,
  dataprotectorSharingStartBlock,
  addOnlyAppWhitelistRegistryContractAddress,
  addOnlyAppWhitelistRegistryStartBlock,
  protectedDataDeliveryWhitelistAddress,
  protectedDataDeliveryDappAddress,
  protectedDataDeliveryDappEns,
  dataprotectorSubgraphUrl,
} = getEnvironment("staging");
```

## Updating an environment

```sh
ENV=env-name KEY=keyName VALUE=value npm run update-env
```
