import type { ProtectedDataInCollection } from '@iexec/dataprotector';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { DocLink } from '@/components/DocLink.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { OneContentCard } from './OneContentCard.tsx';

export function ContentOfTheWeek({
  isRentable,
}: { isRentable?: true | undefined } | undefined = {}) {
  const { isDevMode } = useDevModeStore();

  const contentOfTheWeek = useRef(null);

  const { isLoading, isError, error, data } = useQuery<
    ProtectedDataInCollection[],
    unknown
  >({
    queryKey: ['contentOfTheWeek'],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const sevenDaysAgo = Math.round(
        (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
      );
      const { protectedDataInCollection } =
        await dataProtectorSharing.getProtectedDataInCollections({
          // createdAfterTimestamp: sevenDaysAgo,
          ...(isRentable !== undefined && { isRentable }),
        });
      return protectedDataInCollection;
    },
  });

  function onScrollLeft() {
    contentOfTheWeek.current.scrollBy({
      top: 0,
      left: -contentOfTheWeek.current.clientWidth,
      behavior: 'smooth',
    });
  }

  function onScrollRight() {
    contentOfTheWeek.current.scrollBy({
      top: 0,
      left: contentOfTheWeek.current.clientWidth,
      behavior: 'smooth',
    });
  }

  return (
    <>
      <div className="flex min-h-[44px] items-center">
        <h3 className="flex-1 text-2xl font-bold">New contents 👀</h3>
        {!!data?.length && data?.length > 0 && (
          <div>
            <button
              className="group p-1 transition-transform active:scale-[0.9]"
              onClick={onScrollLeft}
            >
              <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
                <ArrowLeft size="18" />
              </div>
            </button>
            <button
              className="group ml-1 p-1 transition-transform active:scale-[0.9]"
              onClick={onScrollRight}
            >
              <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
                <ArrowRight size="18" />
              </div>
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-6 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error" className="mt-4">
          <p>Oops, something went wrong while fetching content of the week.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {data?.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          No content this week? 🤔
        </div>
      )}

      <div
        ref={contentOfTheWeek}
        className="mb-6 mt-8 inline-flex max-w-full gap-x-4 overflow-auto"
      >
        {!!data?.length &&
          data?.length > 0 &&
          data?.map((protectedData) => (
            <div key={protectedData.id} className="w-[400px] shrink-0">
              <OneContentCard
                protectedData={protectedData}
                linkToDetails="/content/$protectedDataAddress"
              />
            </div>
          ))}
      </div>

      {isDevMode && (
        <DocLink className="mb-14">
          dataprotector-sdk / Method called:{' '}
          <a
            href="https://documentation-tools.vercel.app/tools/dataProtector/dataProtectorSharing/misc/getProtectedDataInCollections.html"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            <br />
            {isRentable
              ? 'getProtectedDataInCollections({ isRentable: true })'
              : 'getProtectedDataInCollections()'}
          </a>
        </DocLink>
      )}
    </>
  );
}
