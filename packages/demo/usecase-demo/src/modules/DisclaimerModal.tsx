import { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { DocLink } from '@/components/DocLink';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog.tsx';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { LOCAL_STORAGE_PREFIX } from '@/utils/localStorage.ts';

export function DisclaimerModal() {
  const { isDevMode, setDevMode } = useDevModeStore();
  const [open, setOpen] = useState(true);
  const [isStorageDevMode, setStorageDevMode] = useLocalStorageState(
    `${LOCAL_STORAGE_PREFIX}_devMode`,
    { defaultValue: false }
  );
  const [isStorageDisclaimerViewed, setStorageDisclaimerViewed] =
    useLocalStorageState(`${LOCAL_STORAGE_PREFIX}_disclaimerViewed`, {
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
        <div className="grid gap-8 px-6 pb-6 pt-5">
          <div className="grid gap-4">
            <DialogTitle>Disclaimer</DialogTitle>
            <p>
              This website is intended solely for demonstration purposes. It
              aims to illustrate the functionalities of the{' '}
              <a
                className="text-primary hover:underline"
                href="https://documentation-tools.vercel.app/tools/dataProtector.html"
              >
                DataProtector SDK
              </a>{' '}
              and to assist users in understanding its methods by showcasing
              them in action.
              <br />
              Please note that this is exclusively a demonstration and not a
              full application for content creation and distribution.
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
            <div className="h-[70px]">
              <DocLink className={isDevMode ? 'visible' : 'invisible'}>
                dataprotector-sdk / Method called:{' '}
                <a
                  href="https://documentation-tools.vercel.app/tools/dataProtector/dataProtectorSharing/misc/getProtectedDataInCollections.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  getProtectedDataInCollections()
                </a>
              </DocLink>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
