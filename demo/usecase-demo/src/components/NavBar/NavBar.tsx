import { NavLink } from 'react-router-dom';
import { LogOut } from 'react-feather';
import '@fontsource/space-mono/700.css';
import iExecLogo from '../../assets/iexec-logo.svg';
import { useUser } from './useUser';
import AddressChip from '../NavBar/AddressChip.tsx';
import { Button } from '../ui/button.tsx';

export function NavBar() {
  const { isConnected, address, login, logout } = useUser();

  return (
    <header className="dark flex h-[64px] items-center bg-grey-900 px-8 text-white">
      <NavLink to={'/'} className="-mx-2 flex h-full items-center p-2">
        <img src={iExecLogo} width="25" height="30" alt="iExec logo" />

        <div className="ml-3 font-mono font-bold leading-5">
          Content Creator
        </div>
      </NavLink>

      {isConnected ? (
        <div className="flex flex-1 items-center justify-end gap-x-1">
          <AddressChip address={address!} />
          <button
            type="button"
            className="-mr-2 bg-grey-900 p-2"
            onClick={() => logout()}
          >
            <LogOut size="20" />
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-end">
          {/* w-[98px] = Match what's in react ui kit */}
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
