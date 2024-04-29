import { clsx } from 'clsx';
import avatarStyles from '@/modules/profile/profile.module.css';
import { getAvatarVisualNumber } from '@/utils/getAvatarVisualNumber.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import { useToast } from '../ui/use-toast.ts';

type AddressForNavBarProps = {
  address: string;
};

export function AddressChip(props: AddressForNavBarProps) {
  const { address } = props;

  const { toast } = useToast();

  const avatarVisualBg = getAvatarVisualNumber({
    address,
  });

  const displayAddress = truncateAddress(address);

  return (
    <div className="flex shrink-0 items-center rounded-[30px] bg-grey-800 px-3 py-2">
      <div className="text-sm font-medium text-primary">{displayAddress}</div>
      <button
        className="-my-0.5 -mr-0.5 ml-1.5 shrink-0 bg-grey-800 px-0.5 py-0.5"
        onClick={() => {
          navigator.clipboard.writeText(address.toLowerCase());
          toast({
            title: 'Address copied!',
            duration: 1200,
          });
        }}
      >
        <div
          className={clsx(
            avatarStyles[avatarVisualBg],
            'relative z-10 size-4 rounded-full bg-black bg-cover'
          )}
        />
      </button>
    </div>
  );
}
