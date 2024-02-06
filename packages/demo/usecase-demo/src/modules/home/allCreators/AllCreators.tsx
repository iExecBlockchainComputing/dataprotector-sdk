import { useQuery } from '@tanstack/react-query';
import { Address } from 'wagmi';
import { Alert } from '../../../components/Alert.tsx';
import { CircularLoader } from '../../../components/CircularLoader.tsx';
import { getDataProtectorClient } from '../../../externals/dataProtectorClient.ts';
import { useUserStore } from '../../../stores/user.store.ts';
import { OneCreatorCard } from './OneCreatorCard.tsx';

export function AllCreators() {
  const { isConnected } = useUserStore();

  const { isLoading, isError, error, data } = useQuery<
    Array<{ address: Address }>,
    unknown
  >({
    queryKey: ['allCreators'],
    queryFn: async () => {
      const dataProtector = await getDataProtectorClient();
      const allCreators = await dataProtector.getCreators();
      return allCreators;
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
        <Alert variant="error">
          <p>Oops, something went wrong while fetching all creators.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {data?.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          No creator? 🤔
        </div>
      )}

      <div
        className="mt-8 grid w-full gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}
      >
        {data?.map((creator) => (
          <div key={creator.address}>
            <OneCreatorCard creator={creator} />
          </div>
        ))}
      </div>
    </>
  );
}
