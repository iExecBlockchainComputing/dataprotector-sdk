import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { ProtectedData } from '../../../../src';
import { Alert } from '../components/Alert.tsx';
import { CircularLoader } from '../components/CircularLoader.tsx';
import { OneContentCard } from '../components/OneContentCard.tsx';
import { Button } from '../components/ui/button.tsx';
import { getDataProtectorClient } from '../externals/dataProtectorClient.ts';

console.log(
  'SC Address',
  import.meta.env.VITE_CONTENT_CREATOR_SMART_CONTRACT_ADDRESS
);

export function AllContent() {
  const { connector } = useAccount();

  const { isLoading, isError, error, data } = useQuery<
    ProtectedData[],
    unknown
  >({
    queryKey: ['allContent'],
    queryFn: async () => {
      const dataProtector = await getDataProtectorClient({
        connector: connector!,
      });
      // Query au subgraph depuis le SDK:
      // ProtectedData where owner === content creator smart contract
      // OU where collection != null
      const userContent: ProtectedData[] =
        await dataProtector.fetchProtectedData({
          owner: import.meta.env.VITE_CONTENT_CREATOR_SMART_CONTRACT_ADDRESS,
        });
      return userContent;
    },
    enabled: !!connector,
    // refetchOnMount: false,
    // refetchOnWindowFocus: false,
  });

  return (
    <div className="mb-28 mt-16 w-full">
      {isLoading && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error">
          <p>Oops, something went wrong while fetching all content.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {data?.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          No content yet...
        </div>
      )}

      {data?.length > 0 && (
        <>
          <div className="flex gap-x-6">
            <Button variant="secondary" className="border-grey-50">
              All
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Articles
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Music
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Graphic
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Image
            </Button>
          </div>
          <div
            className="mt-12 grid w-full gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {data?.map((content) => (
              <div key={content.address}>
                <OneContentCard content={content} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
