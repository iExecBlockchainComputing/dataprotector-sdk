
import { CheckCircle, DownloadCloud, Key } from 'react-feather';
import { Button } from '../components/ui/button.tsx';
import { cn } from '../utils/style.utils.ts';

export function ContentCreatorSection({className}: {className?: string}) {
  return (
    <div className={cn('flex gap-x-28', className)}>
      <div className="flex-1">
        <h2 className="scale-y-[.8] font-anybody text-3xl">
          Become Content Creator and share the content of your choice
        </h2>
        <p className="mt-[36px]">
          Texte à ajouter - texte à ajouter - texte à ajouter - texte à ajouter<br />
          Texte à ajouter - texte à ajouter - texte à ajouter - texte à ajouter<br />
          Texte à ajouter - texte à ajouter - texte à ajouter - texte à ajouter<br />
        </p>
        <div className="mt-[60px]">
          <Button>Let's go</Button>
        </div>
      </div>
      <div className="flex-1 flex gap-y-6 flex-col">
        <div className="rounded-3xl gap-x-6 border border-grey-700 px-11 py-10 flex">
          <CheckCircle className="shrink-0" size="32" />
          <span className="text-lg">Choose your monetization (rent, subscription, sell)</span>
        </div>
        <div className="rounded-3xl gap-x-6 border border-grey-700 px-11 py-10 flex">
          <DownloadCloud className="shrink-0" size="32" />
          <span className="text-lg">Upload your content (pdf, articles, code, graphic assets)</span>
        </div>
        <div className="rounded-3xl gap-x-6 border border-grey-700 px-11 py-10 flex">
          <Key className="shrink-0" size="32" />
          <span className="text-lg">Ownership</span>
        </div>
      </div>
    </div>
  );
}
