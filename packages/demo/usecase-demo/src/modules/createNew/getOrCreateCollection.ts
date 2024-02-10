import type { OnStatusUpdateFn } from '@iexec/dataprotector';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';
import { useUserStore } from '../../stores/user.store.ts';

export async function getOrCreateCollection({
  onStatusUpdate,
}: {
  onStatusUpdate: OnStatusUpdateFn;
}) {
  const dataProtector = await getDataProtectorClient();
  const ownerAddress = useUserStore.getState().address!;

  onStatusUpdate({
    title: 'Get existing collections',
    isDone: false,
  });
  const collections = await dataProtector.getCollectionsByOwner({
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
    return collections[0].id;
  }

  onStatusUpdate({
    title: "Create user's first collection",
    isDone: false,
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
