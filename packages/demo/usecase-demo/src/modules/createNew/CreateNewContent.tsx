import { WorkflowError } from '@iexec/dataprotector';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  type ChangeEventHandler,
  type DragEventHandler,
  FormEventHandler,
  useRef,
  useState,
} from 'react';
import { ArrowRight, CheckCircle, UploadCloud, XCircle } from 'react-feather';
import { create } from 'zustand';
import { Alert } from '@/components/Alert.tsx';
import { ClickToExpand } from '@/components/ClickToExpand';
import { DocLink } from '@/components/DocLink';
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { useRollbarMaybe } from '@/hooks/useRollbarMaybe.ts';
import { createProtectedData } from '@/modules/createNew/createProtectedData.ts';
import { getOrCreateCollection } from '@/modules/createNew/getOrCreateCollection.ts';
import './CreateNewContent.css';

// const FILE_SIZE_LIMIT_IN_KB = 500;
const FILE_SIZE_LIMIT_IN_KB = 10_000;

type OneStatus = {
  title: string;
  isDone?: boolean;
  isError?: boolean;
  payload?: Record<string, string>;
};

type StatusState = {
  statuses: Record<
    string,
    { isDone?: boolean; isError?: boolean; payload?: Record<string, string> }
  >;
  addOrUpdateStatusToStore: (status: OneStatus) => void;
  resetStatuses: () => void;
};

const useStatusStore = create<StatusState>((set) => ({
  statuses: {},
  addOrUpdateStatusToStore: (status) =>
    set((state) => {
      const updatedStatuses = { ...state.statuses };
      updatedStatuses[status.title] = {
        isDone: status.isDone,
        isError: status.isError || false,
        payload: status.payload,
      };
      return { statuses: updatedStatuses };
    }),
  resetStatuses: () => set({ statuses: {} }),
}));

export function CreateNewContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File>();
  const [fileName, setFileName] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [createdProtectedDataAddress, setCreatedProtectedDataAddress] =
    useState<string>();
  const [addToCollectionError, setAddToCollectionError] = useState();
  const [addToCollectionSuccess, setAddToCollectionSuccess] = useState(false);

  const inputTypeFileRef = useRef<HTMLInputElement>(null);

  const { statuses, addOrUpdateStatusToStore, resetStatuses } =
    useStatusStore();

  const dropZone = useRef(null);

  const rollbar = useRollbarMaybe();

  const onFileSelected: ChangeEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault();
    const selectedFile = event?.target?.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFileName(selectedFile.name);
    setFile(selectedFile);
  };

  const handleDrag: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const onFileDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    // https://caniuse.com/?search=event.dataTransfer
    // https://caniuse.com/?search=dataTransfer.items
    // Should be fine for all desktop browsers
    if (!event?.dataTransfer?.items) {
      console.warn('No event.dataTransfer or no items?');
      return;
    }

    const droppedFile = event?.dataTransfer?.files?.[0];

    setFileName(droppedFile.name);
    setFile(droppedFile);
  };

  const onSubmitFileForm: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!file) {
      toast({
        variant: 'danger',
        title: 'Please upload a file.',
      });
      return;
    }

    const fileSizeInKb = file.size / 1024;
    if (fileSizeInKb > FILE_SIZE_LIMIT_IN_KB) {
      toast({
        variant: 'danger',
        title: 'File is too big',
        description: `Selected file is ${Math.round(fileSizeInKb / 1000)} Mb, should be less than ${FILE_SIZE_LIMIT_IN_KB / 1000} Mb.`,
      });
      return;
    }

    setLoading(true);
    await handleFile();
    setLoading(false);
  };

  async function handleFile() {
    cleanErrors();

    // Create protected data and add it to collection
    try {
      // 1- Create protected data
      const { address } = await createProtectedData({
        file: file!,
        onStatusUpdate: addOrUpdateStatusToStore,
      });
      setCreatedProtectedDataAddress(address);

      // 2- Get or create collection
      const collectionId = await getOrCreateCollection({
        onStatusUpdate: addOrUpdateStatusToStore,
      });

      // 3- Add to collection
      const dataProtector = await getDataProtectorClient();
      await dataProtector.dataProtectorSharing.addToCollection({
        protectedData: address,
        collectionId,
        addOnlyAppWhitelist: import.meta.env
          .VITE_PROTECTED_DATA_DELIVERY_WHITELIST_ADDRESS,
        onStatusUpdate: (status) => {
          if (status.title === 'APPROVE_COLLECTION_CONTRACT') {
            const title =
              'Approve DataProtector Sharing smart-contract to manage this protected data';
            if (!status.isDone) {
              addOrUpdateStatusToStore({ title, isDone: false });
            } else {
              addOrUpdateStatusToStore({ title, isDone: true });
            }
          } else if (status.title === 'ADD_PROTECTED_DATA_TO_COLLECTION') {
            const title = 'Add protected data to your collection';
            if (!status.isDone) {
              addOrUpdateStatusToStore({ title, isDone: false });
            } else {
              addOrUpdateStatusToStore({ title, isDone: true });
            }
          }
        },
      });

      setAddToCollectionSuccess(true);

      queryClient.invalidateQueries({ queryKey: ['myCollections'] });

      resetUploadForm();
    } catch (err: any) {
      resetStatuses();
      setAddToCollectionError(err?.message);

      if (err instanceof WorkflowError) {
        console.error(`[Upload new content] ERROR ${err.cause}`, err);
        rollbar.error(`[Upload new content] ERROR ${err.cause}`, err);
        return;
      }
      console.error('[Upload new content] ERROR', err, err.data && err.data);
      rollbar.error(`[Upload new content] ERROR ${err.message}`, err);

      // TODO: Handle when fails but protected data well created, save protected data address to retry?
    }
  }

  function cleanErrors() {
    resetStatuses();
    setAddToCollectionError(undefined);
  }

  function resetUploadForm() {
    setFile(undefined);
    setFileName('');
    inputTypeFileRef.current?.value && (inputTypeFileRef.current.value = '');
  }

  return (
    <div className="flex gap-x-8">
      <div className="w-full">
        <form
          noValidate
          className="flex w-full flex-col items-center"
          onSubmit={onSubmitFileForm}
        >
          <label className="flex w-full max-w-[550px] items-center justify-center hover:cursor-pointer">
            <input
              ref={inputTypeFileRef}
              type="file"
              className="hidden"
              onChange={onFileSelected}
            />
            <div
              ref={dropZone}
              className={clsx(
                dragActive && 'ring ring-primary',
                'relative flex min-h-[300px] flex-1 flex-col items-center justify-center rounded-3xl border border-grey-700 bg-grey-800 text-xl text-white'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={onFileDrop}
            >
              <UploadCloud
                size="58"
                strokeWidth="1px"
                className="pointer-events-none"
              />
              <span className="pointer-events-none mt-2 text-lg">
                Upload file
              </span>
              {!fileName && (
                <>
                  <span className="pointer-events-none mt-8 text-xs">
                    Drag and drop a file here
                  </span>
                  <span className="pointer-events-none mt-3 text-xs text-grey-500">
                    JPG, PNG or PDF, file size no more than{' '}
                    {FILE_SIZE_LIMIT_IN_KB / 1000} Mb
                  </span>
                </>
              )}
              {fileName && (
                <>
                  <div className="mt-8 flex w-11/12 items-center justify-center gap-x-1.5">
                    <span className="text-sm">{fileName}</span>
                    {!isLoading && (
                      <button
                        type="button"
                        className="p-1 text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          resetUploadForm();
                        }}
                      >
                        <XCircle size="18" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </label>
          <ClickToExpand
            className="mt-10 w-full max-w-[550px]"
            title="Limits of demo"
          >
            Your protected data will have the public name of your downloaded
            file.
          </ClickToExpand>
          <DocLink className="mt-6 w-full max-w-[550px]">
            dataprotector-sdk / Method called:{' '}
            <a
              href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/collection/createCollection.html"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              createCollection()
            </a>
          </DocLink>
          <DocLink className="mt-6 w-full max-w-[550px]">
            dataprotector-sdk / Method called:{' '}
            <a
              href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorCore/protectData.html"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              <br />
              const fileAsArrayBuffer = await createArrayBufferFromFile(file);
              <br />
              <br />
              protectData({'{'}
              <br />
              &nbsp;&nbsp;data: {'{'} file: fileAsArrayBuffer {'}'},
              <br />
              &nbsp;&nbsp;name: file.name,,
              <br />
              {'}'});
            </a>
          </DocLink>
          <DocLink className="mt-6 w-full max-w-[550px]">
            dataprotector-sdk / Method called:{' '}
            <a
              href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/collection/addToCollection.html"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              <br />
              addToCollection({'{'}
              <br />
              &nbsp;&nbsp;protectedData: "0x123abc...",
              <br />
              &nbsp;&nbsp;collectionId: 12,
              <br />
              &nbsp;&nbsp;addOnlyAppWhitelist: "0x541abc...",
              <br />
              {'}'});
            </a>
          </DocLink>
          {!addToCollectionSuccess && (
            <div className="mt-6 text-center">
              <Button type="submit" isLoading={isLoading}>
                Continue
              </Button>
              <div className="mt-2 text-xs">Expect it to take total ~1min</div>
            </div>
          )}

          <div className="ml-1 mt-3 flex w-full max-w-[550px] flex-col gap-y-0.5 text-sm">
            {Object.keys(statuses).length > 0 && (
              <div className="mt-6">
                {Object.entries(statuses).map(
                  ([message, { isDone, isError }]) => (
                    <div
                      key={message}
                      className={`ml-2 mt-2 flex items-center gap-x-2 px-2 text-left ${isDone ? 'text-grey-500' : isError ? 'text-red-500' : 'text-white'}`}
                    >
                      {isError ? (
                        <XCircle size="20" />
                      ) : isDone ? (
                        <CheckCircle size="20" className="text-primary" />
                      ) : (
                        <LoadingSpinner className="size-5 text-primary" />
                      )}
                      {message}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {addToCollectionError && (
            <Alert variant="error" className="mt-8 max-w-[580px]">
              <p>Oops, something went wrong.</p>
              <p className="mt-1 max-w-[500px] overflow-auto text-sm">
                {addToCollectionError}
              </p>
            </Alert>
          )}

          {addToCollectionSuccess && (
            <>
              <Alert variant="success" className="mt-8 max-w-[580px]">
                <p>Your protected data has been created.</p>
              </Alert>

              <Button asChild className="mt-6">
                <Link
                  to={'/my-content/$protectedDataAddress/monetization'}
                  params={{
                    protectedDataAddress: createdProtectedDataAddress!,
                  }}
                >
                  Choose monetization
                  <ArrowRight size="18" className="-mr-0.5 ml-1.5" />
                </Link>
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
