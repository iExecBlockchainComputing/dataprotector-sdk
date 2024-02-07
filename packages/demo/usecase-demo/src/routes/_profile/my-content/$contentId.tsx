import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
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

  const { data: protectedData } = useQuery({
    ...myCollectionsQuery({ address: address!, isConnected }),
    select: (data) => {
      for (const collection of data) {
        for (const protectedData of collection.protectedDatas) {
          if (protectedData.id === contentId) {
            return protectedData;
          }
        }
      }
    },
  });

  return (
    <div className="flex gap-x-8">
      <div className="w-full">
        <h2 className="font-anybody font-bold">One Content</h2>
        <div className="mb-3 mt-0.5">{protectedData?.id}</div>

        <div>isFree: -</div>
        <div>
          isForRent:{' '}
          {protectedData?.isRentable === true
            ? 'YES'
            : protectedData?.isRentable === false
              ? 'NO'
              : '-'}
        </div>
        <div>priceForRent: -</div>
        <div>durationForRent: -</div>
        <div>isForSell: -</div>
        <div>priceForSell: -</div>
        <div>
          isIncludedInSubscription:{' '}
          {protectedData?.isIncludedInSubscription === true
            ? 'YES'
            : protectedData?.isIncludedInSubscription === false
              ? 'NO'
              : '-'}
        </div>

        <div className="mt-3">Current renters: -</div>
      </div>
    </div>
  );
}
