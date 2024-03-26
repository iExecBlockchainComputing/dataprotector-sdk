import { RentBlock } from '@/modules/oneProtectedData/RentBlock.tsx';
import { clsx } from 'clsx';
import { EyeOff, Lock, Tag } from 'react-feather';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { BuyBlock } from '@/modules/oneProtectedData/BuyBlock.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import styles from '@/modules/home/contentOfTheWeek/OneContentCard.module.css';

export const Route = createFileRoute('/_explore/content/$protectedDataAddress')(
  {
    component: ProtectedDataPreview,
  }
);

export function ProtectedDataPreview() {
  const { protectedDataAddress } = Route.useParams();

  const userAddress = useUserStore((state) => state.address);

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
      const protectedDatas =
        await dataProtectorSharing.getProtectedDataInCollections({
          protectedDataAddress,
        });
      if (!protectedDatas.protectedDataInCollection.length) {
        return null;
      }
      return protectedDatas.protectedDataInCollection[0];
    },
  });

  const isDirectOwner = protectedData?.owner.id === userAddress;
  const isOwnerThroughTheirCollection =
    protectedData?.collection.owner.id === userAddress;

  return (
    <div className="mx-auto max-w-[620px]">
      <div className="relative flex h-[380px] items-center justify-center">
        <div
          className={clsx(
            styles[cardVisualBg],
            'h-full w-full rounded-3xl border border-grey-800'
          )}
        >
          &nbsp;
        </div>
        {!isDirectOwner && !isOwnerThroughTheirCollection && (
          <Lock
            size="30"
            className="text-grey-50 absolute opacity-100 group-hover:opacity-0"
          />
        )}
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
                <span className="group ml-2 text-grey-500">
                  <span className="inline group-hover:hidden">
                    {truncateAddress(protectedDataAddress)}
                  </span>
                  <span className="hidden group-hover:inline">
                    {protectedDataAddress}
                  </span>
                </span>
              </div>
              <div className="mt-2">
                Owner:{' '}
                <Link
                  to={'/user/$profileAddress'}
                  params={{ profileAddress: protectedData.collection.owner.id }}
                  className="underline"
                >
                  {truncateAddress(protectedData.collection.owner.id)}
                </Link>
                {userAddress === protectedData.collection.owner.id && (
                  <span className="ml-2 text-xs text-grey-400">
                    (your account)
                  </span>
                )}
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
                to={'/my-content/edit/$protectedDataAddress/recap'}
                params={{
                  protectedDataAddress: protectedData.id,
                }}
                className="mt-1 inline-block underline"
              >
                Manage your content
              </Link>
            </div>
          )}

          {/* --- isRentable with price = 0 --- */}
          {/* TODO */}

          {/* --- isRentable --- */}
          {protectedData.isRentable &&
            !protectedData.isIncludedInSubscription && (
              <div className="mt-9">
                <RentBlock
                  protectedDataAddress={protectedDataAddress}
                  rentalParams={protectedData.rentalParams!}
                />
              </div>
            )}

          {/* --- isIncludedInSubscription --- */}
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

          {/* --- isRentable AND isIncludedInSubscription --- */}
          {protectedData.isRentable &&
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
          {protectedData.isForSale && (
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
        </div>
      )}
    </div>
  );
}
