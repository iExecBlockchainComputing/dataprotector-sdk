import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { Info } from 'react-feather';
import { DocLink } from '@/components/DocLink.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import cardStyles from '@/modules/home/allCreators/OneCreatorCard.module.css';
import { OneContentCard } from '@/modules/home/latestContent/OneContentCard.tsx';
import avatarStyles from '@/modules/profile/profile.module.css';
import { CollectionInfoBlock } from '@/modules/subscribe/CollectionInfoBlock.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { formatDuration } from '@/utils/formatDuration.ts';
import { getAvatarVisualNumber } from '@/utils/getAvatarVisualNumber.ts';
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import { pluralize } from '@/utils/pluralize.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import { Alert } from '../../components/Alert.tsx';

export const Route = createFileRoute('/_explore/user/$profileAddress')({
  component: UserProfile,
});

export function UserProfile() {
  const { profileAddress } = Route.useParams();

  const userAddress = useUserStore((state) => state.address);

  const cardVisualBg = getCardVisualNumber({
    address: profileAddress,
  });

  const avatarVisualBg = getAvatarVisualNumber({
    address: profileAddress,
  });

  const {
    isSuccess,
    data: userCollections,
    isError,
    error,
  } = useQuery({
    queryKey: ['collections', profileAddress],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const { collections } = await dataProtectorSharing.getCollectionsByOwner({
        owner: profileAddress,
      });
      return collections;
    },
  });

  const firstUserCollection = userCollections?.[0];

  return (
    <div className="relative">
      <div
        className={clsx(
          cardStyles[cardVisualBg],
          'absolute -top-40 mb-14 h-[228px] w-full rounded-3xl bg-[length:100%_100%] bg-center opacity-[0.22]'
        )}
      >
        &nbsp;
      </div>
      <div
        className={clsx(
          avatarStyles[avatarVisualBg],
          'relative z-10 mt-20 size-[118px] rounded-full border-4 border-[#D9D9D9] bg-black'
        )}
      />
      <div className="-mt-10 mb-10 ml-[136px] font-inter text-white">
        <div className="group inline-block break-all pr-4 leading-4">
          <span className="inline group-hover:hidden">
            {truncateAddress(profileAddress)}
          </span>
          <span className="hidden group-hover:inline">{profileAddress}</span>
          {userAddress === profileAddress && (
            <span className="ml-1 text-xs text-grey-400 group-hover:hidden">
              (your account)
            </span>
          )}
        </div>
      </div>

      {isError && (
        <Alert variant="error" className="mt-4">
          <p>
            Oops, something went wrong while fetching this user's collection.
          </p>
          <p className="mt-1 text-sm">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && !firstUserCollection && (
        <div className="mt-3 italic">No collection found for this user</div>
      )}

      {firstUserCollection && (
        <div className="mb-4">
          <CollectionInfoBlock collection={firstUserCollection} />
        </div>
      )}

      {isSuccess && userCollections?.length > 1 && (
        <>
          <div className="flex items-center gap-x-1.5 rounded bg-grey-700 px-4 py-3 text-sm font-normal text-grey-100">
            <Info size="16" className="shrink-0" />
            User has other collections that are not displayed in this
            usecase-demo:
          </div>
          <DocLink className="-mt-3">
            {userCollections.slice(1).map((c) => {
              return (
                <div key={c.id}>
                  Collection {Number(c.id)} with{' '}
                  {pluralize(c.protectedDatas.length, 'protected data')}.
                </div>
              );
            })}
          </DocLink>
        </>
      )}
      <DocLink className="mx-auto mt-6">
        dataprotector-sdk / Method called:{' '}
        <a
          href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getCollectionsByOwner.html"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          <br />
          getCollectionsByOwner({'{'}
          <br />
          &nbsp;&nbsp;owner: "{profileAddress}",
          <br />
          {'}'});
        </a>
      </DocLink>
      <DocLink className="mx-auto mt-6">
        dataprotector-sdk / Method called:{' '}
        <a
          href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getCollectionsByOwner.html"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          <br />
          getCollectionSubscriptions({'{'}
          <br />
          &nbsp;&nbsp;subscriberAddress: "{profileAddress}",
          <br />
          &nbsp;&nbsp;includePastSubscriptions: false,
          <br />
          {'}'});
        </a>
      </DocLink>
      <DocLink className="mt-6">
        dataprotector-sdk / Method called:{' '}
        <a
          href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/subscription/subscribeToCollection.html"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          <br />
          subscribeToCollection({'{'}
          <br />
          &nbsp;&nbsp;collectionId: {firstUserCollection?.id},
          <br />
          &nbsp;&nbsp;price:{' '}
          {firstUserCollection?.subscriptionParams?.price
            ? `${firstUserCollection?.subscriptionParams?.price}, // ${firstUserCollection?.subscriptionParams?.price}`
            : '1, // 1'}{' '}
          nRLC
          <br />
          &nbsp;&nbsp;duration:{' '}
          {firstUserCollection?.subscriptionParams?.duration
            ? formatDuration(firstUserCollection?.subscriptionParams?.duration)
            : '60 * 60 * 24 * 2, // 172,800 sec = 2 days'}
          <br />
          {'}'});
        </a>
      </DocLink>

      {isSuccess && !!firstUserCollection?.protectedDatas?.length && (
        <div
          className="mt-8 grid w-full gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          }}
        >
          {firstUserCollection?.protectedDatas.map((protectData) => (
            <OneContentCard
              key={protectData.id}
              protectedData={protectData}
              showLockIcon={
                protectData.collection?.owner.id !== userAddress &&
                protectData.isRentable &&
                !protectData.rentals.some(
                  (rental) =>
                    Number(rental.endDate) * 1000 > Date.now() &&
                    rental.renter === userAddress
                )
              }
              linkToDetails="/content/$protectedDataAddress"
            />
          ))}
        </div>
      )}
    </div>
  );
}
