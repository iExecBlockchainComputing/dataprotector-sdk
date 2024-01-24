import { type Contract } from 'ethers';
import type { IExec } from 'iexec';
import { WorkflowError } from '../../../utils/errors.js';
import { Address } from '../../types.js';
import { getCollectionContract } from './getCollectionContract.js';

export async function addProtectedDataToCollection({
  iexec,
  sharingContractAddress,
  collectionId,
  protectedDataAddress,
}: {
  iexec: IExec;
  sharingContractAddress: Address;
  collectionId: number;
  protectedDataAddress: Address;
}) {
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const { collectionContract } = await getCollectionContract({
    provider,
    sharingContractAddress,
  });

  console.log('protectedDataAddress', protectedDataAddress);
  console.log('Call SC addProtectedDataToCollection...');
  const addToCollectionResult = await (
    collectionContract.connect(signer) as Contract
  )
    .addProtectedDataToCollection(
      collectionId,
      // ethers.toNumber(collectionId),
      protectedDataAddress,
      {
        // TODO: See how we can remove this
        gasLimit: 900_000,
      }
    )
    .then((tx) => {
      console.log('tx', tx);
      return tx.wait();
    })
    .catch((e: Error) => {
      console.error('e', e);
      throw new WorkflowError(
        'Sharing smart contract: Failed to add protected data to collection',
        e
      );
    });
  console.log('addToCollectionResult', addToCollectionResult);
}
