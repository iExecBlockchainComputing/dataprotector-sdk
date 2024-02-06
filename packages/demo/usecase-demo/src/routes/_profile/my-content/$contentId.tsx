import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader } from 'react-feather';
import { Button } from '../../../components/ui/button.tsx';
import { getDataProtectorClient } from '../../../externals/dataProtectorClient.ts';
import { myCollectionsQuery } from '../../../modules/profile/myCollections.query.ts';
import { useUserStore } from '../../../stores/user.store.ts';

export const Route = createFileRoute('/_profile/my-content/$contentId')({
  // parseParams: (params) => ({
  //   contentId: z.string(),
  // }),
  component: OneContent,
});

function OneContent() {
  const { contentId } = Route.useParams();

  const { isConnected, address } = useUserStore();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    ...myCollectionsQuery({ address: address!, isConnected }),
    select: (data) => {
      for (const collection of data) {
        for (const protectedData of collection.protectedDatas) {
          if (protectedData.id === contentId) {
            return {
              protectedData,
              collection,
            };
          }
        }
      }
    },
  });

  const setProtectedDataToSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const dataProtector = await getDataProtectorClient();
      return dataProtector.setProtectedDataToSubscription({
        protectedDataAddress: contentId,
        collectionTokenId: Number(data!.collection!.id),
      });
    },
    onSuccess: () => {
      // A bit aggressive, maybe try optimistic update here?
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  return (
    <div className="flex gap-x-8">
      <div className="w-full">
        <h2 className="font-anybody font-bold">One Content</h2>
        <div className="mb-3 mt-0.5">{data?.protectedData?.id}</div>

        <div>isFree: -</div>
        <div>
          isForRent:{' '}
          {data?.protectedData?.isRentable === true
            ? 'YES'
            : data?.protectedData?.isRentable === false
              ? 'NO'
              : '-'}
        </div>
        <div>priceForRent: -</div>
        <div>durationForRent: -</div>
        <div>isForSell: -</div>
        <div>priceForSell: -</div>
        <div>
          isIncludedInSubscription:{' '}
          {data?.protectedData?.isIncludedInSubscription === true
            ? 'YES'
            : data?.protectedData?.isIncludedInSubscription === false
              ? 'NO'
              : '-'}
        </div>

        <div className="mt-3">Current renters: -</div>

        {data?.protectedData?.isIncludedInSubscription === false &&
          data?.collection?.subscriptionParams?.price &&
          data?.collection?.subscriptionParams?.duration && (
            <div className="mt-6">
              <Button
                size="sm"
                disabled={setProtectedDataToSubscriptionMutation.isPending}
                className="btn btn-primary"
                onClick={() => {
                  setProtectedDataToSubscriptionMutation.mutate();
                }}
              >
                {setProtectedDataToSubscriptionMutation.isPending && (
                  <Loader size="16" className="mr-2 animate-spin-slow" />
                )}
                <span>Include in subscription</span>
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
