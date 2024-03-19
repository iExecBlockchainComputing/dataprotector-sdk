import { Button } from '@/components/ui/button.tsx';
import { Address, ProtectedData } from '@iexec/dataprotector';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { myCollectionsQuery } from '@/modules/profile/myCollections.query.ts';
import { MyContentCard } from '@/modules/profile/myContent/MyContentCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';

export const Route = createFileRoute('/_explore/_profile/my-content/')({
  component: MyContent,
});

function MyContent() {
  const { isConnected, address } = useUserStore();

  const {
    isLoading,
    isSuccess,
    isError,
    error,
    data: protectedDatas,
  } = useQuery({
    ...myCollectionsQuery({ address: address!, isConnected }),
    select: (data) => {
      const protectedDatas: Array<
        Omit<ProtectedData, 'address' | 'owner' | 'schema'> & {
          id: Address;
          collectionId: bigint;
        }
      > = [];
      for (const collection of data) {
        const datas = collection.protectedDatas.map((protectedData) => ({
          ...protectedData,
          collectionId: collection.id,
        }));
        protectedDatas.push(...datas);
      }
      return protectedDatas;
    },
  });

  return (
    <div className="w-full">
      {!protectedDatas?.length && (
        <div className="mb-6 italic">You don't have any content yet.</div>
      )}

      <Button asChild>
        <Link to={'/my-content/new'}>
          <Plus size="18" />
          <span className="ml-1.5">New content</span>
        </Link>
      </Button>

      {protectedDatas?.length > 0 && (
        <div className="mt-9 text-xl">Last content</div>
      )}

      {isLoading && (
        <div className="mt-8 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error">
          <p>Oops, something went wrong while fetching your content.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      <div
        className="mt-8 grid w-full gap-6"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {!!protectedDatas?.length &&
          protectedDatas?.length > 0 &&
          protectedDatas.map((oneProtectedData) => (
            <div key={oneProtectedData.id}>
              <MyContentCard protectedData={oneProtectedData} />
            </div>
          ))}
      </div>
    </div>
  );
}
