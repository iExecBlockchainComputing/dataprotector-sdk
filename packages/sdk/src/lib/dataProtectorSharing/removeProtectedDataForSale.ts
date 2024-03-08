import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  RemoveProtectedDataForSaleParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataCurrentlyForSale,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const removeProtectedDataForSale = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
}: IExecConsumer &
  SharingContractConsumer &
  RemoveProtectedDataForSaleParams): Promise<SuccessWithTransactionHash> => {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  const protectedDataDetails = await getProtectedDataDetails({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });
  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: Number(
      protectedDataDetails.collection.collectionTokenId
    ),
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyProtectedDataCurrentlyForSale(protectedDataDetails);

  try {
    const tx = await sharingContract.removeProtectedDataForSale(
      protectedDataDetails.collection.collectionTokenId,
      vProtectedDataAddress
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to remove protected data from sale', e);
  }
};
