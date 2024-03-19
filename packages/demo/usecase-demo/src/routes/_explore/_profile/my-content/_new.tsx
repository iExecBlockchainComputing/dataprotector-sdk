import { CircledDigit } from '@/modules/profile/CircledDigit.tsx';
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';

export const Route = createFileRoute('/_explore/_profile/my-content/_new')({
  component: NewProtectedDataLayout,
});

export function NewProtectedDataLayout() {
  const router = useRouter();
  console.log('basepath', router.state);

  const isMonetizationRoute =
    router.state.location.pathname.endsWith('/monetization');
  const isRecapRoute = router.state.location.pathname.endsWith('/recap');
  const isUploadRoute = !isMonetizationRoute && !isRecapRoute;

  return (
    <div>
      <div className="rounded-3xl border border-[#303038] px-8 py-6">
        <div className="relative grid grid-cols-3 place-content-around sm:gap-x-4 md:gap-y-4">
          <div
            className={`absolute top-4 z-20 mx-[16%] h-px w-[34%] ${!isUploadRoute ? 'bg-primary' : 'bg-grey-700'}`}
          ></div>
          <div
            className={`absolute top-4 z-10 mx-[16%] h-px w-[68%] ${isRecapRoute ? 'bg-primary' : 'bg-grey-700'}`}
          ></div>
          <div className="flex justify-center">
            <div className="z-20 flex w-16 justify-center bg-background">
              <CircledDigit isActive={isUploadRoute} isDone={!isUploadRoute}>
                1
              </CircledDigit>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="z-20 flex w-16 justify-center bg-background">
              <CircledDigit
                isActive={isMonetizationRoute}
                isDone={isRecapRoute}
              >
                2
              </CircledDigit>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="z-20 flex w-16 justify-center bg-background">
              <CircledDigit isActive={isRecapRoute}>3</CircledDigit>
            </div>
          </div>
          <div
            className={`text-center font-semibold sm:text-lg ${isUploadRoute ? 'text-foreground' : 'text-white opacity-30'}`}
          >
            {isUploadRoute ? 'Upload Content' : 'Content Uploaded'}
          </div>
          <div
            className={`text-center font-semibold transition-colors sm:text-lg ${isMonetizationRoute ? 'text-foreground' : 'text-white opacity-30'}`}
          >
            {isMonetizationRoute ? 'Choose Monetization' : 'Monetization Set'}
          </div>
          <div
            className={`text-center font-semibold transition-colors sm:text-lg ${isRecapRoute ? 'text-foreground' : 'text-white opacity-30'}`}
          >
            Recap
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
