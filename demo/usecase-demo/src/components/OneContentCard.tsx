import { type AddressOrENS } from '@iexec/dataprotector';
import { ExternalLink, Lock, Unlock } from 'react-feather';
import { Badge } from './ui/badge.tsx';
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
        className="group relative mx-auto flex h-[112px] w-[128px] items-center justify-center overflow-hidden rounded-xl transition-shadow hover:shadow-lg"
        onClick={() => onClickContent({ address: content.address })}
      >
        <div className="card-gradient h-[190px] w-[410px]">&nbsp;</div>
        <Lock
          size="30"
          className="absolute left-[49px] top-[41px] text-gray-500 opacity-100 transition-opacity group-hover:opacity-0"
        />
        <Unlock
          size="30"
          className="absolute left-[49px] top-[41px] text-white opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
      <div className="mt-2 text-center text-sm">
        <div className="truncate">{content.name}</div>
        {!content.name && <div className="truncate">{content.address}</div>}
        <div>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger>
                Posted:{' '}
                <Badge variant="secondary">
                  {timeAgo(content.creationTimestamp)}
                </Badge>
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
    </>
  );
}
