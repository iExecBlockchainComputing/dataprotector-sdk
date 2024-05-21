import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LogOut } from 'react-feather';
import useLocalStorageState from 'use-local-storage-state';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { useUserStore } from '@/stores/user.store.ts';
import { LOCAL_STORAGE_PREFIX } from '@/utils/localStorage.ts';
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
    `${LOCAL_STORAGE_PREFIX}_devMode`,
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
    <header className="group fixed inset-x-0 top-0 z-20 flex flex-col bg-grey-900 bg-opacity-50 px-4 text-white drop-shadow-[0_0_10px_rgb(0,0,0)] backdrop-blur-md has-[:checked]:inset-0 has-[:checked]:bg-grey-900 md:sticky md:h-[64px] md:flex-row md:px-4 lg:px-8">
      <div className="static left-4 block py-2 duration-300 md:static md:block">
        <div className="-mx-2 flex h-full items-center p-2">
          <Link to={'/'} className="shrink-0">
            <img src={iExecLogo} width="25" height="30" alt="iExec logo" />
          </Link>

          <div className="ml-3">
            <Link to={'/'}>
              <div className="font-mono font-bold leading-5">
                Content Creator
              </div>
            </Link>
            <div className="mt-1 rounded-xl border border-primary px-2.5 py-px text-xs text-primary">
              <span className="font-bold">DEMO</span> for{' '}
              <a
                href="https://documentation-tools.vercel.app/tools/dataProtector.html"
                target="_blank"
                className="inline-flex items-center hover:underline"
              >
                dataprotector-sdk
              </a>
            </div>
          </div>
        </div>
      </div>
      {isConnected && (
        <label
          className="group/checkbox fixed right-7 top-7 z-30 flex size-5 w-[26px] origin-center transform flex-col justify-between md:hidden"
          htmlFor="menu"
        >
          <input
            type="checkbox"
            className="absolute -inset-4 size-14 appearance-none"
            name="menu"
            id="menu"
          />
          <span className="block h-0.5 w-[26px] origin-right transform rounded-full bg-white duration-200 group-has-[:checked]/checkbox:-rotate-45"></span>
          <span className="block h-0.5 w-[26px] origin-top-right transform rounded-full bg-white duration-200 group-has-[:checked]/checkbox:scale-x-0"></span>
          <span className="block h-0.5 w-[26px] origin-right transform rounded-full bg-white duration-200 group-has-[:checked]/checkbox:rotate-45"></span>
        </label>
      )}

      {isConnected ? (
        <div className="mb-16 hidden flex-1 flex-col justify-center gap-y-4 pl-4 group-has-[:checked]:flex md:mb-0 md:flex md:translate-y-0 md:flex-row md:items-center md:justify-end lg:ml-4">
          <div className="flex flex-col gap-y-4 md:mx-2 md:flex-row md:items-start md:gap-x-2 md:text-base lg:ml-6 lg:mr-8 lg:gap-x-5 xl:mr-20 xl:gap-x-16">
            <Link
              to={'/explore'}
              className="py-1 hover:drop-shadow-link-hover md:px-1"
            >
              Explore
            </Link>
            <Link
              to={'/rent'}
              className="py-1 hover:drop-shadow-link-hover md:px-1 lg:block"
            >
              Rent
            </Link>
            <Link
              to={'/subscribe'}
              className="py-1 hover:drop-shadow-link-hover md:px-1 lg:block"
            >
              Subscribe
            </Link>
            <Link
              to={'/my-content'}
              className="py-1 hover:drop-shadow-link-hover md:px-1 lg:block"
            >
              Manage
            </Link>
          </div>

          <div className="-order-1 mb-4 flex md:-order-none md:mb-0">
            <AddressChip className="md:hidden lg:flex" address={address!} />
            <button
              type="button"
              className="-mr-2 ml-2 p-1 hover:drop-shadow-link-hover"
              onClick={() => logout()}
            >
              <LogOut size="25" />
            </button>
          </div>
          <div className="mx-4 hidden h-[36px] w-px bg-grey-700 md:block"></div>
          <Label
            htmlFor="dev-mode"
            className="flex items-center space-x-2 py-2 md:py-1"
          >
            <Switch
              id="dev-mode"
              checked={isDevMode}
              onCheckedChange={setDevMode}
            />
            <span className="whitespace-nowrap">Dev Mode</span>
          </Label>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-end md:flex">
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
