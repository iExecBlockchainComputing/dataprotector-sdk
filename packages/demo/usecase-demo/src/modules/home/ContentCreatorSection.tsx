import { ArrowUpRight, CheckCircle, DownloadCloud, Key } from 'react-feather';
import { Button } from '../../components/ui/button.tsx';
import { cn } from '../../utils/style.utils.ts';

export function ContentCreatorSection({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-x-5 relative', className)}>
      <div className="absolute -z-10 left-0 -top-6 size-[450px] -rotate-[12deg] -translate-x-2/3">
        <div className="absolute inset-0 bg-[#1027CF] blur-[110px]"></div>
        <div className="absolute -top-12 -right-12 bg-[#5e1e6ed9] blur-[70px] size-52"></div>
      </div>
      <div className="flex-1">
        <h2 className="scale-y-[.9] grid gap-4">
          <span className="bloc font-bold font-anybody text-4xl">
            Unleash your creativity
          </span>
          <span className="bloc font-extrabold text-2xl">
            Become Content Creator and monetize your voice
          </span>
        </h2>
        <p className="mt-[24px]">
          Texte à ajouter - texte à ajouter - texte à ajouter - texte à ajouter
          <br />
          Texte à ajouter - texte à ajouter - texte à ajouter - texte à ajouter
          <br />
          Texte à ajouter - texte à ajouter - texte à ajouter - texte à ajouter
          <br />
        </p>
        <div className="mt-[60px]">
          <Button>
            Let's go
            <ArrowUpRight size="20" className="-mr-1 ml-1.5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-y-6">
        <div className="flex items-center gap-x-6 rounded-3xl border border-grey-700 px-11 py-10">
          <CheckCircle className="shrink-0" size="32" />
          <span className="text-lg">
            Choose your monetization (rent, subscription, sell)
          </span>
        </div>
        <div className="flex items-center gap-x-6 rounded-3xl border border-grey-700 px-11 py-10">
          <DownloadCloud className="shrink-0" size="32" />
          <span className="text-lg">
            Upload your content (pdf, articles, code, graphic assets)
          </span>
        </div>
        <div className="flex items-center gap-x-6 rounded-3xl border border-grey-700 px-11 py-10">
          <Key className="shrink-0" size="32" />
          <span className="text-lg">Ownership</span>
        </div>
      </div>
    </div>
  );
}
