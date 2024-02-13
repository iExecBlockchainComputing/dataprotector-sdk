import { Transaction } from 'ethers';
import type { GraphQLClient } from 'graphql-request';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../config/config.js';
import { ErrorWithData } from '../../utils/errors.js';
import {
  addressSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { Address, IExecConsumer, SubgraphConsumer } from '../types.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

// TODO: Create proper input type
// TODO: Create proper output type

export const setProtectedDataForSale = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  protectedDataAddress,
  priceInNRLC,
}: IExecConsumer &
  SubgraphConsumer & {
    protectedDataAddress: Address;
    priceInNRLC: number;
  }): Promise<{
  success: boolean;
  transaction: Transaction;
}> => {
  addressSchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  positiveNumberSchema()
    .required()
    .label('priceInNRLC')
    .validateSync(priceInNRLC);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();

  const protectedData = await checkAndGetProtectedData({
    graphQLClient,
    protectedDataAddress,
    userAddress,
  });

  const sharingContract = await getSharingContract();
  const tx = await sharingContract.setProtectedDataForSale(
    protectedData.collection.id,
    protectedData.id,
    priceInNRLC
  );

  return {
    success: true,
    transaction: tx,
  };
};

async function checkAndGetProtectedData({
  graphQLClient,
  protectedDataAddress,
  userAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  userAddress: Address;
}) {
  const protectedData = await getProtectedDataById({
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
      'This protected data is not owned by the sharing contract. First call addToCollection()',
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

  if (
    protectedData.isRentable === true &&
    protectedData.isIncludedInSubscription === true
  ) {
    throw new ErrorWithData(
      'This protected data is currently for rent and included in your subscription. First call removeProtectedDataFromRenting() and removeProtectedDataFromSubscription()',
      {
        protectedDataAddress,
      }
    );
  }

  if (protectedData.isRentable === true) {
    throw new ErrorWithData(
      'This protected data is currently for rent. First call removeProtectedDataFromRenting()',
      {
        protectedDataAddress,
      }
    );
  }

  if (protectedData.isIncludedInSubscription === true) {
    // TODO: Create removeProtectedDataFromSubscription() method
    throw new ErrorWithData(
      'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()',
      {
        protectedDataAddress,
      }
    );
  }

  // TODO: Uncomment when isForSale available in the subgraph
  // if (protectedData.isForSale === true) {
  //   throw new ErrorWithData(
  //     'This protected data is already for sale.',
  //     {
  //       protectedDataAddress,
  //     }
  //   );
  // }

  return protectedData;
}
