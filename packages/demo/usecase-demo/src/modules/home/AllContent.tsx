import { Button } from '../../components/ui/button.tsx';
import { AllCreators } from './allCreators/AllCreators.tsx';
import { ContentOfTheWeek } from './contentOfTheWeek/ContentOfTheWeek.tsx';

export function AllContent() {
  return (
    <div className="mb-28 mt-16 w-full">
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
    </div>
  );
}
