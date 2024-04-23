import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from '@/components/Alert.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { toast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';
import { pluralize } from '@/utils/pluralize.ts';
import { rlcToNrlc } from '@/utils/rlcToNrlc.ts';
import { daysToSeconds, secondsToDays } from '@/utils/secondsToDays.ts';

export function SubscriptionParamsForm({
  collection,
}: {
  collection: CollectionWithProtectedDatas;
}) {
  const queryClient = useQueryClient();

  const hasSetSubscriptionParams = Boolean(collection.subscriptionParams);

  const [isUpdateMode, setUpdateMode] = useState(false);

  const [priceInRLC, setPriceInRLC] = useState<string>(
    collection.subscriptionParams
      ? String(nrlcToRlc(collection.subscriptionParams.price))
      : ''
  );
  const [durationInDays, setDurationInDays] = useState<string>(
    collection.subscriptionParams
      ? String(secondsToDays(collection.subscriptionParams.duration))
      : ''
  );

  const changeSubscriptionParamsMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      await dataProtectorSharing.setSubscriptionParams({
        collectionId: Number(collection.id),
        price: rlcToNrlc(Number(priceInRLC)),
        duration: daysToSeconds(Number(durationInDays)),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  const onSubmitSubscriptionParams = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!durationInDays.trim() || !priceInRLC.trim()) {
      toast({
        variant: 'danger',
        title: 'Please enter your price and available period.',
      });
      return;
    }

    if (isNaN(Number(durationInDays)) || isNaN(Number(priceInRLC))) {
      return;
    }

    await changeSubscriptionParamsMutation.mutateAsync();

    toast({
      variant: 'success',
      title: 'Subscription updated',
    });

    setUpdateMode(false);
  };

  return (
    <>
      {hasSetSubscriptionParams && !isUpdateMode && (
        <div className="flex items-center gap-x-10">
          <div className="flex flex-1 gap-x-10">
            <div>Price for watch</div>
            <div className="text-primary">{priceInRLC} RLC</div>
            <div>, available period</div>
            <div className="text-primary">
              {pluralize(durationInDays, 'day')}
            </div>
          </div>
          <Button onClick={() => setUpdateMode(true)}>Update</Button>
        </div>
      )}

      {(!hasSetSubscriptionParams || isUpdateMode) && (
        <>
          {isUpdateMode && (
            <div className="-mt-6 mb-6">
              (This will only apply to <strong>new</strong> subscribers)
            </div>
          )}
          <form
            noValidate
            onSubmit={onSubmitSubscriptionParams}
            className="flex items-center"
          >
            <div className="flex-1 @container">
              <div className="block @xl:inline-block">
                <label htmlFor="subscription" className="mr-3">
                  Price for watch
                </label>
                <Input
                  type="number"
                  value={priceInRLC}
                  placeholder="Price"
                  appendText="RLC"
                  className="inline-block w-36 border-grey-500"
                  onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPriceInRLC(event.target.value)
                  }
                />
              </div>
              <div className="mt-3 block @xl:mt-0 @xl:inline-block">
                <label htmlFor="subscription" className="mr-3 @xl:ml-4">
                  <span className="inline @xl:hidden">Available period</span>
                  <span className="hidden @xl:inline">, available period</span>
                </label>
                <Input
                  type="number"
                  value={durationInDays}
                  placeholder="Duration"
                  appendText="days"
                  className="inline-block w-36 border-grey-500"
                  onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setDurationInDays(event.target.value)
                  }
                />
              </div>
            </div>

            {isUpdateMode && (
              <Button variant="text" onClick={() => setUpdateMode(false)}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              isLoading={changeSubscriptionParamsMutation.isPending}
              className="ml-4"
            >
              Confirm
            </Button>
          </form>
        </>
      )}

      {changeSubscriptionParamsMutation.isError && (
        <Alert variant="error" className="mt-4">
          <p>
            Oops, something went wrong while saving your subscription params.
          </p>
          <p className="mt-1 text-sm">
            {changeSubscriptionParamsMutation.error.toString()}
          </p>
        </Alert>
      )}
    </>
  );
}
