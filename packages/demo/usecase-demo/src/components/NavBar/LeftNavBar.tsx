import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Compass, FilePlus, LogOut, User, UserCheck } from 'react-feather';
import useLocalStorageState from 'use-local-storage-state';
import iExecLogo from '@/assets/iexec-logo.svg';
import { AddressChip } from '@/components/NavBar/AddressChip.tsx';
import { useLoginLogout } from '@/components/NavBar/useLoginLogout.ts';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { useUserStore } from '@/stores/user.store.ts';
import { LOCAL_STORAGE_PREFIX } from '@/utils/localStorage.ts';
import { cn } from '@/utils/style.utils';

export function LeftNavBar({ className }: { className?: string }) {
  const { address } = useUserStore();
  const { logout } = useLoginLogout();
  const [isStorageDevMode, setStorageDevMode] = useLocalStorageState(
    `${LOCAL_STORAGE_PREFIX}_devMode`,
    { defaultValue: false }
  );
  const { isDevMode, setDevMode } = useDevModeStore();
  const [isMenuOpen, setMenuOpen] = useState(false);

  // Load value from localStorage
  useEffect(() => {
    setDevMode(isStorageDevMode);
  }, []);

  // Update localStorage value on change
  useEffect(() => {
    setStorageDevMode(isDevMode);
  }, [isDevMode]);

  const handleMenuToggle = () => {
    setMenuOpen((prevState) => !prevState);
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <div
      className={cn(
        'group relative z-30 h-full flex-none md:w-[280px]',
        className
      )}
    >
      <label
        className="group/checkbox fixed right-7 top-7 z-30 flex size-5 w-[26px] origin-center transform flex-col justify-between md:hidden"
        htmlFor="menu"
        onClick={handleMenuToggle}
      >
        <input
          type="checkbox"
          className="absolute -inset-4 size-14 cursor-pointer appearance-none bg-transparent"
          name="menu"
          id="menu"
          checked={isMenuOpen}
          readOnly
        />
        <span className="pointer-events-none block h-0.5 w-[26px] origin-right transform rounded-full bg-white duration-200 group-has-[:checked]/checkbox:-rotate-45"></span>
        <span className="pointer-events-none block h-0.5 w-[26px] origin-top-right transform rounded-full bg-white duration-200 group-has-[:checked]/checkbox:scale-x-0"></span>
        <span className="pointer-events-none block h-0.5 w-[26px] origin-right transform rounded-full bg-white duration-200 group-has-[:checked]/checkbox:rotate-45"></span>
      </label>
      <div className="fixed h-dvh w-full -translate-x-full rounded-r-3xl border-r border-grey-800 bg-grey-900 px-5 pt-10 duration-300 group-has-[:checked]:translate-x-0 md:w-[260px] md:translate-x-0">
        <div className="-mx-2 flex items-center p-2">
          <Link to={'/'} className="shrink-0" onClick={handleLinkClick}>
            <img src={iExecLogo} width="25" height="30" alt="iExec logo" />
          </Link>

          <div className="ml-3">
            <Link to={'/'} onClick={handleLinkClick}>
              <div className="font-mono font-bold leading-5">
                Content Creator
              </div>
            </Link>
            <div className="mt-1 rounded-xl border border-primary px-2.5 py-px text-xs text-primary">
              <span className="font-bold">DEMO APP</span> for{' '}
              <a
                href="https://beta.tools.docs.iex.ec/tools/dataProtector.html"
                target="_blank"
                className="inline-flex items-center hover:underline"
              >
                dataprotector-sdk
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
          onClick={handleLinkClick}
        >
          <Compass size="20" />
          Explore
        </Link>

        <Link
          to={'/rent'}
          className="-mx-1 mt-4 flex items-center gap-3 px-2 py-3 text-grey-400 transition-colors hover:text-white [&.active]:text-primary"
          onClick={handleLinkClick}
        >
          <FilePlus size="20" />
          Rent
        </Link>

        <Link
          to={'/subscribe'}
          className="-mx-1 mt-4 flex items-center gap-3 px-2 py-3 text-grey-400 transition-colors hover:text-white [&.active]:text-primary"
          onClick={handleLinkClick}
        >
          <UserCheck size="20" />
          Subscribe
        </Link>

        <Link
          to={'/my-content'}
          className="-mx-1 mt-4 flex items-center gap-3 px-2 py-3 text-grey-400 transition-colors hover:text-white [&.active]:text-primary"
          onClick={handleLinkClick}
        >
          <User size="20" />
          Manage
        </Link>

        <hr className="mt-10 border-grey-800" />

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
    </div>
  );
}
