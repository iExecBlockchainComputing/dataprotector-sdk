import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { ClickToExpand } from '@/components/ClickToExpand.tsx';
import { DocLink } from '@/components/DocLink';
import { Button } from '@/components/ui/button.tsx';
import { OneContentCard } from '@/modules/home/latestContent/OneContentCard.tsx';
import { myCollectionsQuery } from '@/modules/profile/myCollections.query.ts';
import { useUserStore } from '@/stores/user.store.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';
import { secondsToDays } from '@/utils/secondsToDays.ts';
import { timestampToReadableDate } from '@/utils/timestampToReadableDate.ts';

export const Route = createFileRoute(
  '/_explore/_profile/my-content/_edit/$protectedDataAddress/recap'
)({
  // parseParams: (params) => ({
  //   protectedDataAddress: z.string(),
  // }),
  component: OneContent,
});

function OneContent() {
  const { protectedDataAddress } = Route.useParams();

  const { address } = useUserStore();

  const { data, error, isLoading } = useQuery({
    ...myCollectionsQuery({
      address: address!,
      includeHiddenProtectedDatas: true,
    }),
    select: (data) => {
      for (const collection of data) {
        for (const protectedData of collection.protectedDatas) {
          if (protectedData.id === protectedDataAddress.toLowerCase()) {
            return {
              protectedData,
              collection,
            };
          }
        }
      }
    },
  });

  return (
    <div className="rounded-3xl border border-grey-800 p-10">
      <div className="flex gap-x-8">
        <div className="w-full">
          {error && (
            <Alert variant="error" className="mb-4">
              <p>Oops, something went wrong when retrieving this content.</p>
              <p className="mt-1 text-sm">{error.toString()}</p>
            </Alert>
          )}

          {isLoading && (
            <div className="mt-4 flex flex-col items-center gap-y-4">
              <CircularLoader />
            </div>
          )}

          {data?.protectedData && (
            <div className="flex w-full flex-col items-start gap-x-10 gap-y-6 min-[900px]:flex-row">
              <div className="flex w-full flex-1 justify-center min-[900px]:justify-end">
                <OneContentCard
                  protectedData={data.protectedData}
                  linkToDetails="/content/$protectedDataAddress"
                  showLockIcon={false}
                  className="w-full max-w-[343px]"
                />
              </div>

              <div className="mt-2 w-full flex-1 text-center min-[900px]:text-left">
                <h2 className="text-xl font-extrabold">Information Summary</h2>

                <div className="mt-3">{data.protectedData.name}</div>
                <div className="mt-1.5">
                  <span className="text-grey-400">Date of upload:</span>&nbsp;
                  {timestampToReadableDate(
                    data.protectedData.creationTimestamp
                  )}
                </div>
                {data.protectedData && data.protectedData.rentalParams && (
                  <div className="mt-1.5">
                    <span className="text-grey-400">Rent:</span>{' '}
                    {nrlcToRlc(data.protectedData.rentalParams.price)} RLC /{' '}
                    {Math.round(
                      Number(
                        secondsToDays(data.protectedData.rentalParams.duration)
                      )
                    )}{' '}
                    days
                  </div>
                )}

                {/*<div className="mt-3">Current renters: -</div>*/}

                {!data.protectedData.isRentable &&
                  !data.protectedData.isIncludedInSubscription &&
                  !data.protectedData.isForSale && (
                    <Button asChild className="mt-6">
                      <Link
                        to={'/my-content/$protectedDataAddress/monetization'}
                        params={{ protectedDataAddress: data.protectedData.id }}
                      >
                        Choose monetization
                      </Link>
                    </Button>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
      {data?.protectedData &&
        (data.protectedData.isRentable ||
          data.protectedData.isIncludedInSubscription ||
          data.protectedData.isForSale) && (
          <ClickToExpand
            className="mx-auto mt-10 w-full max-w-[calc(686px+2.5rem)]"
            title="Limits of demo"
          >
            DataProtector Sharing SDK includes all necessary methods to update a
            protected data monetization.
          </ClickToExpand>
        )}
      <DocLink className="mx-auto mb-14 mt-6 max-w-[calc(686px+2.5rem)]">
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
          &nbsp;&nbsp;includeHiddenProtectedDatas: true,
          <br />
          {'}'});
        </a>
      </DocLink>
    </div>
  );
}
