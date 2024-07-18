import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { DocLink } from '@/components/DocLink';
import { Button } from '@/components/ui/button.tsx';
import { OneContentCard } from '@/modules/home/latestContent/OneContentCard.tsx';
import { myCollectionsQuery } from '@/modules/profile/myCollections.query.ts';
import { useUserStore } from '@/stores/user.store.ts';

export const Route = createFileRoute('/_explore/_profile/my-content/')({
  component: MyContent,
});

function MyContent() {
  const { address } = useUserStore();

  const {
    isLoading,
    isSuccess,
    data: protectedDatas,
    isError,
    error,
  } = useQuery({
    ...myCollectionsQuery({
      address: address!,
      includeHiddenProtectedDatas: true,
    }),
    select: (userCollections) => {
      if (!userCollections?.length) {
        return [];
      }
      return userCollections[0].protectedDatas;
    },
  });

  return (
    <div className="w-full">
      <Button asChild>
        <Link to={'/my-content/new'}>
          <Plus size="18" />
          <span className="ml-1.5">New content</span>
        </Link>
      </Button>

      {isLoading && (
        <div className="mt-8 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error" className="mt-8">
          <p>Oops, something went wrong while fetching your content.</p>
          <p className="mt-1 text-sm">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && protectedDatas.length === 0 && (
        <div className="mt-6 italic">You don't have any content yet.</div>
      )}

      {isSuccess && protectedDatas.length > 0 && (
        <>
          <div className="mt-9 text-xl">Last content</div>
          <div
            className="mt-8 grid w-full gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            }}
          >
            {protectedDatas.map((oneProtectedData) => (
              <OneContentCard
                key={oneProtectedData.id}
                protectedData={oneProtectedData}
                showLockIcon={false}
                linkToDetails="/my-content/$protectedDataAddress/recap"
              />
            ))}
          </div>
          <DocLink className="mx-auto mt-6">
            dataprotector-sdk / Method called:{' '}
            <a
              href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getCollectionsByOwner.html"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              <br />
              getCollectionsByOwner({'{'}
              <br />
              &nbsp;&nbsp;owner: "{address}",
              <br />
              {'}'});
            </a>
          </DocLink>
        </>
      )}
    </div>
  );
}
