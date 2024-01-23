import { FileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { CheckCircle, Loader, UploadCloud } from 'react-feather';
import CreatorLeftNav from '../components/CreatorLeftNav/CreatorLeftNav.tsx';
import { Button } from '../components/ui/button.tsx';

export const Route = new FileRoute('/create-new').createRoute({
  component: CreateNew,
});

function CreateNew() {
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const [isLoading, setLoading] = useState(false);
  const [uploadEvents, setUploadEvents] = useState<string[]>([]);
  const [isDone, setDone] = useState(false);

  const [isForRent, setForRent] = useState(false);

  const [pricingOptions, setPricingOptions] = useState({
    isFree: false,
    isForRent: false,
    isForSell: false,
  });

  function onFileDrop(event: Event) {
    setFileName(event.target.files?.[0].name);
    setFile(event.target.files?.[0]);
  }

  async function onSubmitFileForm(event: SubmitEvent) {
    event.preventDefault();
  }

  return (
    <div className="flex gap-x-8">
      <CreatorLeftNav />
      <div className="w-full">
        <form
          noValidate
          className="mb-28 flex w-full flex-col"
          onSubmit={onSubmitFileForm}
        >
          <label className="flex w-full max-w-[550px] items-center justify-center hover:cursor-pointer">
            <input type="file" className="hidden" onChange={onFileDrop} />
            <div className="relative flex min-h-[300px] flex-1 flex-col items-center justify-center rounded-md border text-xl">
              <UploadCloud />
              <span className="mt-2">Upload file</span>
              <span className="mt-1 text-xs">pdf, jpg, mov ..</span>
              {fileName && (
                <div className="absolute bottom-10 flex items-center gap-x-1.5">
                  <CheckCircle size="16" className="text-success-foreground" />
                  <span className="text-sm">{fileName}</span>
                </div>
              )}
            </div>
          </label>

          <div className="mt-6">
            <label className="block">Choose a category:</label>
            <select defaultValue="1" className="w-36">
              <option value="1">Image</option>
              <option value="2">Music</option>
              <option value="3">Video</option>
            </select>
          </div>

          <div className="mt-6">
            <div>Choose a monetization for your content:</div>
            <label className="mt-2 block">
              <input
                type="radio"
                name="monetizaion"
                className="mr-2"
                onChange={() => {
                  setPricingOptions({
                    isFree: true,
                    isForRent: false,
                    isForSell: false,
                  });
                }}
              />
              Free vizualisation
            </label>
            <label className="mt-2 block">
              <input
                type="radio"
                name="monetizaion"
                className="mr-2"
                onChange={() => {
                  setPricingOptions({
                    isFree: false,
                    isForRent: true,
                    isForSell: false,
                  });
                }}
              />
              Rent content
            </label>
            {pricingOptions.isForRent && (
              <div className="ml-6">
                <div>
                  <label>
                    <input type="checkbox" />
                    Price to watch:
                    <input type="text" />
                    Available period:
                    <input type="text" placeholder="30 days" />
                  </label>
                </div>
                <div>
                  <label>
                    <input type="checkbox" />
                    Include in subscription
                  </label>
                </div>
              </div>
            )}
            <label className="mt-2 block">
              <input
                type="radio"
                name="monetizaion"
                className="mr-2"
                onChange={() => {
                  setPricingOptions({
                    isFree: false,
                    isForRent: false,
                    isForSell: true,
                  });
                }}
              />
              Sell content
              <div className="ml-6 text-sm">
                <i>You transfer ownership of your content to the buyer</i>
              </div>
            </label>
          </div>

          <code className="mt-3">
            {JSON.stringify(pricingOptions, null, 2)}
          </code>

          <div className="mt-6">
            <Button type="submit" disabled={isLoading} className="pl-4">
              {isLoading && <Loader size="16" className="animate-spin-slow" />}
              <span className="pl-2">Continue</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
