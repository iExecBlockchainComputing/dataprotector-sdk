import { useQuery } from '@tanstack/react-query';
import { activeRentalsQuery } from '@/modules/activeRentals.query.ts';
import { OneContentCard } from '@/modules/home/contentOfTheWeek/OneContentCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { remainingDays } from '@/utils/remainingDays.ts';

export function ActiveRentals() {
  const { address } = useUserStore();

  const {
    isSuccess,
    data: userRentals,
    isError,
  } = useQuery(activeRentalsQuery({ userAddress: address! }));

  return (
    <div className="rounded-3xl bg-grey-800 min-h-[214px]">
      {isError && (
        <div className="min-h-[214px] flex items-center justify-center p-12">
          <span className="text-xl text-center">
            Oops, something went wrong while retrieving your rented content 😢
          </span>
        </div>
      )}

      {isSuccess && userRentals.length === 0 && (
        <div className="min-h-[214px] items-center flex justify-center p-12">
          <span className="text-xl font-extrabold">
            You haven't rented anything yet.
          </span>
        </div>
      )}

      {isSuccess && userRentals.length > 0 && (
        <div className="flex flex-col p-12">
          <div className="text-xl font-extrabold">Your rented content 🥰</div>
          <div
            className="mt-8 grid w-full gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            }}
          >
            {userRentals.map((rental) => (
              <div key={rental.id}>
                <OneContentCard
                  protectedData={rental.protectedData}
                  linkToDetails="/content/$protectedDataAddress"
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
    </div>
  );
}
