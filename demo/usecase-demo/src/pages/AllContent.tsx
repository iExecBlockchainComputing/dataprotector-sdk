import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { ProtectedData } from '../../../../src';
import { Alert } from '../components/Alert.tsx';
import { CircularLoader } from '../components/CircularLoader.tsx';
import { Button } from '../components/ui/button.tsx';
import { getDataProtectorClient } from '../externals/dataProtectorClient.ts';

console.log('SC Address', import.meta.env.VITE_CONTENT_CREATOR_SMART_CONTRACT_ADDRESS)

export function AllContent() {
  const { connector } = useAccount();

  const { isLoading, isError, error, data } = useQuery<ProtectedData[], unknown>({
    queryKey: ['allContent'],
    queryFn: async () => {
      const dataProtector = await getDataProtectorClient({
        connector: connector!,
      });
      // Query au subgraph depuis le SDK: ProtectedData where owner === content creator smart contract
      // Ou where collection != null
      const userContent: ProtectedData[] = await dataProtector.fetchProtectedData({
        owner: import.meta.env.VITE_CONTENT_CREATOR_SMART_CONTRACT_ADDRESS
      })
      console.log('userContent', userContent)
      return userContent;
    },
    enabled: !!connector,
    // refetchOnMount: false,
    // refetchOnWindowFocus: false,
  });

  return (
    <div className="mt-10 mb-28 w-full">
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
          <div className="mx-12 flex gap-x-6">
            <Button>Images</Button>
            <Button variant="secondary">
              Videos
              <span className="-mb-[2px] ml-1 text-[0.6rem]">(TODO)</span>
            </Button>
            <Button variant="secondary">
              Documents
              <span className="-mb-[2px] ml-1 text-[0.6rem]">(TODO)</span>
            </Button>
            <Button variant="secondary">
              Other
              <span className="-mb-[2px] ml-1 text-[0.6rem]">(TODO)</span>
            </Button>
          </div>
          <div
            className="mx-6 mt-12 grid w-full gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, 170px)',
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
