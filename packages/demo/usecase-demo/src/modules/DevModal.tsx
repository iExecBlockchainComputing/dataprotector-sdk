import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import useLocalStorageState from 'use-local-storage-state';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { DocLink } from '@/components/DocLink';

export function DevModal() {
  const { isDevMode, setDevMode } = useDevModeStore();
  const [ open, setOpen ] = useState(true);
  const [ isStorageDevMode, setStorageDevMode ] = useLocalStorageState(
    'ContentCreator_devMode',
    { defaultValue: false }
  );
  const [ isStorageModalViewed, setStorageModalViewed ] = useLocalStorageState(
    'ContentCreator_modalViewed',
    { defaultValue: false }
  );
  // setStorageModalViewed(false)

  // Load value from localStorage
  useEffect(() => {
    setDevMode(isStorageDevMode);
  }, []);

  // Update localStorage value on change
  useEffect(() => {
    setStorageDevMode(isDevMode);
  }, [isDevMode]);
  
  useEffect(() => {
    if (open == false) {
      setStorageModalViewed(true);
    }
  }, [open]);

  if (!isStorageModalViewed) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disclaimer</DialogTitle>
            <DialogDescription>
              This dApp is a demo to learn the methods and see them in action. It is not a Content Creator application for creating and distributing Web3 content.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>  
            <h4 className='text-xl font-bold'>Try developper mode</h4>
            <div className="flex items-center space-x-2">
              <Switch
                id="dev-mode"
                checked={isDevMode}
                onCheckedChange={setDevMode}
              />
              <Label htmlFor="dev-mode">Use the developer mode switch to view methods. </Label>
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
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}