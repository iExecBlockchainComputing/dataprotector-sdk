import { useQueryClient } from '@tanstack/react-query';
import {
  type ChangeEventHandler,
  createRef,
  type DragEventHandler,
  FormEventHandler,
  useRef,
  useState,
} from 'react';
import { clsx } from 'clsx';
import { create } from 'zustand';
import { CheckCircle, Loader, Plus, UploadCloud } from 'react-feather';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { createProtectedData } from '../../modules/createNew/createProtectedData.ts';
import { getOrCreateCollection } from '../../modules/createNew/getOrCreateCollection.ts';
import { Alert } from '../../components/Alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { useToast } from '../../components/ui/use-toast.ts';
import { MonetizationChoice } from '../../modules/createNew/MonetizationChoice.tsx';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';
import './CreateNewContent.css';

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
  const [addToCollectionError, setAddToCollectionError] = useState();
  const [addToCollectionSuccess, setAddToCollectionSuccess] = useState(false);

  const { statuses, addOrUpdateStatusToStore, resetStatuses } =
    useStatusStore();

  const dropZone = useRef(null);

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

    setLoading(true);
    await handleFile();
    setLoading(false);
  };

  async function handleFile() {
    resetUploadForm();

    // Create protected data and add it to collection
    try {
      // 1- Create protected data
      console.log('1');
      const { address } = await createProtectedData({
        file: file!,
        onStatusUpdate: addOrUpdateStatusToStore,
      });

      console.log('2');
      // 2- Get or create collection
      const collectionTokenId = await getOrCreateCollection({
        onStatusUpdate: addOrUpdateStatusToStore,
      });

      console.log('3');
      // 3- Add to collection
      const dataProtector = await getDataProtectorClient();
      await dataProtector.dataProtectorSharing.addToCollection({
        protectedDataAddress: address,
        collectionTokenId,
        onStatusUpdate: addOrUpdateStatusToStore,
      });

      setAddToCollectionSuccess(true);

      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    } catch (err: any) {
      console.log('[addToCollection] Error', err, err.data && err.data);
      addOrUpdateStatusToStore({
        title: 'addToCollection failed',
        isError: true,
      });
      setAddToCollectionError(err?.message);

      // TODO: Handle when fails but protected data well created, save protected data address to retry?
    }

    // Set pricing options
  }

  function resetUploadForm() {
    resetStatuses();
    setAddToCollectionError(undefined);
    setFile(undefined);
  }

  return (
    <div className="flex gap-x-8">
      <div className="w-full">
        <form
          noValidate
          className="mb-28 flex w-full flex-col items-center"
          onSubmit={onSubmitFileForm}
        >
          <label className="flex w-full max-w-[550px] items-center justify-center hover:cursor-pointer">
            <input type="file" className="hidden" onChange={onFileSelected} />
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
                size="65"
                strokeWidth="1px"
                className="pointer-events-none"
              />
              <span className="pointer-events-none mt-2 text-lg">
                Upload file
              </span>
              <span className="pointer-events-none mt-8 text-xs">
                Drag and drop a file here
              </span>
              <span className="pointer-events-none mt-3 text-xs text-grey-500">
                JPG, PNG or PDF, file size no more than 500Ko
              </span>
              {fileName && (
                <div className="pointer-events-none absolute bottom-10 flex items-center gap-x-1.5">
                  <CheckCircle size="16" className="text-success-foreground" />
                  <span className="text-sm">{fileName}</span>
                </div>
              )}
            </div>
          </label>

          {/*<div className="mt-6">*/}
          {/*  <label className="block">Choose a category:</label>*/}
          {/*  <select*/}
          {/*    name="category"*/}
          {/*    defaultValue="image"*/}
          {/*    className="w-56 text-grey-900"*/}
          {/*  >*/}
          {/*    <option value="image">Image</option>*/}
          {/*    <option value="music">Music</option>*/}
          {/*    <option value="video">Video</option>*/}
          {/*  </select>*/}
          {/*</div>*/}

          {/*<MonetizationChoice />*/}

          <div className="mt-6 text-center">
            <Button type="submit" disabled={isLoading} className="pl-4">
              {isLoading && <Loader size="16" className="animate-spin-slow" />}
              <span className="pl-2">Continue</span>
            </Button>
            <div className="mt-2 text-xs">Expect it to take ~1min</div>
          </div>

          <div className="ml-1 mt-3 flex flex-col gap-y-0.5 text-sm">
            <TransitionGroup className="status-list">
              {Object.entries(statuses).map(
                ([title, { isDone, isError, payload }]) => {
                  const nodeRef = createRef(null);
                  return (
                    <CSSTransition
                      key={title}
                      nodeRef={nodeRef}
                      timeout={500}
                      classNames="status-item"
                    >
                      <div ref={nodeRef}>
                        <div>
                          {isError ? '❌' : isDone ? '✅' : '⏳'}&nbsp;&nbsp;
                          {title}
                        </div>
                        {payload && (
                          <div>
                            {'{ '}
                            {Object.entries(payload).map(([key, value]) => (
                              <span key={key}>
                                {key}: {value},{' '}
                              </span>
                            ))}
                            {' }'}
                          </div>
                        )}
                      </div>
                    </CSSTransition>
                  );
                }
              )}
            </TransitionGroup>
          </div>

          {addToCollectionError && (
            <Alert variant="error" className="mt-8 max-w-[580px]">
              <p>Oops, something went wrong.</p>
              <p className="mt-1 max-w-[500px] overflow-auto text-sm text-orange-300">
                {addToCollectionError}
              </p>
            </Alert>
          )}

          {addToCollectionSuccess && (
            <>
              <Alert variant="success" className="mt-8 max-w-[580px]">
                <p>All good!</p>
              </Alert>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => resetUploadForm()}
              >
                Reset
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
