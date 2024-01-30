import { Address, Connector } from 'wagmi';
import { OnStatusUpdateFn } from '../../../../../sdk/src';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';
import { getCollectionsByOwner } from '../../externals/subgraph/getCollectionsByOwner.ts';

export async function getOrCreateCollection({
  connector,
  ownerAddress,
  onStatusUpdate,
}: {
  connector: Connector;
  ownerAddress: Address;
  onStatusUpdate: OnStatusUpdateFn;
}) {
  onStatusUpdate({
    title: 'Get existing collections',
    isDone: false,
  });
  const collections = await getCollectionsByOwner({
    connector,
    ownerAddress,
  });
  onStatusUpdate({
    title: 'Get existing collections',
    isDone: true,
  });

  if (collections?.length >= 2) {
    throw new Error(
      'It looks like you have more than one collection, please provide `collectionId` parameter.'
    );
  }

  if (collections?.length === 1) {
    return Number(collections[0].id);
  }

  onStatusUpdate({
    title: "Create user's first collection",
    isDone: false,
  });
  const dataProtector = await getDataProtectorClient({
    connector: connector!,
  });
  const { collectionId: createdCollectionId } =
    await dataProtector.createCollection();
  onStatusUpdate({
    title: "Create user's first collection",
    isDone: true,
    payload: {
      createdCollectionId: String(createdCollectionId),
    },
  });
  return createdCollectionId;
}
