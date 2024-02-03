import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'react-feather';
import { Alert } from '../../components/Alert.tsx';
import { CircularLoader } from '../../components/CircularLoader.tsx';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';
import { OneCollection } from '../../modules/profile/OneCollection.tsx';
import { useUserStore } from '../../stores/user.store.ts';

export const Route = createFileRoute('/_profile/my-collections')({
  component: MyCollections,
});

function MyCollections() {
  const { isConnected, address } = useUserStore();

  const {
    isLoading,
    isError,
    error,
    data: collections,
  } = useQuery<Array<{ id: bigint }>>({
    queryKey: ['myContent', address],
    queryFn: async () => {
      const dataProtector = await getDataProtectorClient();
      return dataProtector.getCollectionsByOwner({ ownerAddress: address! });
    },
    enabled: isConnected,
  });

  return (
    <div className="w-full">
      {isLoading && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error">
          <p>Oops, something went wrong while fetching your content.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {!isError && collections?.length === 0 && (
        <div className="flex flex-col items-center gap-y-4">
          No content yet...
        </div>
      )}

      <div
        className="mt-8 grid w-full gap-6"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {!!collections?.length &&
          collections?.length > 0 &&
          collections.map(({ id }) => (
            <div key={id} className="rounded-2xl border border-grey-700 p-6">
              <OneCollection collectionId={Number(id)} />
            </div>
          ))}

        <div className="rounded-2xl border border-grey-700 p-6">
          <div className="flex items-center">
            <Plus size="20" className="mr-1.5" />
            Add collection
          </div>
        </div>
      </div>
    </div>
  );
}
