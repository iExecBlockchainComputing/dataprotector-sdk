import { CheckCircle, DownloadCloud, Key } from 'react-feather';
import { cn } from '../../utils/style.utils.ts';

export function ContentCreatorSection({ className }: { className?: string }) {
  return (
    <div className={cn('relative grid items-center gap-5 sm:flex', className)}>
      <div className="absolute -top-6 left-0 -z-10 size-[450px] -translate-x-2/3 -rotate-[12deg]">
        <div className="absolute inset-0 bg-[#1027CF] blur-[110px]"></div>
        <div className="absolute -right-12 -top-12 size-52 bg-[#5e1e6ed9] blur-[70px]"></div>
      </div>
      <div className="flex-1">
        <h2 className="grid scale-y-[.9] gap-4">
          <span className="bloc font-anybody text-4xl font-bold">
            Unleash your creativity
          </span>
          <span className="bloc text-2xl font-extrabold">
            Become a content creator and monetize what you own
          </span>
        </h2>
      </div>
      <div className="flex flex-1 flex-col gap-y-6">
        <div className="flex items-center gap-x-6 rounded-3xl border border-grey-700 px-6 py-5 sm:px-11 sm:py-10">
          <CheckCircle className="shrink-0" size="32" />
          <span className="text-lg">
            Choose monetization method (rent, subscription, sell)
          </span>
        </div>
        <div className="flex items-center gap-x-6 rounded-3xl border border-grey-700 px-6 py-5 sm:px-11 sm:py-10">
          <DownloadCloud className="shrink-0" size="32" />
          <span className="text-lg">
            Upload your content (pdf, articles, code, graphic assets)
          </span>
        </div>
        <div className="flex items-center gap-x-6 rounded-3xl border border-grey-700 px-6 py-5 sm:px-11 sm:py-10">
          <Key className="shrink-0" size="32" />
          <span className="text-lg">Manage ownership and profit</span>
        </div>
      </div>
    </div>
  );
}
