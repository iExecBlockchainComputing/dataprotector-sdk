import { useLoginLogout } from '@/components/NavBar/useLoginLogout.ts';
import { OneContentCard } from '@/modules/home/contentOfTheWeek/OneContentCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { AllCreators } from './allCreators/AllCreators.tsx';
import { ContentOfTheWeek } from './contentOfTheWeek/ContentOfTheWeek.tsx';

export function AllContent() {
  // const { isConnected } = useUserStore();
  const isConnected = useUserStore((state) => state.isConnected);
  // Or even cleaner with: https://docs.pmnd.rs/zustand/guides/auto-generating-selectors

  const { login } = useLoginLogout();

  return (
    <div className="mb-28 mt-16 w-full">
      {!isConnected && (
        <div className="relative">
          <div className="flex gap-x-4 blur">
            <OneContentCard
              protectedData={{
                id: '0x1234567890',
                name: 'Content 1',
              }}
              className="w-[400px]"
            />
            <OneContentCard
              protectedData={{
                id: '0x5678901234',
                name: 'Interesting video by Melua3',
              }}
              className="w-[400px]"
            />
            <OneContentCard
              protectedData={{
                id: '0x7890123456',
                name: 'Exclusive wallpaper',
              }}
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
            <ContentOfTheWeek />
          </div>

          <div className="xl:mt16 mt-8">
            <AllCreators />
          </div>
        </>
      )}
    </div>
  );
}
