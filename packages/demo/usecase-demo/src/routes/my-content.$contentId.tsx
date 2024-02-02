import { FileRoute } from '@tanstack/react-router';

/**
 * To be moved to /_profile folder
 */

export const Route = new FileRoute('/my-content/$contentId').createRoute({
  // parseParams: (params) => ({
  //   contentId: z.string(),
  // }),
  component: OneContent,
});

function OneContent() {
  const { contentId } = Route.useParams();
  console.log('contentId', contentId);

  return (
    <div className="flex gap-x-8">
      <div className="w-full">
        <h2 className="mb-2 font-anybody font-bold">One Content</h2>

        <div>isFree: true</div>
        <div>isForRent: false</div>
        <div>priceForRent: -</div>
        <div>durationForRent: -</div>
        <div>isForSell: false</div>
        <div>priceForSell: -</div>
        <div>isIncludedInSubscription: false</div>

        <div className="mt-3">Current renters: 0</div>
      </div>
    </div>
  );
}
