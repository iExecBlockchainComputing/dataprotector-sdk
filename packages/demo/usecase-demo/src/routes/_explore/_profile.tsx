import { clsx } from 'clsx';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ProfileNavMenu } from '../../modules/profile/ProfileNavMenu.tsx';
import styles from './_profile.module.css';

export const Route = createFileRoute('/_explore/_profile')({
  component: ProfileLayout,
});

export function ProfileLayout() {
  return (
    <div className="-mt-20">
      <div
        className={clsx(
          styles['profile-banner'],
          'profile-banner relative mb-[95px] h-[250px] w-full rounded-3xl'
        )}
      >
        <div className="absolute -bottom-[40px] left-0 size-[118px] rounded-full border-[5px] border-[#D9D9D9] bg-black"></div>
      </div>

      <ProfileNavMenu />

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
