import { Link } from '@tanstack/react-router';
import { User, LogOut } from 'react-feather';
import '@fontsource/space-mono/700.css';
import iExecLogo from '../../assets/iexec-logo.svg';
import AddressChip from '../NavBar/AddressChip.tsx';
import { Button } from '../ui/button.tsx';
import { useUser } from './useUser';

export function NavBar() {
  const { isConnected, address, login, logout } = useUser();

  return (
    <header className="dark flex h-[64px] items-center bg-grey-900 px-8 text-white">
      <Link to={'/'} className="-mx-2 flex h-full items-center p-2">
        <img src={iExecLogo} width="25" height="30" alt="iExec logo" />

        <div className="ml-3 font-mono font-bold leading-5">
          Content Creator
        </div>
      </Link>

      {isConnected ? (
        <div className="flex flex-1 items-center justify-end">
          <AddressChip address={address!} />
          <Link
            to={'/my-content'}
            className="hover:drop-shadow-link-hover ml-3 p-1"
          >
            <div className="rounded-full border-[1.5px] p-0.5">
              <User size="20" />
            </div>
          </Link>
          <button
            type="button"
            className="hover:drop-shadow-link-hover -mr-2 ml-2 p-1"
            onClick={() => logout()}
          >
            <LogOut size="25" />
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-end">
          <Button
            size="sm"
            className="w-[98px]"
            onClick={() => {
              login();
            }}
          >
            Login
          </Button>
        </div>
      )}
    </header>
  );
}
