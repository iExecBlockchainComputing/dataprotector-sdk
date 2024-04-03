import { useQuery } from '@tanstack/react-query';
import { activeRentalsQuery } from '@/modules/activeRentals.query.ts';
import { OneContentCard } from '@/modules/home/contentOfTheWeek/OneContentCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { getRemainingDays } from '@/utils/getRemainingDays.ts';

export function ActiveRentals() {
  const { address } = useUserStore();

  const {
    isSuccess,
    data: userRentals,
    isError,
  } = useQuery(activeRentalsQuery({ userAddress: address! }));

  return (
    <div className="rounded-3xl bg-grey-800">
      {isError && (
        <div className="h-full flex justify-center items-center min-h-[214px] p-12">
          <span className="text-xl text-center">
            Oops, something went wrong while retrieving your rented content 😢
          </span>
        </div>
      )}

      {isSuccess && userRentals.length === 0 && (
        <div className="h-full flex justify-center items-center min-h-[214px] p-12">
          <span className="text-xl font-extrabold">
            You haven't rented anything yet.
          </span>
        </div>
      )}

      {isSuccess && userRentals.length > 0 && (
        <div className="flex flex-col p-12">
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
