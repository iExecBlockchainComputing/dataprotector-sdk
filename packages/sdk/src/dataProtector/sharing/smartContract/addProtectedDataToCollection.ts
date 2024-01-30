import { type Contract } from 'ethers';
import type { IExec } from 'iexec';
import { WorkflowError } from '../../../utils/errors.js';
import { Address, AddressOrENS } from '../../types.js';
import { getCollectionContract } from './getCollectionContract.js';

export async function addProtectedDataToCollection({
  iexec,
  sharingContractAddress,
  collectionId,
  protectedDataAddress,
}: {
  iexec: IExec;
  sharingContractAddress: AddressOrENS;
  collectionId: number;
  protectedDataAddress: Address;
}) {
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const { collectionContract } = await getCollectionContract({
    provider,
    sharingContractAddress,
  });

  return (collectionContract.connect(signer) as Contract)
    .addProtectedDataToCollection(collectionId, protectedDataAddress, {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => tx.wait())
    .catch((err: Error) => {
      // TODO: Return a more explicit error when the collection is not found
      throw new WorkflowError(
        'Sharing smart contract: Failed to add protected data to collection',
        err
      );
    });
}
