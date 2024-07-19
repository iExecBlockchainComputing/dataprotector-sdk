import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { CarouselScrollArrows } from '@/components/CarouselScrollArrows.tsx';
import { DocLink } from '@/components/DocLink.tsx';
import { activeRentalsQuery } from '@/modules/activeRentals.query.ts';
import { OneContentCard } from '@/modules/home/latestContent/OneContentCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { pluralize } from '@/utils/pluralize.ts';
import { remainingDays } from '@/utils/remainingDays.ts';

export function ActiveRentals() {
  const { address } = useUserStore();
  const rentedContent = useRef<HTMLDivElement>(null);

  const {
    isSuccess,
    data: userRentals,
    isError,
  } = useQuery(activeRentalsQuery({ userAddress: address! }));

  return (
    <div className="min-h-[214px] rounded-3xl bg-grey-800">
      {isError && (
        <div className="flex min-h-[214px] items-center justify-center p-12">
          <span className="text-center text-xl">
            Oops, something went wrong while retrieving your rented content 😢
          </span>
        </div>
      )}

      {isSuccess && userRentals.length === 0 && (
        <div className="flex min-h-[214px] items-center justify-center p-12">
          <span className="text-xl font-extrabold">
            You haven't rented anything yet.
          </span>
        </div>
      )}

      {isSuccess && userRentals.length > 0 && (
        <div className="flex flex-col p-6 sm:p-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold">
                Your rented content 🥰
              </div>
              <div>{pluralize(userRentals.length, 'content')}</div>
            </div>
            {userRentals?.length > 0 && (
              <CarouselScrollArrows carousel={rentedContent} />
            )}
          </div>
          <div
            ref={rentedContent}
            className="mt-8 inline-flex max-w-full gap-x-4 overflow-auto pb-4"
          >
            {userRentals.map((rental) => (
              <div key={rental.id} className="flex flex-col">
                <OneContentCard
                  protectedData={rental.protectedData}
                  linkToDetails="/content/$protectedDataAddress"
                  showLockIcon={false}
                  className="w-[400px]"
                />
                <div className="mt-2 px-2 text-sm italic text-grey-400">
                  Rental ends in{' '}
                  {remainingDays({
                    endDate: rental.endDate,
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="-mt-4 pb-6">
          <DocLink className="mx-6">
            dataprotector-sdk / Method called:{' '}
            <a
              href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getRentals.html"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              <br />
              getRentals({'{'}
              <br />
              &nbsp;&nbsp;renterAddress: "{address}",
              <br />
              &nbsp;&nbsp;includePastRentals: false,
              <br />
              {'}'})
            </a>
          </DocLink>
        </div>
      )}
    </div>
  );
}
