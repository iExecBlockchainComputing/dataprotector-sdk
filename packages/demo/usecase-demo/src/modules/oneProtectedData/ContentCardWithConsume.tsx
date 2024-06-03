import {
  WorkflowError,
  type ConsumeProtectedDataStatuses,
} from '@iexec/dataprotector';
// import { useRollbar } from '@rollbar/react';
import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle, Lock } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx';
import { Button } from '@/components/ui/button.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import styles from '@/modules/home/latestContent/OneContentCard.module.css';
import { ImageZoom } from '@/modules/oneProtectedData/ImageZoom.tsx';
import { useContentStore } from '@/stores/content.store.ts';
import { isImage, isVideo } from '@/utils/fileTypes.ts';
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import {
  getCompletedTaskId,
  saveCompletedTaskId,
} from '@/utils/localStorageContentMap.ts';
import { cn } from '@/utils/style.utils.ts';

export function ContentCardWithConsume({
  protectedDataAddress,
  protectedDataName,
  isOwner,
  hasAccessToContent,
}: {
  protectedDataAddress: string;
  protectedDataName: string;
  isOwner: boolean;
  hasAccessToContent: boolean;
}) {
  const [isReady, setReady] = useState(false);
  const [contentAsObjectURL, setContentAsObjectURL] = useState<string>('');
  const [isImageVisible, setImageVisible] = useState(false);
  const [statusMessages, setStatusMessages] = useState<Record<string, boolean>>(
    {}
  );

  const { content, addContentToCache } = useContentStore();
  // const rollbar = useRollbar();

  useEffect(() => {
    setImageVisible(false);
    if (content[protectedDataAddress]) {
      showContent(content[protectedDataAddress]);
    }
    setReady(true);
  }, []);

  const cardVisualBg = getCardVisualNumber({
    address: protectedDataAddress,
  });

  const consumeContentMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();

      if (content[protectedDataAddress]) {
        showContent(content[protectedDataAddress]);
        return;
      }

      const completedTaskId = getCompletedTaskId({
        protectedDataAddress,
      });
      if (completedTaskId) {
        try {
          const { result } =
            await dataProtectorSharing.getResultFromCompletedTask({
              taskId: completedTaskId,
              path: 'content',
            });
          const fileAsBlob = new Blob([result]);
          const fileAsObjectURL = URL.createObjectURL(fileAsBlob);
          showContent(fileAsObjectURL);
          return;
        } catch (err) {
          console.error(
            `Failed to get result from existing completed task: ${completedTaskId}`,
            err
          );
          return;
        }
      }

      // --- New consume content
      const { taskId, result } =
        await dataProtectorSharing.consumeProtectedData({
          app: import.meta.env.VITE_PROTECTED_DATA_DELIVERY_DAPP_ADDRESS,
          protectedData: protectedDataAddress,
          workerpool: import.meta.env.VITE_WORKERPOOL_ADDRESS,
          onStatusUpdate: (status) => {
            handleConsumeStatuses(status);
          },
        });

      saveCompletedTaskId({ protectedDataAddress, completedTaskId: taskId });

      const fileAsBlob = new Blob([result]);
      const fileAsObjectURL = URL.createObjectURL(fileAsBlob);
      showContent(fileAsObjectURL);
    },
    onError: (err) => {
      console.error('[consumeProtectedData] ERROR', err);
      if (err instanceof WorkflowError) {
        console.error(err.originalError?.message);
        // rollbar.error(
        //   `[consumeProtectedData] ${err.originalError?.message}`,
        //   err
        // );
        return;
      }
      // rollbar.error('[consumeProtectedData] ERROR', err);
    },
  });

  function handleConsumeStatuses(status: {
    title: ConsumeProtectedDataStatuses;
    isDone: boolean;
    payload?: Record<string, any>;
  }) {
    if (status.title === 'FETCH_WORKERPOOL_ORDERBOOK' && !status.isDone) {
      setStatusMessages({
        'Check for iExec workers availability': false,
      });
    }
    if (status.title === 'PUSH_ENCRYPTION_KEY' && !status.isDone) {
      setStatusMessages((currentMessages) => ({
        ...currentMessages,
        'Check for iExec workers availability': true,
        'Push encryption key to iExec Secret Management Service': false,
      }));
    }
    if (status.title === 'CONSUME_ORDER_REQUESTED' && !status.isDone) {
      setStatusMessages((currentMessages) => ({
        ...currentMessages,
        'Push encryption key to iExec Secret Management Service': true,
        'Request to access this content': false,
      }));
    }
    if (
      status.title === 'CONSUME_TASK' &&
      !status.isDone &&
      status.payload?.taskId
    ) {
      saveCompletedTaskId({
        protectedDataAddress,
        completedTaskId: status.payload.taskId,
      });
      setStatusMessages((currentMessages) => ({
        ...currentMessages,
        'Request to access this content': true,
        'Content now being handled by iExec dApp': false,
      }));
    }
    if (status.title === 'CONSUME_TASK' && status.isDone) {
      setStatusMessages((currentMessages) => ({
        ...currentMessages,
        'Content now being handled by iExec dApp': true,
      }));
      setStatusMessages((currentMessages) => ({
        ...currentMessages,
        'Download result from IPFS': false,
      }));
    }
    if (status.title === 'CONSUME_RESULT_DOWNLOAD' && status.isDone) {
      setStatusMessages((currentMessages) => ({
        ...currentMessages,
        'Download result from IPFS': true,
        'Decrypt result': false,
      }));
    }
    if (status.title === 'CONSUME_RESULT_DECRYPT' && status.isDone) {
      setStatusMessages((currentMessages) => ({
        ...currentMessages,
        'Decrypt result': true,
      }));
    }
  }

  function showContent(objectURL: string) {
    setContentAsObjectURL(objectURL);
    setTimeout(() => {
      setImageVisible(true);
    }, 200);
    addContentToCache(protectedDataAddress, objectURL);
  }

  return (
    <>
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-grey-800">
        {contentAsObjectURL ? (
          <div
            className={cn(
              'w-full',
              isImageVisible
                ? 'opacity-100 transition-opacity duration-700 ease-in'
                : 'opacity-0'
            )}
          >
            {isVideo(protectedDataName) && (
              <video controls muted className="w-full">
                <source src={contentAsObjectURL} type="video/mp4" />
              </video>
            )}
            {isImage(protectedDataName) && (
              <ImageZoom
                src={contentAsObjectURL}
                alt="Visible content"
                className="w-full"
              />
            )}
            {/* TODO Propose to download file instead */}
          </div>
        ) : (
          isReady && (
            <>
              <div className={clsx(styles[cardVisualBg], 'h-full w-full')}>
                &nbsp;
              </div>
              {!isOwner && !hasAccessToContent ? (
                <Lock
                  size="30"
                  className="absolute text-grey-50 opacity-100 group-hover:opacity-0"
                />
              ) : (
                <Button
                  className="absolute"
                  isLoading={consumeContentMutation.isPending}
                  onClick={() => consumeContentMutation.mutate()}
                >
                  View or download
                </Button>
              )}
            </>
          )
        )}
      </div>

      {Object.keys(statusMessages).length > 0 && (
        <div className="mb-6 ml-1.5 mt-6">
          {Object.entries(statusMessages).map(([message, isDone]) => (
            <div
              key={message}
              className={`ml-2 mt-2 flex items-center gap-x-2 px-2 text-left ${isDone ? 'text-grey-500' : 'text-white'}`}
            >
              {isDone ? (
                <CheckCircle size="20" className="text-primary" />
              ) : consumeContentMutation.isError ? (
                <AlertOctagon className="size-5" />
              ) : (
                <LoadingSpinner className="size-5 text-primary" />
              )}
              {message}
            </div>
          ))}
        </div>
      )}

      {consumeContentMutation.isError && (
        <Alert variant="error" className="mt-4 overflow-auto">
          <p>Oops, something went wrong.</p>
          <p className="mt-1 text-sm">
            {consumeContentMutation.error.toString()}
            <br />
            {
              (consumeContentMutation.error as WorkflowError).originalError
                ?.message
            }
          </p>
        </Alert>
      )}
    </>
  );
}
