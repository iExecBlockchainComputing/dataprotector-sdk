import { useQuery } from '@tanstack/react-query';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { DocLink } from '@/components/DocLink.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { OneCreatorCard } from './OneCreatorCard.tsx';

export function AllCreators() {
  const {
    isLoading,
    isSuccess,
    data: firstTenAccounts,
    isError,
    error,
  } = useQuery({
    queryKey: ['allCreators'],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const { collectionOwners } =
        await dataProtectorSharing.getCollectionOwners({
          limit: 8,
        });
      return collectionOwners;
    },
  });

  return (
    <>
      <h3 className="text-2xl font-bold">Hot creators 🔥</h3>

      {isLoading && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error" className="mt-4">
          <p>Oops, something went wrong while fetching all creators.</p>
          <p className="mt-1 text-sm">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && firstTenAccounts.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          No creator? 🤔
        </div>
      )}

      {isSuccess && firstTenAccounts.length > 0 && (
        <div
          className="mt-8 grid w-full gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          }}
        >
          {firstTenAccounts?.map((account) => (
            <div key={account.id}>
              <OneCreatorCard
                creator={account}
                showSubscribedChip={account.hasActiveSubscription}
                className="h-full"
              />
            </div>
          ))}
        </div>
      )}

      <DocLink className="mb-14 mt-8">
        dataprotector-sdk / Method called:{' '}
        <a
          href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getCollectionOwners.html"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          <br />
          getCollectionOwners({'{'} limit: 8 {'}'})
        </a>
      </DocLink>
    </>
  );
}
