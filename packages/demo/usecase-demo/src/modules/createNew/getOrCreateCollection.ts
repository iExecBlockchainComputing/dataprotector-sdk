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

  if (collectionsResult.collections?.length > 0) {
    if (collectionsResult.collections?.length >= 2) {
      console.log(
        `It looks like you have more than one collection. The first one will be used. (id: ${collectionsResult.collections[0].id})`
      );
    }
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
