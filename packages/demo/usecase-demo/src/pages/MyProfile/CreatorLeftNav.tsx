import { NavLink } from 'react-router-dom';
import { Image, Plus } from 'react-feather';
import { Button } from '../../components/ui/button.tsx';

export default function CreatorLeftNav() {
  return (
    <div className="flex w-[200px] flex-col gap-y-1.5 rounded-md border p-1.5">
      <NavLink
        to={''}
        end
        className={({ isActive }) => (isActive ? 'active group' : '')}
      >
        <Button variant="text" className="w-full justify-start">
          <Image size="16" className="-ml-1 mr-1.5" />
          My Content
        </Button>
      </NavLink>
      <NavLink
        to={'new'}
        className={({ isActive }) => (isActive ? 'active group' : '')}
      >
        <Button variant="text" className="w-full justify-start">
          <Plus size="16" className="-ml-1 mr-1.5" />
          Create new
        </Button>
      </NavLink>
      <NavLink
        to={'new'}
        className={({ isActive }) => (isActive ? 'active group' : '')}
      >
        <Button variant="text" className="w-full justify-start">
          <Plus size="16" className="-ml-1 mr-1.5" />
          Manage my subscription
        </Button>
      </NavLink>
    </div>
  );
}
