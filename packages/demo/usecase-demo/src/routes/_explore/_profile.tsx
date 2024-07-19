import { createFileRoute, Outlet } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useUserStore } from '@/stores/user.store.ts';
import { getAvatarVisualNumber } from '@/utils/getAvatarVisualNumber.ts';
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import styles from '../../modules/home/allCreators/OneCreatorCard.module.css';
import { ProfileNavMenu } from '../../modules/profile/ProfileNavMenu.tsx';
import avatarStyles from '../../modules/profile/profile.module.css';

export const Route = createFileRoute('/_explore/_profile')({
  component: ProfileLayout,
});

export function ProfileLayout() {
  const { address: userAddress } = useUserStore();

  const cardVisualBg = getCardVisualNumber({
    address: userAddress as string,
  });

  const avatarVisualBg = getAvatarVisualNumber({
    address: userAddress as string,
  });

  return (
    <div className="relative">
      <div
        className={clsx(
          styles[cardVisualBg],
          'absolute -top-40 mb-14 h-[228px] w-full rounded-3xl bg-[length:100%_100%] bg-center opacity-[0.22]'
        )}
      ></div>
      <div
        className={clsx(
          avatarStyles[avatarVisualBg],
          'relative z-10 mb-10 mt-20 size-[118px] rounded-full border-4 border-[#D9D9D9] bg-black'
        )}
      />

      <ProfileNavMenu />

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
