import { type AddressOrENS } from '@iexec/dataprotector';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import styles from './MyContentCard.module.css';

export type OneProtectedData = {
  id: AddressOrENS;
  createdAt?: Date;
  name?: string;
  userId?: string;
  taskId?: string;
};

export function MyContentCard({ content }: { content: OneProtectedData }) {
  const cardVisualBg = Number(content.id[content.id.length - 1])
    ? 'card-visual-bg-1'
    : 'card-visual-bg-2';

  return (
    <>
      <Link
        to="/my-content/$contentId"
        params={{
          contentId: content.id,
        }}
        className="group relative mx-auto flex h-[193px] w-full items-center justify-center overflow-hidden rounded-t-xl transition-shadow hover:shadow-lg"
      >
        <div className={clsx(styles[cardVisualBg], 'h-full w-full')}>
          &nbsp;
        </div>
        <div className="border-grey-50 absolute bottom-3 right-4 h-[34px] rounded-30 border px-3 py-2 text-xs">
          Image
        </div>
      </Link>
      <div className="flex max-w-full truncate rounded-b-xl border-b border-l border-r border-grey-700 px-4 pb-6 pt-4 text-sm">
        <div className="mt-1 size-3 shrink-0 rounded-full bg-[#D9D9D9]">
          &nbsp;
        </div>
        <div className="ml-1.5 flex-1 truncate">
          <div className="text-grey-50 truncate">
            {!content.name ? content.id : content.name}
          </div>
          <div className="mt-0.5 truncate text-grey-500">
            {`${content.id.substring(0, 5)}...${content.id.substring(
              content.id.length - 5
            )}`}
          </div>
        </div>
        <div className="ml-3 shrink-0 text-right">
          <div className="whitespace-nowrap font-bold text-primary">
            0.01 RLC
          </div>
          <div className="mt-0.5 text-grey-500">Rent</div>
        </div>
      </div>
    </>
  );
}
