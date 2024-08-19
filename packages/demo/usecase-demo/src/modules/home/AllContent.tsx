import { LatestContents } from '@/modules/home/latestContent/LatestContents.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { AllCreators } from './allCreators/AllCreators.tsx';

export function AllContent() {
  const isConnected = useUserStore((state) => state.isConnected);

  return (
    <div className="mb-28 mt-16 w-full">
      <div className="mt-8">
        <LatestContents />
      </div>

      {isConnected && (
        <div className="mt-8">
          <AllCreators />
        </div>
      )}
    </div>
  );
}
