import { ethers, type Contract } from 'ethers';
import type { IExec } from 'iexec';
import { POCO_REGISTRY_CONTRACT_ADDRESS } from '../../../config/config.js';
import { ABI as registryABI } from '../../../contracts/registryAbi.js';
import { ErrorWithData } from '../../../utils/errors.js';
import { Address } from '../../types.js';
import { getCollectionContract } from './getCollectionContract.js';

export async function approveCollectionContract({
  iexec,
  protectedData,
  sharingContractAddress,
}: {
  iexec: IExec;
  protectedData: { id: string; owner: { id: string } };
  sharingContractAddress: Address;
}) {
  const { provider, signer } = await iexec.config.resolveContractsClient();

  // Get collection contract address from store smart-contract
  const { collectionContractAddress } = await getCollectionContract({
    provider,
    sharingContractAddress,
  });

  const registryContract = new ethers.Contract(
    POCO_REGISTRY_CONTRACT_ADDRESS,
    registryABI,
    provider
  );
  const protectedDataId = ethers.getBigInt(protectedData.id).toString();
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
      if (protectedData.owner.id === collectionContractAddress) {
        throw new ErrorWithData(
          'This protected data is already owned by the "Collection" smart-contract',
          { protectedDataAddress: protectedData.id }
        );
      }
      throw err;
    });
}
