import { Link } from '@tanstack/react-router';

export function ProfileNavMenu() {
  return (
    <div className="flex gap-x-12 border-b border-grey-700 pb-2">
      <Link
        to={'/my-content'}
        className="text-grey-400 flex items-center gap-x-1.5 text-lg transition-colors hover:text-white [&.active]:text-primary"
      >
        My content
      </Link>

      <Link
        to={'/settings'}
        className="text-grey-400 flex items-center gap-x-1.5 text-lg transition-colors hover:text-white [&.active]:text-primary"
      >
        My settings
      </Link>
    </div>
  );
}
