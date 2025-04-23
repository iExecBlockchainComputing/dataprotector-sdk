# Contract Name: DataProtector

## Description

The `DataProtector` contract is designed to attach schemas to datasets and publish them as events.

## Deploying the Contract

To deploy the contract, run the following command:

```sh
npm run deploy -- --network avalancheFuji
```

If no network is specified, the local Hardhat network will be used by default.

**Note:** This deployment uses the `createX` factory through Hardhat Ignition. To modify the deployment address, update the `salt` value in the `hardhat.config.json` file.

## Verifying the Contract

To verify the contract during deployment, include the `--verify` option in the deployment command:

```sh
npm run deploy -- --network avalancheFuji --verify
```

If the contract has already been deployed, you can verify it separately using the following command:

```sh
npx hardhat ignition verify chain-43113
```

This ensures the contract's source code is verified on the blockchain explorer for the specified network.

## Deployed Contract Address

Refer to the `../../environments/environments.json` file to find the deployed contract address for the respective environment.
