import { Address } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { EyeOff, Tag } from 'react-feather';
import { ChevronLeft } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { DocLink } from '@/components/DocLink';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { activeRentalsQuery } from '@/modules/activeRentals.query.ts';
import { activeSubscriptionsQuery } from '@/modules/activeSubscriptions.query.ts';
import { BuyBlock } from '@/modules/oneProtectedData/BuyBlock.tsx';
import { ContentCardWithConsume } from '@/modules/oneProtectedData/ContentCardWithConsume.tsx';
import { RentBlock } from '@/modules/oneProtectedData/RentBlock.tsx';
import avatarStyles from '@/modules/profile/profile.module.css';
import { useUserStore } from '@/stores/user.store.ts';
import { formatDuration } from '@/utils/formatDuration';
import { getAvatarVisualNumber } from '@/utils/getAvatarVisualNumber.ts';
import { remainingDays } from '@/utils/remainingDays.ts';
import { timestampToReadableDate } from '@/utils/timestampToReadableDate.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';

export const Route = createFileRoute('/_explore/content/$protectedDataAddress')(
  {
    component: ProtectedDataPreview,
  }
);

export function ProtectedDataPreview() {
  const protectedDataAddress =
    Route.useParams()?.protectedDataAddress?.toLowerCase();

  const userAddress = useUserStore((state) => state.address);

  const router = useRouter();
  const hasPreviousPage = Boolean(router.history.location.state.key);

  const onBack = () => router.history.back();

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
      const protectedDatas =
        await dataProtectorSharing.getProtectedDataInCollections({
          protectedData: protectedDataAddress,
        });
      if (!protectedDatas.protectedDataInCollection.length) {
        return null;
      }
      return protectedDatas.protectedDataInCollection[0];
    },
  });

  const avatarVisualBg = getAvatarVisualNumber({
    address: protectedData?.collection.owner.id,
  });

  const isDirectOwner = protectedData?.owner.id === userAddress;
  const isOwnerThroughTheirCollection =
    protectedData?.collection.owner.id === userAddress;

  const { data: activeRental } = useQuery({
    ...activeRentalsQuery({ userAddress: userAddress! }),
    select: (userRentals) => {
      return userRentals.find(
        (rental) => rental.protectedData.id === protectedDataAddress
      );
    },
  });

  const { data: hasActiveSubscriptionToCollectionOwner } = useQuery({
    ...activeSubscriptionsQuery({ userAddress: userAddress! }),
    select: (userSubscriptions) => {
      return userSubscriptions.some(
        (subscription) =>
          subscription.collection.owner.id ===
          protectedData!.collection.owner.id
      );
    },
    enabled: !!protectedData && protectedData.isIncludedInSubscription,
  });

  const hasAccessToContent =
    Boolean(activeRental) || Boolean(hasActiveSubscriptionToCollectionOwner);

  return (
    <>
      {hasPreviousPage && (
        <Link
          onClick={() => {
            onBack();
          }}
          className="mb-4 inline-flex gap-2 p-2 hover:drop-shadow-link-hover"
        >
          <ChevronLeft />
          Back
        </Link>
      )}

      <div className="mx-auto max-w-[620px]">
        <ContentCardWithConsume
          userAddress={userAddress as Address}
          protectedDataAddress={protectedDataAddress}
          protectedDataName={protectedData?.name || ''}
          isOwner={isDirectOwner || isOwnerThroughTheirCollection}
          hasAccessToContent={hasAccessToContent}
        />

        {isLoading && (
          <div className="mt-10 flex justify-center">
            <CircularLoader />
          </div>
        )}

        {isError && (
          <Alert variant="error" className="mt-8">
            <p>Oops, something went wrong while fetching this content.</p>
            <p className="mt-1 text-sm">{error.toString()}</p>
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
                <div className="mt-4 flex items-center gap-2 text-grey-500">
                  Content:
                  <span className="group text-white">
                    <span className="inline group-hover:hidden">
                      {truncateAddress(protectedDataAddress)}
                    </span>
                    <span className="hidden group-hover:inline">
                      {protectedDataAddress}
                    </span>
                  </span>
                </div>
                <div className="gap mt-2 flex items-center gap-2 text-grey-500">
                  Owner:
                  <Link
                    to={'/user/$profileAddress'}
                    params={{
                      profileAddress: protectedData.collection.owner.id,
                    }}
                    className="group flex items-center text-white underline"
                  >
                    <div
                      className={clsx(
                        avatarStyles[avatarVisualBg],
                        'relative mr-1.5 size-4 rounded-full bg-black bg-cover'
                      )}
                    />
                    <span className="inline group-hover:hidden">
                      {truncateAddress(protectedData.collection.owner.id)}
                    </span>
                    <span className="hidden group-hover:inline">
                      {protectedData.collection.owner.id}
                    </span>
                  </Link>
                  {userAddress === protectedData.collection.owner.id && (
                    <span className="whitespace-nowrap text-xs text-grey-400">
                      (your account)
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-grey-500">
                  Creation:
                  <span className="group text-white">
                    <span>
                      {timestampToReadableDate(protectedData.creationTimestamp)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <hr className="mt-6 border-grey-700" />

            {isDirectOwner && (
              <div className="mb-6 mt-9 flex items-center gap-x-1.5">
                <Tag size="16" />
                You are the owner of this content!
              </div>
            )}

            {isOwnerThroughTheirCollection && (
              <div className="mb-6 mt-9">
                <div className="flex items-center gap-x-1.5">
                  <Tag size="16" />
                  This content belongs to one of your collections.
                </div>
                <Link
                  to={'/my-content/$protectedDataAddress/recap'}
                  params={{
                    protectedDataAddress: protectedData.id,
                  }}
                  className="mt-1 inline-block underline"
                >
                  Manage your content
                </Link>
              </div>
            )}

            {!!activeRental && (
              <div className="mb-6 mt-9">
                You have rented this content. You can view or download it!
                <div className="mt-1 text-sm italic text-grey-400">
                  Rental ends in{' '}
                  {remainingDays({
                    endDate: activeRental.endDate,
                  })}
                </div>
              </div>
            )}

            {protectedData.isIncludedInSubscription &&
              hasActiveSubscriptionToCollectionOwner && (
                <div className="mb-6 mt-9">
                  You have an active subscription to this creator! You can view
                  or download all content included in their subscription.
                </div>
              )}

            {/* --- isRentable with price = 0 --- */}
            {/* TODO */}

            {/* --- isRentable --- */}
            {!hasAccessToContent &&
              protectedData.isRentable &&
              !protectedData.isIncludedInSubscription && (
                <div className="mt-9">
                  <RentBlock
                    protectedDataAddress={protectedDataAddress}
                    rentalParams={protectedData.rentalParams!}
                  />
                </div>
              )}

            {/* --- isIncludedInSubscription --- */}
            {!hasAccessToContent &&
              protectedData.isIncludedInSubscription &&
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

            {/* --- isRentable AND isIncludedInSubscription --- */}
            {!hasAccessToContent &&
              protectedData.isRentable &&
              protectedData.isIncludedInSubscription && (
                <div className="mb-6 mt-9">
                  <div className="flex w-full items-start">
                    <div className="flex-1">
                      This content is accessible if you have subscribed to this
                      content creator.
                    </div>
                  </div>
                  <hr className="my-6 border-grey-700" />
                  <RentBlock
                    protectedDataAddress={protectedDataAddress}
                    rentalParams={protectedData.rentalParams!}
                  />
                </div>
              )}

            {/* --- isForSale --- */}
            {!hasAccessToContent && protectedData.isForSale && (
              <BuyBlock
                protectedDataAddress={protectedDataAddress}
                salePriceInNRLC={protectedData.saleParams!.price}
              />
            )}

            {/* --- No monetization yet --- */}
            {!protectedData.isRentable &&
              !protectedData.isIncludedInSubscription &&
              !protectedData.isForSale && (
                <div className="mb-6 mt-9">
                  <EyeOff size="16" className="-mt-0.5 mr-0.5 inline-block" />{' '}
                  This content is not distributed yet.
                </div>
              )}

            <DocLink className="mt-6">
              dataprotector-sdk / Method called:{' '}
              <a
                href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getProtectedDataInCollections.html"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                getProtectedDataInCollections({'{'}
                <br />
                &nbsp;&nbsp;protectedData: {protectedData.id},
                <br />
                {'}'});
              </a>
            </DocLink>

            {protectedData.isRentable && (
              <DocLink className="mt-6">
                dataprotector-sdk / Method called:{' '}
                <a
                  href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/renting/rentProtectedData.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  <br />
                  rentProtectedData({'{'}
                  <br />
                  &nbsp;&nbsp;protectedData: {protectedData.id},
                  <br />
                  &nbsp;&nbsp;price: {protectedData.rentalParams?.price}, //{' '}
                  {protectedData.rentalParams?.price} nRLC
                  <br />
                  &nbsp;&nbsp;duration:{' '}
                  {formatDuration(protectedData.rentalParams?.duration)}
                  <br />
                  {'}'});
                </a>
              </DocLink>
            )}

            {protectedData.isForSale && (
              <DocLink className="mt-6">
                dataprotector-sdk / Method called:{' '}
                <a
                  href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/selling/buyProtectedData.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  <br />
                  buyProtectedData({'{'}
                  <br />
                  &nbsp;&nbsp;protectedData: {protectedData.id},
                  <br />
                  &nbsp;&nbsp;price: {protectedData.saleParams?.price}, //{' '}
                  {protectedData.saleParams?.price} nRLC
                  <br />
                  {'}'});
                </a>
              </DocLink>
            )}
          </div>
        )}
      </div>
    </>
  );
}
