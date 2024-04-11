import { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { DocLink } from '@/components/DocLink';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDevModeStore } from '@/stores/devMode.store.ts';

export function DisclaimerModal() {
  const { isDevMode, setDevMode } = useDevModeStore();
  const [open, setOpen] = useState(true);
  const [isStorageDevMode, setStorageDevMode] = useLocalStorageState(
    'ContentCreator_devMode',
    { defaultValue: false }
  );
  const [isStorageDisclaimerViewed, setStorageDisclaimerViewed] =
    useLocalStorageState('ContentCreator_disclaimerViewed', {
      defaultValue: false,
    });

  // Load value from localStorage
  useEffect(() => {
    setDevMode(isStorageDevMode);
  }, []);

  // Update localStorage value on change
  useEffect(() => {
    setStorageDevMode(isDevMode);
  }, [isDevMode]);

  function onModalOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      setStorageDisclaimerViewed(true);
    }
  }

  if (isStorageDisclaimerViewed) {
    return false;
  }

  return (
    <Dialog open={open} onOpenChange={onModalOpenChange}>
      <DialogContent className="pt-6">
        <DialogDescription className='pb-6'>
          <div className="grid gap-4">
            <DialogTitle>Disclaimer</DialogTitle>
            <p>
              This dApp is a demo to learn the methods and see them in action.
              It is not a Content Creator application for creating and
              distributing Web3 content.
            </p>
          </div>
          <div className="grid gap-4">
            <h4 className="text-xl font-bold">Try developer mode</h4>
            <div className="flex items-center space-x-2">
              <Switch
                id="dev-mode"
                checked={isDevMode}
                onCheckedChange={setDevMode}
              />
              <Label htmlFor="dev-mode">
                Use the developer mode switch to view methods.{' '}
              </Label>
            </div>
          </div>
          <DocLink className={isDevMode ? 'visible' : 'invisible'}>
            dataprotector-sdk / Method called:{' '}
            <a
              href="https://tools.docs.iex.ec/tools/dataprotector/methods/fetchprotecteddata"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              fetchProtectedData()
            </a>
          </DocLink>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
