import { useQuery } from '@tanstack/react-query';
import { FileRoute, Link } from '@tanstack/react-router';
import { ProtectedData } from '../../../../../sdk';
import { Alert } from '../../components/Alert.tsx';
import { CircularLoader } from '../../components/CircularLoader.tsx';
import { useUser } from '../../hooks/useUser.ts';
import { getMyContent } from '../../modules/profile/myContent/subgraphQuery.ts';

export const Route = new FileRoute('/_profile/my-content2').createRoute({
  component: MyContent2,
});

function MyContent2() {
  const { connector, address } = useUser();

  const { isLoading, isError, error, data } = useQuery<
    Array<Pick<ProtectedData, 'address' | 'name'>>,
    unknown
  >({
    queryKey: ['myContent'],
    queryFn: () =>
      getMyContent({ connector: connector!, userAddress: address! }),
    enabled: !!connector && !!address,
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

      {!isError && data?.length === 0 && (
        <div className="flex flex-col items-center gap-y-4">
          No content yet...
        </div>
      )}

      {!!data?.length &&
        data?.length > 0 &&
        data.map(({ address, name }) => (
          <div key={address} className="flex gap-x-2">
            <div>{name}</div>
            <Link to="/my-content/$contentId" params={{ contentId: address }}>
              Edit price
            </Link>
          </div>
        ))}
    </div>
  );
}
