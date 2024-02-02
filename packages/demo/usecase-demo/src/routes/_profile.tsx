import { FileRoute, Outlet } from '@tanstack/react-router';
import { clsx } from 'clsx';
import LoginGuard from '../modules/profile/LoginGuard.tsx';
import { ProfileNavMenu } from '../modules/profile/ProfileNavMenu.tsx';
import styles from './_profile.module.css';

export const Route = new FileRoute('/_profile').createRoute({
  component: ProfileLayout,
});

export function ProfileLayout() {
  return (
    <LoginGuard>
      <div>
        <div
          className={clsx(
            styles['profile-banner'],
            'profile-banner relative mb-[95px] h-[250px] w-full rounded-3xl border border-grey-700'
          )}
        >
          <div className="absolute -bottom-[40px] left-[40px] size-[140px] rounded-full border-[5px] border-[#D9D9D9] bg-black"></div>
        </div>

        <ProfileNavMenu />

        <div className="mt-10">
          <Outlet />
        </div>
      </div>
    </LoginGuard>
  );
}
