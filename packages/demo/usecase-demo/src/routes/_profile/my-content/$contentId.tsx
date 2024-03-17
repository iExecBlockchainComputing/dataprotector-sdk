import { Alert } from '@/components/Alert.tsx';
import { Input } from '@/components/ui/input.tsx';
import { daysToSeconds } from '@/utils/secondsToDays.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Loader } from 'react-feather';
import { Button } from '../../../components/ui/button.tsx';
import { getDataProtectorClient } from '../../../externals/dataProtectorClient.ts';
import { myCollectionsQuery } from '../../../modules/profile/myCollections.query.ts';
import { useUserStore } from '../../../stores/user.store.ts';

export const Route = createFileRoute('/_profile/my-content/$contentId')({
  // parseParams: (params) => ({
  //   contentId: z.string(),
  // }),
  component: OneContent,
});

function OneContent() {
  const { contentId } = Route.useParams();

  const { isConnected, address } = useUserStore();
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery({
    ...myCollectionsQuery({ address: address!, isConnected }),
    select: (data) => {
      for (const collection of data) {
        for (const protectedData of collection.protectedDatas) {
          if (protectedData.id === contentId) {
            return {
              protectedData,
              collection,
            };
          }
        }
      }
    },
  });

  const [rentingPriceInNRLC, setRentingPriceInNRLC] = useState<string>(
    data?.protectedData?.rentingParams?.priceInNRLC
      ? String(data?.protectedData.rentingParams.priceInNRLC)
      : ''
  );
  const [rentingDurationInDays, setRentingDurationInDays] = useState<string>(
    data?.protectedData?.rentingParams?.durationInDays
      ? String(data?.protectedData.rentingParams.durationInDays)
      : ''
  );

  const showSetToRentingButton = !data?.protectedData?.isRentable;

  const showRemoveFromRentingButton = data?.protectedData?.isRentable;

  const showIncludeInSubscriptionButton =
    data?.protectedData?.isIncludedInSubscription === false &&
    data?.collection?.subscriptionParams?.price &&
    data?.collection?.subscriptionParams?.duration;

  const showRemoveFromSubscriptionButton =
    data?.protectedData?.isIncludedInSubscription === true;

  const showSetForSaleButton = !data?.protectedData?.isForSale;

  const setProtectedDataToRentingMutation = useMutation({
    mutationFn: async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataToRenting({
        protectedDataAddress: contentId,
        priceInNRLC: Number(rentingPriceInNRLC),
        durationInSeconds: daysToSeconds(Number(rentingDurationInDays)),
      });
    },
    onSuccess: () => {
      // A bit aggressive, maybe try optimistic update here?
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  const removeProtectedDataFromRentingMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.removeProtectedDataFromRenting({
        protectedDataAddress: contentId,
      });
    },
    onSuccess: () => {
      // A bit aggressive, maybe try optimistic update here?
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  const setProtectedDataToSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataToSubscription({
        protectedDataAddress: contentId,
      });
    },
    onSuccess: () => {
      // A bit aggressive, maybe try optimistic update here?
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  const removeProtectedDataFromSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.removeProtectedDataFromSubscription({
        protectedDataAddress: contentId,
      });
    },
    onSuccess: () => {
      // A bit aggressive, maybe try optimistic update here?
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  return (
    <div className="flex gap-x-8">
      <div className="w-full">
        {error && (
          <Alert variant="error" className="mb-4">
            <p>Oops, something went wrong when retrieving this content.</p>
            <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
          </Alert>
        )}

        <h2 className="font-anybody font-bold">
          One Content
          {isLoading && (
            <Loader size="20" className="ml-2 inline animate-spin-slow" />
          )}
        </h2>
        <div className="mb-3 mt-0.5">{data?.protectedData?.id}</div>

        <div>isFree: -</div>
        <div>
          isForRent:{' '}
          {data?.protectedData?.isRentable === true
            ? 'YES'
            : data?.protectedData?.isRentable === false
              ? 'NO'
              : '-'}
        </div>
        <div className="ml-2">priceForRent: -</div>
        <div className="ml-2">durationForRent: -</div>
        <div>isForSale: -</div>
        <div className="ml-2">priceToBuy: -</div>
        <div>
          isIncludedInSubscription:{' '}
          {data?.protectedData?.isIncludedInSubscription === true
            ? 'YES'
            : data?.protectedData?.isIncludedInSubscription === false
              ? 'NO'
              : '-'}
        </div>

        <div className="mt-3">Current renters: -</div>

        {!isLoading && (
          <>
            {showSetToRentingButton && (
              <div className="mt-6">
                <form
                  noValidate
                  className="flex items-center gap-x-2"
                  onSubmit={(event) => {
                    setProtectedDataToRentingMutation.mutate(event);
                  }}
                >
                  <div className="w-[150px]">
                    <Input
                      type="number"
                      value={rentingPriceInNRLC}
                      placeholder="Price (in nRLC)"
                      disabled={setProtectedDataToRentingMutation.isPending}
                      onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setRentingPriceInNRLC(event.target.value)
                      }
                    />
                  </div>
                  <div className="w-[150px]">
                    <Input
                      type="number"
                      value={rentingDurationInDays}
                      placeholder="Duration (in days)"
                      disabled={setProtectedDataToRentingMutation.isPending}
                      onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setRentingDurationInDays(event.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={setProtectedDataToRentingMutation.isPending}
                  >
                    {setProtectedDataToRentingMutation.isPending && (
                      <Loader size="16" className="mr-2 animate-spin-slow" />
                    )}
                    <span>Set to renting</span>
                  </Button>
                </form>
                {setProtectedDataToRentingMutation.error && (
                  <Alert variant="error" className="mt-4">
                    <p>
                      Oops, something went wrong while activating rentals for
                      this content.
                    </p>
                    <p className="mt-1 text-sm text-orange-300">
                      {setProtectedDataToRentingMutation.error.toString()}
                    </p>
                  </Alert>
                )}
              </div>
            )}

            {showRemoveFromRentingButton && (
              <div className="mt-6">
                <Button
                  size="sm"
                  disabled={removeProtectedDataFromRentingMutation.isPending}
                  onClick={() => {
                    removeProtectedDataFromRentingMutation.mutate();
                  }}
                >
                  {removeProtectedDataFromRentingMutation.isPending && (
                    <Loader size="16" className="mr-2 animate-spin-slow" />
                  )}
                  <span>Remove from renting</span>
                </Button>
                {removeProtectedDataFromRentingMutation.error && (
                  <Alert variant="error" className="mt-4">
                    <p>
                      Oops, something went wrong while deactivating rentals for
                      this content.
                    </p>
                    <p className="mt-1 text-sm text-orange-300">
                      {removeProtectedDataFromRentingMutation.error.toString()}
                    </p>
                  </Alert>
                )}
              </div>
            )}

            {showIncludeInSubscriptionButton && (
              <div className="mt-6">
                <Button
                  size="sm"
                  disabled={setProtectedDataToSubscriptionMutation.isPending}
                  onClick={() => {
                    setProtectedDataToSubscriptionMutation.mutate();
                  }}
                >
                  {setProtectedDataToSubscriptionMutation.isPending && (
                    <Loader size="16" className="mr-2 animate-spin-slow" />
                  )}
                  <span>Include in subscription</span>
                </Button>
                {setProtectedDataToSubscriptionMutation.error && (
                  <Alert variant="error" className="mt-4">
                    <p>
                      Oops, something went wrong while allowing your subscribers
                      to access this content.
                    </p>
                    <p className="mt-1 text-sm text-orange-300">
                      {setProtectedDataToSubscriptionMutation.error.toString()}
                    </p>
                  </Alert>
                )}
              </div>
            )}

            {showRemoveFromSubscriptionButton && (
              <div className="mt-6">
                <Button
                  size="sm"
                  disabled={
                    removeProtectedDataFromSubscriptionMutation.isPending
                  }
                  onClick={() => {
                    removeProtectedDataFromSubscriptionMutation.mutate();
                  }}
                >
                  {removeProtectedDataFromSubscriptionMutation.isPending && (
                    <Loader size="16" className="mr-2 animate-spin-slow" />
                  )}
                  <span>Remove from subscription</span>
                </Button>
                {removeProtectedDataFromSubscriptionMutation.error && (
                  <Alert variant="error" className="mt-4">
                    <p>
                      Oops, something went wrong while removing this content
                      from your subscription.
                    </p>
                    <p className="mt-1 text-sm text-orange-300">
                      {removeProtectedDataFromSubscriptionMutation.error.toString()}
                    </p>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
