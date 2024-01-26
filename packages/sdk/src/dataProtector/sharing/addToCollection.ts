import type { GraphQLClient } from 'graphql-request';
import type { IExec } from 'iexec';
import { createArrayBufferFromFile } from '../../utils/createArrayBufferFromFile.js';
import { throwIfMissing } from '../../utils/validators.js';
import { protectDataObservable } from '../protectDataObservable.js';
import {
  Address,
  AddressOrENS,
  AddToCollectionParams,
  AddToCollectionStatusFn,
  IExecConsumer,
  ProtectDataMessage,
  SubgraphConsumer,
} from '../types.js';
import { createCollection } from './createCollection.js';
import { addProtectedDataToCollection } from './smartContract/addProtectedDataToCollection.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';
import { getCreatorCollections } from './subgraph/getCreatorCollections.js';

export const addToCollection = async ({
  iexec = throwIfMissing(),
  ipfsNode,
  ipfsGateway,
  graphQLClient = throwIfMissing(),
  dataProtectorContractAddress,
  sharingContractAddress,
  file,
  protectedDataAddress: existingProtectedDataAddress,
  collectionId,
  addStatus,
}: IExecConsumer & {
  ipfsNode: string;
  ipfsGateway: string;
} & SubgraphConsumer & {
    dataProtectorContractAddress: AddressOrENS;
    sharingContractAddress: AddressOrENS;
  } & AddToCollectionParams): Promise<void> => {
  // TODO: How to check that addStatus is a function?
  // https://zod.dev/?id=functions
  // const vAddStatus: string = addressSchema().label('owner').validateSync(owner);

  let protectedDataAddress = existingProtectedDataAddress;

  if (!protectedDataAddress) {
    const createProtectedDataResult = await createProtectedData({
      iexec,
      ipfsNode,
      ipfsGateway,
      dataProtectorContractAddress,
      file,
      addStatus,
    });
    protectedDataAddress = createProtectedDataResult.protectedDataAddress;
  }

  console.log('collectionId', collectionId);

  if (collectionId) {
    // TODO: Check that collection belongs to user?
  }

  // FOR TESTS
  let targetCollectionId = 12;

  if (!targetCollectionId) {
    targetCollectionId = await getOrCreateCollection({
      iexec,
      sharingContractAddress,
      graphQLClient,
    });
  }
  console.log('targetCollectionId', targetCollectionId);

  addStatus?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: false,
  });
  // await new Promise((resolve) => setTimeout(resolve, 300));
  // Approve collection SC to change the owner of my protected data in the registry SC
  await approveCollectionContract({
    iexec,
    graphQLClient,
    protectedDataAddress,
    sharingContractAddress,
  });
  addStatus?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  addStatus?.({
    title: 'Add protected data to your collection',
    isDone: false,
  });
  // await new Promise((resolve) => setTimeout(resolve, 300));
  await addProtectedDataToCollection({
    iexec,
    sharingContractAddress,
    collectionId: targetCollectionId,
    protectedDataAddress,
  });
  addStatus?.({
    title: 'Add protected data to your collection',
    isDone: true,
  });
};

async function createProtectedData({
  iexec,
  ipfsNode,
  ipfsGateway,
  dataProtectorContractAddress,
  file,
  addStatus,
}: {
  iexec: IExec;
  ipfsNode: string;
  ipfsGateway: string;
  dataProtectorContractAddress: AddressOrENS;
  file: File;
  addStatus: AddToCollectionStatusFn;
}): Promise<{ protectedDataAddress: Address }> {
  const fileAsArrayBuffer = await createArrayBufferFromFile(file);

  addStatus?.({
    title: 'Create protected data into DataProtector registry smart-contract',
    isDone: false,
  });

  let address: Address;
  const protectedDataAddress: string = await new Promise((resolve, reject) => {
    try {
      protectDataObservable({
        iexec,
        contractAddress: dataProtectorContractAddress,
        ipfsNode,
        ipfsGateway,
        data: { file: fileAsArrayBuffer },
        name: file.name,
      }).subscribe(
        (messageData: ProtectDataMessage) => {
          console.log('protectDataObservable / messageData', messageData);
          const { message } = messageData;
          if (message === 'PROTECTED_DATA_DEPLOYMENT_SUCCESS') {
            address = messageData.address;
            addStatus?.({
              title:
                'Create protected data into DataProtector registry smart-contract',
              isDone: true,
              payload: {
                protectedDataAddress: address,
                explorerUrl: `https://explorer.iex.ec/${address}`,
              },
            });
            addStatus?.({
              title: 'Push protected data encryption key to iExec SMS',
              isDone: false,
            });
          }
          if (message === 'PUSH_SECRET_TO_SMS_SUCCESS') {
            addStatus?.({
              title: 'Push protected data encryption key to iExec SMS',
              isDone: true,
            });
          }
        },
        (err) => {
          console.log('[protectDataObservable] Error', err);
          reject(err);
        },
        () => {
          console.log('DONE');
          resolve(address);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
  return { protectedDataAddress };
}

async function getOrCreateCollection({
  iexec,
  sharingContractAddress,
  graphQLClient,
}: {
  iexec: IExec;
  sharingContractAddress: Address;
  graphQLClient: GraphQLClient;
}) {
  const { signer } = await iexec.config.resolveContractsClient();

  // Get user's collections
  const userAddress = await signer.getAddress();
  console.log('userAddress', userAddress);
  const collections = await getCreatorCollections({
    graphQLClient,
    creatorAddress: userAddress,
  });
  console.log('Existing collections', collections);

  if (collections?.length >= 2) {
    throw new Error(
      'It looks like you have more than one collection, please provide `collectionId` parameter.'
    );
  }

  if (collections?.length === 1) {
    console.log('Has exactly one collection');
    return Number(collections[0].id);
  }

  console.log('Create first collection for user');
  const { collectionId: createdCollectionId } = await createCollection({
    iexec,
    sharingContractAddress,
  });
  console.log('createdCollectionId', createdCollectionId);
  return createdCollectionId;
}
