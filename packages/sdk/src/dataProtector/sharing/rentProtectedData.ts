import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
} from '../../utils/validators.js';
import {
  RentProtectedDataParams,
  RentProtectedDataResponse,
} from '../types.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const rentProtectedData = async ({
  collectionId,
  protectedDataAddress,
}: RentProtectedDataParams): Promise<RentProtectedDataResponse> => {
  try {
    const vCollectionId = positiveNumberSchema()
      .required()
      .label('collectionId')
      .validateSync(collectionId);
    const vProtectedDataAddress = addressOrEnsOrAnySchema()
      .required()
      .label('protectedDataAddress')
      .validateSync(protectedDataAddress);
    const sharingContract = await getSharingContract();
    const rentingParams = await sharingContract.protectedDataForRenting(
      vCollectionId,
      vProtectedDataAddress
    );
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
      txHash: txReceipt.hash,
      success: true,
    };
  } catch (e) {
    console.log(e.message);
    throw new WorkflowError('Failed to rent Protected Data', e);
  }
};
