import { ethers, type Contract } from 'ethers';
import type { GraphQLClient } from 'graphql-request';
import type { IExec } from 'iexec';
import { POCO_REGISTRY_CONTRACT_ADDRESS } from '../../../config/config.js';
import { ABI as registryABI } from '../../../contracts/registryAbi.js';
import { Address } from '../../types.js';
import { getProtectedData } from '../subgraph/getProtectedData.js';
import { getCollectionContract } from './getCollectionContract.js';

export async function approveCollectionContract({
  iexec,
  graphQLClient,
  protectedDataAddress,
  sharingContractAddress,
}: {
  iexec: IExec;
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  sharingContractAddress: Address;
}) {
  const { provider, signer } = await iexec.config.resolveContractsClient();

  // Get collection contract address from store smart-contract
  const { collectionContractAddress } = await getCollectionContract({
    provider,
    sharingContractAddress,
  });
  return;

  const registryContract = new ethers.Contract(
    POCO_REGISTRY_CONTRACT_ADDRESS,
    registryABI,
    provider
  );
  const protectedDataId = ethers
    .getBigInt(protectedDataAddress.toLowerCase())
    .toString();
  await (registryContract.connect(signer) as Contract)
    .approve(collectionContractAddress, protectedDataId, {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => tx.wait())
    .catch(async (err) => {
      if (err?.code === 'ACTION_REJECTED') {
        throw err;
      }
      const protectedData = await getProtectedData({
        graphQLClient,
        protectedDataAddress,
      });
      if (!protectedData) {
        throw new Error(
          'This protected data does not exist in the subgraph. Address: ' +
            protectedDataAddress
        );
      }
      if (protectedData.owner.id === collectionContractAddress) {
        throw new Error(
          'This protected data is already owned by the "Collection" smart-contract'
        );
      }
      throw err;
    });
}
