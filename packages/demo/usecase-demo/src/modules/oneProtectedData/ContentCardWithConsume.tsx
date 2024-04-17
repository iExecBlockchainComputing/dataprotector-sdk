import { WorkflowError } from '@iexec/dataprotector';
import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Lock } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { Button } from '@/components/ui/button.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import styles from '@/modules/home/contentOfTheWeek/OneContentCard.module.css';
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
        }
      }

      // --- New consume content
      const { taskId, contentAsObjectURL } =
        await dataProtectorSharing.consumeProtectedData({
          app: '0x82e41e1b594ccf69b0cfda25637eddc4e6d4e0fc',
          protectedData: protectedDataAddress,
          workerpool: 'prod-stagingv8.main.pools.iexec.eth',
          onStatusUpdate: (status) => {
            console.log('[onStatusUpdate]', status);
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

      {consumeContentMutation.isError && (
        <Alert variant="error" className="mt-4 overflow-auto">
          <p>Oops, something went wrong while downloading your content.</p>
          <p className="mt-1 text-sm text-orange-300">
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
