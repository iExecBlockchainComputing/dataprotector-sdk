import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import {
  Compass,
  ExternalLink,
  FilePlus,
  LogOut,
  User,
  UserCheck,
} from 'react-feather';
import useLocalStorageState from 'use-local-storage-state';
import iExecLogo from '@/assets/iexec-logo.svg';
import { AddressChip } from '@/components/NavBar/AddressChip.tsx';
import { useLoginLogout } from '@/components/NavBar/useLoginLogout.ts';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { useUserStore } from '@/stores/user.store.ts';

export function LeftNavBar() {
  const { address } = useUserStore();
  const { logout } = useLoginLogout();
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
    <div className="min-h-dvh min-w-[240px] rounded-3xl border border-grey-800 px-5 pt-10">
      <div className="-mx-2 flex items-center p-2">
        <Link to={'/'}>
          <img src={iExecLogo} width="25" height="30" alt="iExec logo" />
        </Link>

        <div className="ml-3">
          <Link to={'/'}>
            <div className="pl-1 font-mono font-bold leading-5">
              Content Creator
            </div>
          </Link>
          <div className="mt-1.5 rounded-xl bg-grey-100 px-2.5 py-1 text-xs leading-3 text-black">
            <span className="font-bold">DEMO APP</span> for{' '}
            <a
              href="https://documentation-tools.vercel.app/tools/dataProtector.html"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center hover:text-yellow-700"
            >
              dataprotector-sdk
              <ExternalLink size="14" className="-mr-0.5 ml-1 inline-block" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center">
        <AddressChip address={address!} />
        <button
          type="button"
          className="-mr-2 ml-2 p-1 hover:drop-shadow-link-hover"
          onClick={() => logout()}
        >
          <LogOut size="20" />
        </button>
      </div>

      <Link
        to={'/explore'}
        className="-mx-1 mt-11 flex items-center gap-3 px-2 py-3 text-grey-400 transition-colors hover:text-white [&.active]:text-primary"
      >
        <Compass size="20" />
        Explore
      </Link>

      <Link
        to={'/rent'}
        className="-mx-1 mt-4 flex items-center gap-3 px-2 py-3 text-grey-400 transition-colors hover:text-white [&.active]:text-primary"
      >
        <FilePlus size="20" />
        Rent
      </Link>

      <Link
        to={'/subscribe'}
        className="-mx-1 mt-4 flex items-center gap-3 px-2 py-3 text-grey-400 transition-colors hover:text-white [&.active]:text-primary"
      >
        <UserCheck size="20" />
        Subscribe
      </Link>

      <Link
        to={'/my-content'}
        className="-mx-1 mt-4 flex items-center gap-3 px-2 py-3 text-grey-400 transition-colors hover:text-white [&.active]:text-primary"
      >
        <User size="20" />
        Manage
      </Link>

      <hr className="mt-10 border-grey-700" />

      <Label
        htmlFor="dev-mode"
        className="mt-8 flex items-center space-x-2 py-1"
      >
        <Switch
          id="dev-mode"
          checked={isDevMode}
          onCheckedChange={setDevMode}
        />
        <span>Dev Mode</span>
      </Label>
    </div>
  );
}
