import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';
import { CircledDigit } from '@/modules/profile/CircledDigit.tsx';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/_explore/_profile/my-content/_edit')({
  component: NewProtectedDataLayout,
});

export function NewProtectedDataLayout() {
  const router = useRouter();

  const [isUploadRoute, setUploadRoute] = useState(
    !router.state.location.pathname.endsWith('/monetization') &&
      !router.state.location.pathname.endsWith('/recap')
  );
  const [isMonetizationRoute, setMonetizationRoute] = useState(
    router.state.location.pathname.endsWith('/monetization')
  );
  const [isRecapRoute, setRecapRoute] = useState(
    router.state.location.pathname.endsWith('/recap')
  );

  useEffect(() => {
    setMonetizationRoute(
      router.state.location.pathname.endsWith('/monetization')
    );
    setRecapRoute(router.state.location.pathname.endsWith('/recap'));
    setUploadRoute(!isMonetizationRoute && !isRecapRoute);
  }, [isMonetizationRoute, isRecapRoute, router.state]);

  return (
    <div>
      <div className="rounded-3xl border border-grey-800 px-4 py-6 md:px-8 md:text-lg">
        <div className="relative grid grid-cols-3 place-content-around gap-x-4 gap-y-2 md:gap-y-4">
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
            className={`text-center font-semibold ${isUploadRoute ? 'text-foreground' : 'text-white opacity-30'}`}
          >
            {isUploadRoute ? 'Upload Content' : 'Content Uploaded'}
          </div>
          <div
            className={`text-center font-semibold transition-colors ${isMonetizationRoute ? 'text-foreground' : 'text-white opacity-30'}`}
          >
            {isMonetizationRoute ? 'Choose Monetization' : 'Monetization Set'}
          </div>
          <div
            className={`text-center font-semibold transition-colors ${isRecapRoute ? 'text-foreground' : 'text-white opacity-30'}`}
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
