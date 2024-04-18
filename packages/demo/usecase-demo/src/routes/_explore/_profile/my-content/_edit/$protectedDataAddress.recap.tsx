import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { Button } from '@/components/ui/button.tsx';
import { OneContentCard } from '@/modules/home/latestContent/OneContentCard.tsx';
import { myCollectionsQuery } from '@/modules/profile/myCollections.query.ts';
import { useUserStore } from '@/stores/user.store.ts';
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
    <>
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

                {/*<div className="mt-3">Current renters: -</div>*/}

                {!data.protectedData.isRentable &&
                  !data.protectedData.isIncludedInSubscription &&
                  !data.protectedData.isForSale && (
                    <Button asChild className="mt-6">
                      <Link
                        to={
                          '/my-content/edit/$protectedDataAddress/monetization'
                        }
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
          <Alert variant="info" className="mt-6">
            <p>
              DataProtector Sharing SDK includes all necessary methods to update
              a protected data monetization.
            </p>
          </Alert>
        )}
    </>
  );
}
