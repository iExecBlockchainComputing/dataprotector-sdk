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
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import {
  getCompletedTaskId,
  saveCompletedTaskId,
} from '@/utils/localStorageContentMap.ts';
import { cn } from '@/utils/style.utils.ts';

export function ContentCardWithConsume({
  protectedDataAddress,
  isOwner,
  hasAccessToContent,
}: {
  protectedDataAddress: string;
  isOwner: boolean;
  hasAccessToContent: boolean;
}) {
  const [fileAsBase64, setFileAsBase64] = useState<string>('');
  const [isImageVisible, setImageVisible] = useState(false);

  const { content, addContentToCache } = useContentStore();

  useEffect(() => {
    setImageVisible(false);
    if (content[protectedDataAddress]) {
      showImage(content[protectedDataAddress]);
    }
  }, []);

  const cardVisualBg = getCardVisualNumber({
    address: protectedDataAddress,
  });

  const consumeContentMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();

      if (content[protectedDataAddress]) {
        showImage(content[protectedDataAddress]);
        return;
      }

      const completedTaskId = getCompletedTaskId({
        protectedDataAddress,
      });
      if (completedTaskId) {
        try {
          const { fileAsBase64 } =
            await dataProtectorSharing.getResultFromCompletedTask({
              taskId: completedTaskId,
            });
          showImage(fileAsBase64);
          return;
        } catch (err) {
          console.error(
            `Failed to get result from existing completed task: ${completedTaskId}`,
            err
          );
        }
      }

      // --- New consume content
      const { taskId, fileAsBase64 } =
        await dataProtectorSharing.consumeProtectedData({
          app: '0x82e41e1B594CcF69B0Cfda25637EdDc4E6D4e0fc'.toLowerCase(),
          protectedData: protectedDataAddress,
          workerpool: 'prod-stagingv8.main.pools.iexec.eth',
          onStatusUpdate: (status) => {
            console.log('[onStatusUpdate]', status);
          },
        });

      saveCompletedTaskId({ protectedDataAddress, completedTaskId: taskId });

      showImage(fileAsBase64);
    },
    onError: (error) => {
      console.error('[consumeProtectedData] ERROR', error);
    },
  });

  function showImage(fileAsBase64: string) {
    setFileAsBase64(fileAsBase64);
    setTimeout(() => {
      setImageVisible(true);
    }, 200);
    addContentToCache(protectedDataAddress, fileAsBase64);
  }

  return (
    <>
      <div className="relative flex h-[380px] items-center justify-center overflow-hidden rounded-3xl border border-grey-800">
        {fileAsBase64 ? (
          <div
            className={cn(
              'w-full',
              isImageVisible
                ? 'opacity-100 transition-opacity duration-700 ease-in'
                : 'opacity-0'
            )}
          >
            <ImageZoom
              src={`data:image/jpeg;base64,${fileAsBase64}`}
              alt="Visible content"
              className="w-full"
            />
          </div>
        ) : (
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
