import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
} from '../../utils/validators.js';
import {
  RentProtectedDataParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const rentProtectedData = async ({
  collectionTokenId,
  protectedDataAddress,
}: RentProtectedDataParams): Promise<SuccessWithTransactionHash> => {
  try {
    const vCollectionId = positiveNumberSchema()
      .required()
      .label('collectionId')
      .validateSync(collectionTokenId);
    const vProtectedDataAddress = addressOrEnsOrAnySchema()
      .required()
      .label('protectedDataAddress')
      .validateSync(protectedDataAddress);
    const sharingContract = await getSharingContract();
    let rentingParams;
    try {
      rentingParams = await sharingContract.protectedDataForRenting(
        vCollectionId,
        vProtectedDataAddress
      );
    } catch (error) {
      throw new WorkflowError(
        'Failed to get renting price from smart contract',
        error
      );
    }
    const price = rentingParams.price;
    const tx = await sharingContract.rentProtectedData(
      vCollectionId,
      vProtectedDataAddress,
      {
        value: price,
        // TODO: See how we can remove this
        gasLimit: 900_000,
      }
    );
    const txReceipt = await tx.wait();
    return {
      success: true,
      txHash: txReceipt.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to rent Protected Data', e);
  }
};
