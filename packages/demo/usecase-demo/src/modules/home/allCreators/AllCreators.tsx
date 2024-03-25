import { useQuery } from '@tanstack/react-query';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { useUserStore } from '@/stores/user.store.ts';
import { OneCreatorCard } from './OneCreatorCard.tsx';

export function AllCreators() {
  const { isConnected } = useUserStore();

  const {
    isLoading,
    isSuccess,
    data: firstTenCollections,
    isError,
    error,
  } = useQuery<
    Array<{ collectionTokenId: number; ownerAddress: string }>,
    unknown
  >({
    queryKey: ['allCreators'],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const { collections } = await dataProtectorSharing.getCollections({
        includeEmptyCollections: false,
      });
      return collections;
    },
    enabled: isConnected,
  });

  return (
    <>
      <h3 className="text-2xl font-bold">All creators</h3>

      {isLoading && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error" className="mt-4">
          <p>Oops, something went wrong while fetching all creators.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && firstTenCollections.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          No creator? 🤔
        </div>
      )}

      {isSuccess && firstTenCollections.length > 0 && (
        <div
          className="mt-8 grid w-full gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {firstTenCollections?.map((collection) => (
            <div key={collection.collectionTokenId}>
              <OneCreatorCard creator={{ address: collection.ownerAddress }} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
