import type { GraphQLClient } from 'graphql-request';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../config/config.js';
import { ErrorWithData } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
} from '../../utils/validators.js';
import { IExecDataProtector } from '../IExecDataProtector.js';
import {
  Address,
  SetProtectedDataForSaleParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export async function setProtectedDataForSale(
  this: IExecDataProtector,
  { protectedDataAddress, priceInNRLC }: SetProtectedDataForSaleParams
): Promise<SuccessWithTransactionHash> {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const vPriceInNRLC = positiveNumberSchema()
    .required()
    .label('priceInNRLC')
    .validateSync(priceInNRLC);

  const userAddress = (await this.iexec.wallet.getAddress()).toLowerCase();

  const protectedData = await checkAndGetProtectedData({
    graphQLClient: this.graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });

  const sharingContract = await getSharingContract(
    this.iexec,
    this.sharingContractAddress
  );
  const tx = await sharingContract.setProtectedDataForSale(
    protectedData.collection.id,
    protectedData.id,
    vPriceInNRLC
  );
  await tx.wait();

  return {
    success: true,
    txHash: tx.hash,
  };
}

async function checkAndGetProtectedData({
  graphQLClient,
  protectedDataAddress,
  userAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  userAddress: Address;
}) {
  const { protectedData } = await getProtectedDataById({
    graphQLClient,
    protectedDataAddress,
  });

  if (!protectedData) {
    throw new ErrorWithData(
      'This protected data does not exist in the subgraph.',
      { protectedDataAddress }
    );
  }

  if (protectedData.owner.id !== DEFAULT_SHARING_CONTRACT_ADDRESS) {
    throw new ErrorWithData(
      'This protected data is not owned by the sharing contract, hence a sharing-related method cannot be called.',
      {
        protectedDataAddress,
        currentOwnerAddress: protectedData.owner.id,
      }
    );
  }

  if (protectedData.collection?.owner?.id !== userAddress) {
    throw new ErrorWithData(
      'This protected data is not part of a collection owned by the user.',
      {
        protectedDataAddress,
        currentCollectionOwnerAddress: protectedData.collection?.owner?.id,
      }
    );
  }

  const hasActiveRentals = protectedData.rentals.length > 0;

  if (hasActiveRentals) {
    throw new ErrorWithData('This protected data has active rentals.', {
      protectedDataAddress,
      activeRentalsCount: protectedData.rentals.length,
    });
  }

  if (protectedData.isRentable && protectedData.isIncludedInSubscription) {
    throw new ErrorWithData(
      'This protected data is currently for rent and included in your subscription. First call removeProtectedDataFromRenting() and removeProtectedDataFromSubscription()',
      {
        protectedDataAddress,
      }
    );
  }

  if (protectedData.isRentable) {
    throw new ErrorWithData(
      'This protected data is currently for rent. First call removeProtectedDataFromRenting()',
      {
        protectedDataAddress,
      }
    );
  }

  if (protectedData.isIncludedInSubscription) {
    // TODO: Create removeProtectedDataFromSubscription() method
    throw new ErrorWithData(
      'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()',
      {
        protectedDataAddress,
      }
    );
  }

  if (protectedData.isForSale) {
    throw new ErrorWithData('This protected data is already for sale.', {
      protectedDataAddress,
    });
  }

  return protectedData;
}
