import { Alert } from '../../components/Alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { useUserStore } from '../../stores/user.store.ts';
import { AllCreators } from './allCreators/AllCreators.tsx';
import { ContentOfTheWeek } from './contentOfTheWeek/ContentOfTheWeek.tsx';

export function AllContent() {
  const { isConnected } = useUserStore();

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
            <Button variant="secondary" className="border-grey-50">
              All
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Articles
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Music
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Graphic
            </Button>
            <Button variant="secondary" className="text-grey-500">
              Image
            </Button>
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
