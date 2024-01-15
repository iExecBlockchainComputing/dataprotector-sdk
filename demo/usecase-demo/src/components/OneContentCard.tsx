import { type AddressOrENS } from '@iexec/dataprotector';
import { ExternalLink, Lock, Unlock } from 'react-feather';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip.tsx';
import { timeAgo } from '../utils/timeAgo.ts';
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
        <div className="card-gradient h-full w-full">&nbsp;</div>
        <Lock
          size="30"
          className="absolute left-[calc(1/2 - 15px)] top-[calc(1/2 - 15px)] text-grey-50 opacity-100 group-hover:opacity-0"
        />
        <Unlock
          size="30"
          className="absolute left-[calc(1/2 - 15px)] top-[calc(1/2 - 15px)] text-grey-50 opacity-0 group-hover:opacity-100"
        />
      </button>
      <div className="px-4 pt-4 pb-6 text-sm bg-grey-800 rounded-b-xl flex max-w-full truncate">
        <div className="size-3 bg-[#D9D9D9] rounded-full mt-1 shrink-0">
          &nbsp;
        </div>
        <div className='ml-1.5'>
          <div className="truncate text-grey-50">
            {!content.name ? content.address : content.name}
          </div>
          <div>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger>
                  Posted: {timeAgo(content.creationTimestamp)}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(content.createdAt)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            <a
              href={`https://explorer.iex.ec/bellecour/dataset/${content.address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs underline"
            >
              <span>explorer</span>
              <ExternalLink size="12" className="ml-1" />
            </a>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className='whitespace-nowrap text-primary font-bold'>
            0.01 RLC
          </div>
          <div className='text-grey-500'>Rent</div>
        </div>
      </div>
    </>
  );
}
