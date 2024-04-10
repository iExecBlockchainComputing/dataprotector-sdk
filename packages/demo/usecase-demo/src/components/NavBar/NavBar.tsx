import '@fontsource/space-mono/700.css';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LogOut } from 'react-feather';
import useLocalStorageState from 'use-local-storage-state';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { useUserStore } from '@/stores/user.store.ts';
import iExecLogo from '../../assets/iexec-logo.svg';
import { AddressChip } from '../NavBar/AddressChip.tsx';
import { Button } from '../ui/button.tsx';
import { Label } from '../ui/label.tsx';
import { Switch } from '../ui/switch.tsx';
import { useLoginLogout } from './useLoginLogout.ts';

export function NavBar() {
  const { isConnected, address } = useUserStore();
  const { login, logout } = useLoginLogout();
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
    <header className="sticky top-0 z-20 flex h-[64px] items-center bg-grey-900 px-8 text-white drop-shadow-[0_0_10px_rgb(0,0,0)]">
      <Link to={'/'} className="-mx-2 flex h-full items-center p-2">
        <img src={iExecLogo} width="25" height="30" alt="iExec logo" />

        <div className="ml-3 font-mono font-bold leading-5">
          Content Creator
        </div>
      </Link>

      {isConnected ? (
        <div className="flex flex-1 items-center justify-end">
          <div className="ml-6 mr-4 flex gap-x-2 lg:mr-12 lg:gap-x-10 xl:mr-20 xl:gap-x-16">
            <Link to={'/explore'} className="p-1 hover:drop-shadow-link-hover">
              Explore
            </Link>
            <Link
              to={'/subscribe'}
              className="p-1 hover:drop-shadow-link-hover"
            >
              Subscribe
            </Link>
            <Link
              to={'/my-content'}
              className="p-1 hover:drop-shadow-link-hover"
            >
              Manage
            </Link>
          </div>

          <AddressChip address={address!} />
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
            variant="outline"
            onClick={() => {
              login();
            }}
          >
            Connect wallet
          </Button>
        </div>
      )}
    </header>
  );
}
