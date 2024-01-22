import { useQuery } from '@tanstack/react-query';
import { FileRoute, Link, Outlet } from '@tanstack/react-router';
import { useAccount } from 'wagmi';
import { ProtectedData } from '../../../../sdk';
import { getDataProtectorClient } from '../externals/dataProtectorClient.ts';
import CreatorLeftNav from '../pages/MyProfile/CreatorLeftNav.tsx';

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
      console.log('go');
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

        {data &&
          data.map(({ id, name }) => (
            <div key={id} className="flex gap-x-2">
              <div>{name}</div>
              <Link to={`/my-content/${id}`}>Edit price</Link>
            </div>
          ))}
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
