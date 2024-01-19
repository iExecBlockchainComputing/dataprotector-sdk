import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import type { Collection } from '../../../../sdk/src';
import { getDataProtectorClient } from '../externals/dataProtectorClient.ts';
import CreatorLeftNav from './MyProfile/CreatorLeftNav.tsx';

export function MyProfile(props) {
  const { connector, address } = useAccount();

  const { isLoading, isError, error, data } = useQuery<Collection[], unknown>({
    queryKey: ['myContent'],
    queryFn: async () => {
      const dataProtector = await getDataProtectorClient({
        connector: connector!,
      });
      const userCollections: Collection[] =
        await dataProtector.fetchCollections({
          owner: address,
        });
      return userCollections;
    },
    enabled: !!connector,
    // refetchOnMount: false,
    // refetchOnWindowFocus: false,
  });

  return (
    <div className="flex gap-x-8">
      <CreatorLeftNav />
      <div>My Content</div>
    </div>
  );
}
