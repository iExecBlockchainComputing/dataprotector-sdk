import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { useUserStore } from '@/stores/user.store.ts';

type CreateCollectionStatusUpdateFn = (params: {
  title: string;
  isDone: boolean;
  payload?: Record<string, string>;
}) => void;

export async function getOrCreateCollection({
  onStatusUpdate,
}: {
  onStatusUpdate: CreateCollectionStatusUpdateFn;
}) {
  const dataProtector = await getDataProtectorClient();
  const ownerAddress = useUserStore.getState().address!;

  const collectionsResult =
    await dataProtector.dataProtectorSharing.getCollectionsByOwner({
      owner: ownerAddress,
    });

  if (collectionsResult.collections?.length >= 2) {
    throw new Error(
      'It looks like you have more than one collection, please provide `collectionId` parameter to addToCollection()'
    );
  }

  if (collectionsResult.collections?.length === 1) {
    return collectionsResult.collections[0].id;
  }

  onStatusUpdate({
    title: "Create user's first collection",
    isDone: false,
  });
  const { collectionId: createdCollectionId } =
    await dataProtector.dataProtectorSharing.createCollection();
  onStatusUpdate({
    title: "Create user's first collection",
    isDone: true,
    payload: {
      createdCollectionId: String(createdCollectionId),
    },
  });
  return createdCollectionId;
}
