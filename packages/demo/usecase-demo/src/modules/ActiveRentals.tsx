import { activeRentalsQuery } from '@/modules/activeRentals.query.ts';
import { OneContentCard } from '@/modules/home/contentOfTheWeek/OneContentCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { getRemainingDays } from '@/utils/getRemainingDays.ts';
import { useQuery } from '@tanstack/react-query';

export function ActiveRentals() {
  const { address } = useUserStore();

  const {
    isSuccess,
    data: userRentals,
    isError,
  } = useQuery(activeRentalsQuery({ userAddress: address! }));

  return (
    <div className="min-h-[214px] rounded-3xl bg-grey-800 p-12">
      {isError && (
        <div className="flex items-center justify-center text-xl font-extrabold">
          Oops, something went wrong while retrieving your rented content.
        </div>
      )}

      {isSuccess && userRentals.length === 0 && (
        <div className="flex items-center justify-center text-xl font-extrabold">
          You haven't rented anything yet.
        </div>
      )}

      {isSuccess && userRentals.length > 0 && (
        <div className="flex flex-col">
          <div className="text-xl font-extrabold">Your rented content 🥰</div>
          <div className="mt-8 grid w-full">
            {userRentals.map((rental) => (
              <div key={rental.id}>
                <OneContentCard
                  protectedData={rental.protectedData}
                  linkToDetails="/content/$protectedDataAddress"
                  className="w-[343px]"
                />
                <div className="mt-2 px-2 text-sm italic text-grey-400">
                  {/*Rented for{' '}*/}
                  {/*{readableSecondsToDays(rental.rentalParams.duration)} days*/}
                  {/*<br />*/}
                  {getRemainingDays({
                    endDate: rental.endDate,
                  })}{' '}
                  remaining days
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
