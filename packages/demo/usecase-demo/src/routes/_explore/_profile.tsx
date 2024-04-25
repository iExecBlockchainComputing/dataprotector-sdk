import { createFileRoute, Outlet } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useUserStore } from '@/stores/user.store.ts';
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import styles from '../../modules/home/allCreators/OneCreatorCard.module.css';
import { ProfileNavMenu } from '../../modules/profile/ProfileNavMenu.tsx';

export const Route = createFileRoute('/_explore/_profile')({
  component: ProfileLayout,
});

export function ProfileLayout() {
  const { address: userAddress } = useUserStore();

  const cardVisualBg = getCardVisualNumber({
    address: userAddress as string,
  });

  return (
    <div className="-mt-20">
      <div
        className={clsx(
          styles[cardVisualBg],
          'profile-banner relative mb-[95px] h-[228px] w-full rounded-3xl bg-cover bg-bottom'
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
