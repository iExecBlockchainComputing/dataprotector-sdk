import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { Button } from '@/components/ui/button.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { Lock } from 'react-feather';
import styles from '@/modules/home/contentOfTheWeek/OneContentCard.module.css';

export const Route = createFileRoute('/_explore/content/$protectedDataAddress')(
  {
    component: ProtectedDataPreview,
  }
);

export function ProtectedDataPreview() {
  const { protectedDataAddress } = Route.useParams();

  const cardVisualBg = Number(
    protectedDataAddress[protectedDataAddress.length - 1]
  )
    ? 'card-visual-bg-1'
    : 'card-visual-bg-2';

  // TODO Check in cache first
  const {
    isLoading,
    isSuccess,
    data: protectedData,
    isError,
    error,
  } = useQuery({
    queryKey: ['protectedData', protectedDataAddress],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.getOneProtectedData({
        protectedDataAddress,
      });
    },
  });

  console.log('protectedData', protectedData);

  return (
    <div>
      <div className="relative flex h-[380px] max-w-[620px] items-center justify-center">
        <div
          className={clsx(
            styles[cardVisualBg],
            'h-full w-full rounded-3xl border border-grey-800'
          )}
        >
          &nbsp;
        </div>
        <Lock
          size="30"
          className="text-grey-50 absolute opacity-100 group-hover:opacity-0"
        />
      </div>

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error" className="mt-8">
          <p>Oops, something went wrong while fetching this content.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && !protectedData && (
        <div className="mt-10 text-center italic">
          This content was not found.
        </div>
      )}

      {isSuccess && protectedData && (
        <div className="mt-4 rounded-3xl border border-grey-700 p-6">
          <div className="flex">
            <div className="flex-1 overflow-hidden">
              <div className="text-xl">{protectedData.name}</div>
              <div className="mt-2 flex items-center">
                <div className="size-5 shrink-0 rounded-full bg-[#D9D9D9]">
                  &nbsp;
                </div>
                <span className="ml-2 text-grey-500">
                  {truncateAddress(protectedDataAddress)}
                </span>
              </div>
            </div>
          </div>
          <hr className="mt-6 border-grey-700" />

          {protectedData.isRentable &&
            !protectedData.isIncludedInSubscription && (
              <div className="mt-9">
                <div className="flex w-full items-start">
                  <div className="flex-1">
                    This content is available for rental, and you can consume
                    the content unlimitedly throughout the duration of the
                    rental period.
                  </div>
                  <div className="-mt-0.5 pl-6 text-xl font-bold text-primary">
                    0.30 RLC
                  </div>
                </div>
                <div className="mt-7 text-center">
                  <Button>Rent content</Button>
                </div>
              </div>
            )}

          {protectedData.isIncludedInSubscription &&
            !protectedData.isRentable && (
              <div className="mb-6 mt-9">
                <div className="flex w-full items-start">
                  <div className="flex-1">
                    This content is accessible only if you have subscribed to
                    this content creator.
                  </div>
                  <div className="pl-6 font-bold text-primary">
                    Only subscription
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
