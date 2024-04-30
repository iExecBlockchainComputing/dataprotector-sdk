import { WorkflowError } from '@iexec/dataprotector';
import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { CheckCircle, Lock } from 'react-feather';
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
          const { contentAsObjectURL } =
            await dataProtectorSharing.getResultFromCompletedTask({
              taskId: completedTaskId,
            });
          showContent(contentAsObjectURL);
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
      const { taskId, contentAsObjectURL } =
        await dataProtectorSharing.consumeProtectedData({
          app: '0x85795d8eb2b5d39a6e8dfb7890924191b3d1ccf6',
          protectedData: protectedDataAddress,
          workerpool: 'prod-stagingv8.main.pools.iexec.eth',
          onStatusUpdate: (status) => {
            if (status.title === 'CONSUME_ORDER_REQUESTED' && !status.isDone) {
              setStatusMessages({
                'Consuming order is requested, please wait...': false,
              });
            }
            if (status.title === 'CONSUME_TASK_ACTIVE' && status.isDone) {
              setStatusMessages({
                'Consuming order is requested': true,
              });
              setStatusMessages((currentMessages) => ({
                ...currentMessages,
                'Task consumption is active.': false,
              }));
            }
            if (status.title === 'CONSUME_TASK_ERROR' && status.isDone) {
              setStatusMessages((currentMessages) => ({
                ...currentMessages,
                'An error occurred while consuming the task.': true,
              }));
            }
            if (
              status.title === 'CONSUME_TASK_COMPLETED' &&
              status.isDone &&
              status.payload?.taskId
            ) {
              saveCompletedTaskId({
                protectedDataAddress,
                completedTaskId: status.payload.taskId,
              });
              setStatusMessages(() => ({
                'Consuming order is requested': true,
              }));
              setStatusMessages((currentMessages) => ({
                ...currentMessages,
                'Task consumption is active.': true,
                'Task consumption is completed successfully.': true,
              }));
            }
            if (status.title === 'CONSUME_RESULT_DOWNLOAD' && status.isDone) {
              setStatusMessages((currentMessages) => ({
                ...currentMessages,
                'Result download is completed successfully.': true,
              }));
            }
            if (status.title === 'CONSUME_RESULT_DECRYPT' && status.isDone) {
              setStatusMessages((currentMessages) => ({
                ...currentMessages,
                'Result decryption is completed successfully': true,
              }));
            }
            if (status.title === 'CONSUME_RESULT_COMPLETE' && status.isDone) {
              setStatusMessages((currentMessages) => ({
                ...currentMessages,
                'Result consumption is completed successfully.': true,
              }));
            }
          },
        });

      saveCompletedTaskId({ protectedDataAddress, completedTaskId: taskId });

      showContent(contentAsObjectURL);
    },
    onError: (error) => {
      console.error('[consumeProtectedData] ERROR', error);
    },
  });

  function showContent(objectURL: string) {
    setContentAsObjectURL(objectURL);
    setTimeout(() => {
      setImageVisible(true);
    }, 200);
    addContentToCache(protectedDataAddress, objectURL);
  }

  return (
    <>
      <div className="relative flex h-[380px] items-center justify-center overflow-hidden rounded-3xl border border-grey-800">
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
        <div className="mt-6">
          {Object.entries(statusMessages).map(([message, isDone]) => (
            <div
              key={message}
              className={`ml-2 mt-2 flex items-center gap-x-2 px-2 text-left ${isDone ? 'text-grey-500' : 'text-white'}`}
            >
              {isDone ? (
                <CheckCircle size="20" className="text-primary" />
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
          <p>Oops, something went wrong while downloading your content.</p>
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
