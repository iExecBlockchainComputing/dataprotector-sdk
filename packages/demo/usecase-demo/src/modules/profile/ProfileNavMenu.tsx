import { Link } from '@tanstack/react-router';
import { ArrowRightCircle } from 'react-feather';

export function ProfileNavMenu() {
  return (
    <div className="flex gap-x-8 border-b border-grey-700 pb-2">
      <Link
        to={'/my-content2'}
        className="flex items-center gap-x-1.5 transition-colors [&.active]:text-primary"
      >
        <ArrowRightCircle size="20" />
        My content
      </Link>
      <Link
        to={'/my-subscriptions'}
        className="flex items-center gap-x-1.5 transition-colors [&.active]:text-primary"
      >
        <ArrowRightCircle size="20" />
        My subscriptions
      </Link>
      <Link
        to={'/rented-content'}
        className="flex items-center gap-x-1.5 transition-colors [&.active]:text-primary"
      >
        <ArrowRightCircle size="20" />
        Rented content
      </Link>
      <Link
        to={'/settings'}
        className="flex items-center gap-x-1.5 transition-colors [&.active]:text-primary"
      >
        <ArrowRightCircle size="20" />
        Settings
      </Link>
    </div>
  );
}
