import { Link } from '@tanstack/react-router';
import { DollarSign, Image, Plus } from 'react-feather';
import { Button } from '../../components/ui/button.tsx';

export default function CreatorLeftNav() {
  return (
    <div className="flex h-fit w-[200px] shrink-0 flex-col gap-y-1.5 rounded-md border p-1.5">
      <Link
        to={'/my-content'}
        activeProps={{
          className: 'text-primary',
        }}
      >
        <Button variant="text" className="w-full justify-start text-left">
          <Image size="16" className="-ml-1 mr-1.5 shrink-0" />
          <span className="ml-1">My Content</span>
        </Button>
      </Link>
      <Link
        to={'new'}
        activeProps={{
          className: 'text-primary',
        }}
      >
        <Button variant="text" className="w-full justify-start text-left">
          <Plus size="16" className="-ml-1 mr-1.5 shrink-0" />
          <span className="ml-1">Create new</span>
        </Button>
      </Link>
      <Link
        to={'/my-subscription'}
        activeProps={{
          className: 'text-primary',
        }}
      >
        <Button variant="text" className="w-full justify-start text-left">
          <DollarSign size="16" className="-ml-1 mr-1.5 shrink-0" />
          <span className="ml-1">Manage my subscription</span>
        </Button>
      </Link>
    </div>
  );
}
