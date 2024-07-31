import { clsx } from 'clsx';
import { useState } from 'react';
import { Lock } from 'react-feather';
import { useLoginLogout } from '@/components/NavBar/useLoginLogout.ts';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import styles from './OneContentCard.module.css';

export function OneContentCardLoginModal({
  protectedDataAddress,
}: {
  protectedDataAddress: string;
}) {
  const { login } = useLoginLogout();
  const [isOpen, setOpen] = useState(false);

  const cardVisualBg = getCardVisualNumber({
    address: protectedDataAddress,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger className="group relative mx-auto flex aspect-[2/1] w-full flex-none items-center justify-center overflow-hidden rounded-t-3xl transition-shadow hover:shadow-lg">
        <div
          className={clsx(
            styles[cardVisualBg],
            'relative flex h-full w-full items-center justify-center bg-cover bg-bottom'
          )}
        >
          <Lock
            size="30"
            className="absolute text-grey-50 opacity-100 duration-200 group-hover:opacity-50"
          />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pr-8">
            Connect your wallet to see this content
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-4">
          Please connect your wallet to access the content page. Rent content,
          subscribe to creators, and upload your own content.{' '}
        </div>
        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button
            onClick={() => {
              login();
            }}
          >
            Connect wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
