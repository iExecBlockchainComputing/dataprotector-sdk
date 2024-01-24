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

  // Get collection contract from store SC
  const { collectionContractAddress } = await getCollectionContract({
    provider,
    sharingContractAddress,
  });

  const registryContract = new ethers.Contract(
    POCO_REGISTRY_CONTRACT_ADDRESS,
    registryABI,
    provider
  );
  const protectedDataId = ethers
    .getBigInt(protectedDataAddress.toLowerCase())
    .toString();
  console.log('protectedDataId', protectedDataId);
  console.log('-> collectionContractAddress', collectionContractAddress);
  await (registryContract.connect(signer) as Contract)
    .approve(collectionContractAddress, protectedDataId, {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => {
      console.log('tx', tx);
      // TODO: Real error that could be nice to check for: "ERC721: approval to current owner"
      // = "SC is already the owner of this protected data"
      return tx.wait();
    })
    .catch(async (err) => {
      if (err?.code === 'ACTION_REJECTED') {
        throw err
      }
      console.log('protectedDataAddress', protectedDataAddress);
      const protectedData = await getProtectedData({
        graphQLClient,
        protectedDataAddress,
      });
      console.log('protectedData', protectedData)
      if (!protectedData) {
        throw new Error(
          'This protected data does not exist in the subgraph. Address: ' + protectedDataAddress
        );
      }
      if (
        protectedData.owner.id === '0x464ac32a1b00d34dfa40f0575d81e2457633fe87'
      ) {
        throw new Error(
          'This protected data is already owned by the smart-contract'
        );
      }
      throw err;
    });
}
