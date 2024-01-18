import { type AddressOrENS } from '@iexec/dataprotector';
import { Lock, Unlock } from 'react-feather';
import './OneContentCard.css';

export type OneProtectedData = {
  address: AddressOrENS;
  createdAt?: Date;
  name?: string;
  userId?: string;
  taskId?: string;
};

export function OneContentCard({ content }: { content: OneProtectedData }) {
  async function onClickContent({ address }: { address: AddressOrENS }) {
    console.log('TODO', address);
    return;
  }

  return (
    <>
      <button
        type="button"
        className="group relative mx-auto flex h-[193px] w-full items-center justify-center overflow-hidden rounded-t-xl transition-shadow hover:shadow-lg"
        onClick={() => onClickContent({ address: content.address })}
      >
        <div className="card-visual-bg h-full w-full">&nbsp;</div>
        <Lock
          size="30"
          className="left-[calc(1/2 - 15px)] top-[calc(1/2 - 15px)] text-grey-50 absolute opacity-100 group-hover:opacity-0"
        />
        <Unlock
          size="30"
          className="left-[calc(1/2 - 15px)] top-[calc(1/2 - 15px)] text-grey-50 absolute opacity-0 group-hover:opacity-100"
        />
        <div className="border-grey-50 absolute bottom-3 right-4 h-[34px] rounded-30 border px-3 py-2 text-xs">
          Article
        </div>
      </button>
      <div className="flex max-w-full truncate rounded-b-xl border-b border-l border-r border-grey-700 px-4 pb-6 pt-4 text-sm">
        <div className="mt-1 size-3 shrink-0 rounded-full bg-[#D9D9D9]">
          &nbsp;
        </div>
        <div className="ml-1.5 flex-1 truncate">
          <div className="text-grey-50 truncate">
            {!content.name ? content.address : content.name}
          </div>
          <div className="mt-0.5 truncate text-grey-500">
            {`${content.address.substring(0, 5)}...${content.address.substring(
              content.address.length - 5
            )}`}
          </div>
          {/*<div>*/}
          {/*  Posted: {timeAgo(content.creationTimestamp)}*/}
          {/*</div>*/}
          {/*<div>*/}
          {/*  <a*/}
          {/*    href={`https://explorer.iex.ec/bellecour/dataset/${content.address}`}*/}
          {/*    target="_blank"*/}
          {/*    rel="noreferrer"*/}
          {/*    className="inline-flex items-center text-xs underline"*/}
          {/*  >*/}
          {/*    <span>explorer</span>*/}
          {/*    <ExternalLink size="12" className="ml-1" />*/}
          {/*  </a>*/}
          {/*</div>*/}
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
