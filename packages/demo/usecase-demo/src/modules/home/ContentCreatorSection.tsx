import { ArrowUpRight, CheckCircle, DownloadCloud, Key } from 'react-feather';
import { Button } from '../../components/ui/button.tsx';
import { cn } from '../../utils/style.utils.ts';

export function ContentCreatorSection({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center gap-x-5', className)}>
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
