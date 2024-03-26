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

  onStatusUpdate({
    title: 'Get existing collections',
    isDone: false,
  });
  const collectionsResult =
    await dataProtector.dataProtectorSharing.getCollectionsByOwner({
      ownerAddress,
    });
  onStatusUpdate({
    title: 'Get existing collections',
    isDone: true,
  });

  if (collectionsResult.collections?.length >= 2) {
    throw new Error(
      'It looks like you have more than one collection, please provide `collectionTokenId` parameter.'
    );
  }

  if (collectionsResult.collections?.length === 1) {
    return collectionsResult.collections[0].id;
  }

  onStatusUpdate({
    title: "Create user's first collection",
    isDone: false,
  });
  const { collectionTokenId: createdCollectionTokenId } =
    await dataProtector.dataProtectorSharing.createCollection();
  onStatusUpdate({
    title: "Create user's first collection",
    isDone: true,
    payload: {
      createdCollectionTokenId: String(createdCollectionTokenId),
    },
  });
  return createdCollectionTokenId;
}
