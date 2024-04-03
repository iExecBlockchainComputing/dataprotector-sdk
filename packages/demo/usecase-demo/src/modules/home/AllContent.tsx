import { Alert } from '@/components/Alert.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { AllCreators } from './allCreators/AllCreators.tsx';
import { ContentOfTheWeek } from './contentOfTheWeek/ContentOfTheWeek.tsx';

export function AllContent() {
  // const { isConnected } = useUserStore();
  const isConnected = useUserStore((state) => state.isConnected);
  // Or even cleaner with: https://docs.pmnd.rs/zustand/guides/auto-generating-selectors

  return (
    <div className="mb-28 mt-16 w-full">
      {!isConnected && (
        <Alert variant="error">
          <p>Please log in to see all content.</p>
        </Alert>
      )}

      {isConnected && (
        <>
          <div className="flex gap-x-6">
            <Button variant="outline">All</Button>
            <Button variant="outline">Articles</Button>
            <Button variant="outline">Music</Button>
            <Button variant="outline">Graphic</Button>
            <Button variant="outline">Image</Button>
          </div>

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
