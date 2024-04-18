import { ProtectedDataInCollection } from '@iexec/dataprotector';
import { useLoginLogout } from '@/components/NavBar/useLoginLogout.ts';
import { LatestContents } from '@/modules/home/latestContent/LatestContents.tsx';
import { OneContentCard } from '@/modules/home/latestContent/OneContentCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { AllCreators } from './allCreators/AllCreators.tsx';

export function AllContent() {
  const isConnected = useUserStore((state) => state.isConnected);

  const { login } = useLoginLogout();

  return (
    <div className="mb-28 mt-16 w-full">
      {!isConnected && (
        <div className="relative">
          <div className="flex gap-x-4 blur">
            <OneContentCard
              protectedData={
                {
                  id: '0x1234567890',
                  name: 'Content 1',
                } as ProtectedDataInCollection
              }
              className="w-[400px]"
            />
            <OneContentCard
              protectedData={
                {
                  id: '0x5678901234',
                  name: 'Interesting video by Melua3',
                } as ProtectedDataInCollection
              }
              className="w-[400px]"
            />
            <OneContentCard
              protectedData={
                {
                  id: '0x7890123456',
                  name: 'Exclusive wallpaper',
                } as ProtectedDataInCollection
              }
              className="w-[400px]"
            />
          </div>
          <div className="absolute left-1/2 top-14 -translate-x-1/2">
            <button
              type="button"
              onClick={() => {
                login();
              }}
            >
              <div className="rounded-lg border border-white bg-black px-24 py-5">
                <span className="underline">Connect your wallet</span> to see
                all content.
              </div>
            </button>
          </div>
        </div>
      )}

      {isConnected && (
        <>
          <div className="xl:mt16 mt-8">
            <LatestContents />
          </div>

          <div className="xl:mt16 mt-8">
            <AllCreators />
          </div>
        </>
      )}
    </div>
  );
}
