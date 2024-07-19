import { useEffect } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { DocLink } from '@/components/DocLink';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog.tsx';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { useDisclaimerModalStore } from '@/stores/disclaimerModal.store.ts';
import { LOCAL_STORAGE_PREFIX } from '@/utils/localStorage.ts';

export function DisclaimerModal() {
  const { isDevMode, setDevMode } = useDevModeStore();
  const { isDisclaimerModalOpen, isForceOpen, setDisclaimerModalOpen } =
    useDisclaimerModalStore();
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
    setDisclaimerModalOpen(open);
    if (!open) {
      setStorageDisclaimerViewed(true);
    }
  }

  if (isStorageDisclaimerViewed && !isForceOpen) {
    return false;
  }

  return (
    <Dialog open={isDisclaimerModalOpen} onOpenChange={onModalOpenChange}>
      <DialogContent className="pt-6">
        <div className="grid gap-8 px-6 pb-6 pt-5">
          <div className="grid gap-4">
            <DialogTitle>Disclaimer</DialogTitle>
            <div className="mt-2 max-h-[45dvh] overflow-auto pr-2">
              <p>
                The Content Creator project (“The Product”) described herein and
                its associated use cases is for general informational purposes
                only.
              </p>
              <p className="mt-2">
                All information on the platform
                (https://demo.iex.ec/content-creator/) is provided in good
                faith, however, we make no representation or warranty of any
                kind, express or implied, regarding the accuracy, adequacy,
                validity, reliability, availability, or completeness of any
                information on the platform.
              </p>
              <p className="mt-2">
                The Content Creator project is solely intended for use as a
                hypothetical use case and development tool demonstration. It
                does not represent an actual application or service available
                for use or deployment in any form.
              </p>
              <p className="mt-2">
                All descriptions, features, functionalities, and capabilities
                outlined are purely fictional and provided for educational and
                illustrative purposes only. Furthermore, while the Content
                Creator module may simulate certain aspects of content sharing,
                monetization, and data protection, it does not constitute legal,
                financial, or technical advice.
              </p>
              <p className="mt-2">
                Users should not rely on the information provided within this
                context for making business decisions or implementing real-world
                solutions.
              </p>
              <p className="mt-2">
                It is important to note that iExec, as the provider of this
                project, explicitly disclaims any responsibility or liability
                for the use, misuse, or consequences arising from the Content
                Creator project. iExec shall not be held accountable for any
                damages, losses, or legal implications resulting from the
                utilization of the information, tools, or concepts presented
                herein.
              </p>
              <p className="mt-2">
                Additionally, iExec does not undertake any obligation to
                moderate or monitor the use of the Content Creator project.
                Users are solely responsible for their actions and compliance
                with all applicable laws, regulations, and industry standards
                when engaging with this project.
              </p>
              <p className="mt-2">
                By engaging with the Content Creator project and associated
                materials, users acknowledge and accept that iExec assumes no
                liability and provides no warranties or guarantees regarding the
                accuracy, suitability, or performance of the project for any
                specific purpose.
              </p>
              <p className="mt-2">
                In addition, by using this platform, you agree to encrypt and
                secure your data, ensuring compliance with data privacy
                regulations and avoiding the sharing of Personally Identifiable
                Information (PII). The platform is not responsible for any data
                breaches that result from unauthorized access to unencrypted or
                improperly secured data.
              </p>
              <p className="mt-2">
                The use cases involving Real World Assets (RWA), Non-Fungible
                Tokens (NFTs), and other valuable datasets, including AI
                (Artificial Intelligence) Models, are currently under
                development and subject to change. The platform does not
                guarantee monetization outcomes and users should exercise
                caution and conduct due diligence before engaging in
                transactions involving RWAs, NFTs, or AI Models.
              </p>
              <p className="mt-2">
                Web 3.0 technologies, including blockchain and decentralized
                applications, involve inherent risks. These risks include but
                are not limited to security vulnerabilities, regulatory
                uncertainties, and technological limitations.
              </p>
              <p className="mt-2">
                In particular, the legal classification of digital assets,
                including but not limited to cryptocurrencies, tokens, and
                virtual currencies, varies by jurisdiction and is subject to
                change.
              </p>
              <p className="mt-2">
                Users are advised to be aware of the risks associated with
                digital content sharing and data management, and to use the
                platform at their own risk. The platform is not liable for any
                direct, indirect, incidental, consequential, or punitive damages
                arising out of your access to or use of the service.
              </p>
              <p className="mt-2">
                In summary, the Content Creator project is a fictional
                demonstration intended for educational and experimental purposes
                only. iExec disclaims all responsibility and does not endorse or
                support any real-world application or implementation based on
                the concepts presented within this context.
              </p>
              <p className="mt-2">
                Please note that this Disclaimer is subject to changes and
                updates and it is the responsibility of the users to stay
                informed about any modifications.
              </p>
              <p className="mt-2">
                This Disclaimer does not constitute legal opinion or analysis
                and should not be relied upon as such. Individuals and entities
                should seek independent legal counsel to understand the legal
                status and regulatory framework applicable in their respective
                jurisdictions.
              </p>
              <p className="mt-2">
                The content provided is not exhaustive and may not cover all
                relevant legal considerations. No representation or warranty,
                express or implied, is made regarding the accuracy,
                completeness, or reliability of the information provided.
              </p>
              <p className="mt-2">
                Users are solely responsible for assessing the legal
                implications of their actions and should exercise caution and
                diligence in their decision-making process. Any reliance on the
                information provided herein is at the user's own risk.
              </p>
              <p className="mt-2">
                This disclaimer shall be governed by and construed in accordance
                with the laws of France, without regard to its conflict of law
                principles.
              </p>
              <p className="mt-2">
                By using the Product, you hereby acknowledge and agree to the
                terms of this Disclaimer.
              </p>
              <p className="mt-2">
                Our Products may contain links to third-party websites,
                applications, or content. We do not endorse, control, or assume
                responsibility for any third-party content accessed through our
                Products. Your interactions with third-party content are at your
                own risk, and we encourage you to review the terms of use and
                privacy policies of any third-party websites or services.
              </p>
            </div>
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
                  href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getProtectedDataInCollections.html"
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
