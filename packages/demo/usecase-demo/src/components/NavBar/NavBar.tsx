import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { User, LogOut } from 'react-feather';
import useLocalStorageState from 'use-local-storage-state';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import iExecLogo from '../../assets/iexec-logo.svg';
import { useDevModeStore } from '../../stores/devMode.store.ts';
import AddressChip from '../NavBar/AddressChip.tsx';
import { Button } from '../ui/button.tsx';
import { Label } from '../ui/label.tsx';
import { Switch } from '../ui/switch.tsx';
import { useUser } from '../../hooks/useUser.ts';

export function NavBar() {
  const { isConnected, address, login, logout } = useUser();
  const [isStorageDevMode, setStorageDevMode] = useLocalStorageState(
    'ContentCreator_devMode',
    { defaultValue: false }
  );
  const { isDevMode, setDevMode } = useDevModeStore();

  // Load value from localStorage
  useEffect(() => {
    setDevMode(isStorageDevMode);
  }, []);

  // Update localStorage value on change
  useEffect(() => {
    setStorageDevMode(isDevMode);
  }, [isDevMode]);

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
            to={'/my-content2'}
            className="ml-3 p-1 hover:drop-shadow-link-hover"
          >
            <div className="rounded-full border-[1.5px] p-0.5">
              <User size="20" />
            </div>
          </Link>
          <button
            type="button"
            className="-mr-2 ml-2 p-1 hover:drop-shadow-link-hover"
            onClick={() => logout()}
          >
            <LogOut size="25" />
          </button>
          <div className="mx-4 h-[36px] w-px bg-grey-700"></div>
          <Label
            htmlFor="dev-mode"
            className="ml-3 flex items-center space-x-2 py-1"
          >
            <Switch
              id="dev-mode"
              checked={isDevMode}
              onCheckedChange={setDevMode}
            />
            <span>Dev Mode</span>
          </Label>
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
