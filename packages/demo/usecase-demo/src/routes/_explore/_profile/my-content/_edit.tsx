import {
  createFileRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CircledDigit } from '@/modules/profile/CircledDigit.tsx';

export const Route = createFileRoute('/_explore/_profile/my-content/_edit')({
  component: NewProtectedDataLayout,
});

export function NewProtectedDataLayout() {
  const routerState = useRouterState();

  const [isUploadRoute, setUploadRoute] = useState(
    !routerState.location.pathname.endsWith('/monetization') &&
      !routerState.location.pathname.endsWith('/recap')
  );
  const [isMonetizationRoute, setMonetizationRoute] = useState(
    routerState.location.pathname.endsWith('/monetization')
  );
  const [isRecapRoute, setRecapRoute] = useState(
    routerState.location.pathname.endsWith('/recap')
  );

  useEffect(() => {
    setMonetizationRoute(
      routerState.location.pathname.endsWith('/monetization')
    );
    setRecapRoute(routerState.location.pathname.endsWith('/recap'));
    setUploadRoute(!isMonetizationRoute && !isRecapRoute);
  }, [isMonetizationRoute, isRecapRoute, routerState]);

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
