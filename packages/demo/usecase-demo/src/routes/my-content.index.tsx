import { useQuery } from '@tanstack/react-query';
import { FileRoute, Link, Outlet } from '@tanstack/react-router';
import { useAccount } from 'wagmi';
import { ProtectedData } from '../../../../sdk';
import { Alert } from '../components/Alert.tsx';
import { CircularLoader } from '../components/CircularLoader.tsx';
import { getDataProtectorClient } from '../externals/dataProtectorClient.ts';
import CreatorLeftNav from '../components/CreatorLeftNav/CreatorLeftNav.tsx';

export const Route = new FileRoute('/my-content/').createRoute({
  component: MyContent,
});

function MyContent() {
  const { connector, address } = useAccount();

  const { isLoading, isError, error, data } = useQuery<
    ProtectedData[],
    unknown
  >({
    queryKey: ['myContent'],
    queryFn: async () => {
      const dataProtector = await getDataProtectorClient({
        connector: connector!,
      });
      const protectedDatas = await dataProtector.fetchCreatorProtectedData({
        creatorAddress: address,
      });
      console.log('protectedDatas', protectedDatas);
      return protectedDatas;
    },
    enabled: !!connector,
    // refetchOnMount: false,
    // refetchOnWindowFocus: false,
  });

  return (
    <div className="flex gap-x-8">
      <CreatorLeftNav />
      <div className="w-full">
        <h2 className="mb-2 font-anybody font-bold">My Content</h2>

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

        {data?.length === 0 && (
          <div className="mt-4 flex flex-col items-center gap-y-4">
            No content yet...
          </div>
        )}

        {data?.length > 0 &&
          data.map(({ id, name }) => (
            <div key={id} className="flex gap-x-2">
              <div>{name}</div>
              <Link to="/my-content/$contentId" params={{ contentId: id }}>
                Edit price
              </Link>
            </div>
          ))}
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
