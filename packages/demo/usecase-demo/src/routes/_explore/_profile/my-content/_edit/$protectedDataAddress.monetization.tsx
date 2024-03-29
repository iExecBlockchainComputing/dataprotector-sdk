import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FormEventHandler, useState } from 'react';
import { AlertCircle, File } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';
import { rlcToNrlc } from '@/utils/rlcToNrlc.ts';
import { secondsToDays } from '@/utils/secondsToDays.ts';

export const Route = createFileRoute(
  '/_explore/_profile/my-content/_edit/$protectedDataAddress/monetization'
)({
  component: ChooseMonetization,
});

function ChooseMonetization() {
  const { protectedDataAddress } = Route.useParams();

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [monetizationChoice, setMonetizationChoice] = useState<
    'free' | 'rent' | 'sell'
  >();
  const [isMonetizationAlreadySet, setMonetizationAlreadySet] = useState(false);

  const [rentPriceInRLC, setRentPriceInRLC] = useState('');
  const [rentDurationInDays, setRentDurationInDays] = useState('');
  const [sellPriceInRLC, setSellPriceInRLC] = useState('');

  const {
    isLoading,
    isSuccess,
    data: protectedData,
    isError,
    error,
  } = useQuery({
    queryKey: ['protectedData', protectedDataAddress],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const protectedDatas =
        await dataProtectorSharing.getProtectedDataInCollections({
          protectedDataAddress,
        });
      const protectedData = protectedDatas.protectedDataInCollection[0];
      if (!protectedData) {
        return undefined;
      }

      setMonetizationAlreadySet(
        protectedData.isRentable ||
          protectedData.isIncludedInSubscription ||
          protectedData.isForSale
      );

      if (protectedData.isRentable) {
        // TODO See why it's a string and not a number (BigInt in the graph schema!)
        // if (protectedData.rentalParams?.price === 0) {
        if (Number(protectedData.rentalParams?.price) === 0) {
          setMonetizationChoice('free');
          setRentPriceInRLC('0');
        } else {
          setMonetizationChoice('rent');
          setRentPriceInRLC(
            nrlcToRlc(protectedData.rentalParams?.price.toString())
          );
        }
        setRentDurationInDays(
          secondsToDays(protectedData.rentalParams?.duration)
        );
      }
      if (protectedData.isForSale) {
        setMonetizationChoice('sell');
        setSellPriceInRLC(
          nrlcToRlc(protectedData.saleParams?.price.toString())
        );
      }

      return protectedData;
    },
  });

  const setProtectedDataToRentingMutation = useMutation({
    mutationFn: async ({
      priceInRLC,
      durationInDays,
    }: {
      priceInRLC: number;
      durationInDays: number;
    }) => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataToRenting({
        protectedDataAddress,
        priceInNRLC: rlcToNrlc(priceInRLC),
        durationInSeconds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['protectedData', protectedDataAddress],
      });

      toast({
        variant: 'success',
        title: 'Monetization set successfully.',
      });

      navigate({
        to: '/my-content/edit/$protectedDataAddress/recap',
        params: {
          protectedDataAddress,
        },
      });
    },
  });

  const setProtectedDataForSaleMutation = useMutation({
    mutationFn: async ({ priceInRLC }: { priceInRLC: number }) => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataForSale({
        protectedDataAddress,
        priceInNRLC: rlcToNrlc(priceInRLC),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['protectedData', protectedDataAddress],
      });

      toast({
        variant: 'success',
        title: 'Monetization set successfully.',
      });

      navigate({
        to: '/my-content/edit/$protectedDataAddress/recap',
        params: {
          protectedDataAddress,
        },
      });
    },
  });

  const onConfirmMonetization: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (!monetizationChoice) {
      toast({
        variant: 'danger',
        title: 'Please select an option.',
      });
      return;
    }

    if (monetizationChoice === 'free') {
      setProtectedDataToRentingMutation.mutate({
        priceInRLC: 0,
        durationInDays: 30,
      });
    }

    if (monetizationChoice === 'rent') {
      // TODO
    }

    if (monetizationChoice === 'sell') {
      if (!sellPriceInRLC) {
        toast({
          variant: 'danger',
          title: 'Please enter your price.',
        });
        return;
      }

      setProtectedDataForSaleMutation.mutate({
        priceInRLC: rlcToNrlc(Number(sellPriceInRLC)),
      });
    }
  };

  const isConfirmLoading =
    setProtectedDataToRentingMutation.isPending ||
    setProtectedDataForSaleMutation.isPending;

  return (
    <>
      {isLoading && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error" className="mt-4">
          <p>Oops, something went wrong while fetching your content.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && protectedData && (
        <div className="rounded-3xl border border-grey-800 px-10 py-10">
          <div className="text-xl font-extrabold">
            Choose a monetization for your content
          </div>
          <div className="mt-2 inline-flex shrink-0 items-center rounded-[30px] bg-grey-800 px-3 py-1.5 text-sm font-medium">
            <File size="16" className="mr-1" />
            {protectedData.name}
          </div>

          <form
            noValidate
            onSubmit={(event) => {
              onConfirmMonetization(event);
            }}
          >
            <RadioGroup
              defaultValue={monetizationChoice}
              disabled={isMonetizationAlreadySet || isConfirmLoading}
              className="mt-10 gap-0"
              onValueChange={(event) => {
                setMonetizationChoice(event as 'free' | 'rent' | 'sell');
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="text-md">
                  Free visualization
                </Label>
              </div>

              <div className="mt-6 flex items-center space-x-2">
                <RadioGroupItem value="rent" id="rent" />
                <Label htmlFor="rent" className="text-md">
                  Rent content
                </Label>
              </div>
              {monetizationChoice === 'rent' && (
                <RentParams
                  rentPriceInRLC={rentPriceInRLC}
                  setRentPriceInRLC={setRentPriceInRLC}
                  rentDurationInDays={rentDurationInDays}
                  setRentDurationInDays={setRentDurationInDays}
                  isDisabled={isMonetizationAlreadySet || isConfirmLoading}
                />
              )}

              <div className="mt-6 flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label htmlFor="sell" className="text-md">
                  Sell content
                </Label>
              </div>
              <div className="ml-6 text-sm">
                <i>You transfer ownership of your content to the buyer</i>
              </div>
              {monetizationChoice === 'sell' && (
                <SellParams
                  sellPriceInRLC={sellPriceInRLC}
                  setSellPriceInRLC={setSellPriceInRLC}
                  isDisabled={isMonetizationAlreadySet || isConfirmLoading}
                />
              )}
            </RadioGroup>

            {isMonetizationAlreadySet && (
              <p className="mt-10">
                <AlertCircle
                  size="16"
                  className="-mt-0.5 mr-0.5 inline-block"
                />{' '}
                You have already chosen how to monetize this content. You can't
                change your choice through this demo app, but you can through
                the SDK!
              </p>
            )}

            {!isMonetizationAlreadySet && (
              <div className="mt-10">
                <Button type="submit" isLoading={isConfirmLoading}>
                  Confirm
                </Button>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}

function RentParams({
  rentPriceInRLC,
  setRentPriceInRLC,
  rentDurationInDays,
  setRentDurationInDays,
  isDisabled,
}: {
  rentPriceInRLC: string;
  setRentPriceInRLC: (value: string) => void;
  rentDurationInDays: string;
  setRentDurationInDays: (value: string) => void;
  isDisabled: boolean;
}) {
  return (
    <>
      <div className="w-[150px]">
        <Input
          type="number"
          value={rentPriceInRLC}
          placeholder="Price (in nRLC)"
          disabled={isDisabled}
          onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
            setRentPriceInRLC(event.target.value)
          }
        />
      </div>
      <div className="w-[150px]">
        <Input
          type="number"
          value={rentDurationInDays}
          placeholder="Duration (in days)"
          disabled={isDisabled}
          onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
            setRentDurationInDays(event.target.value)
          }
        />
      </div>
    </>
  );
}

function SellParams({
  sellPriceInRLC,
  setSellPriceInRLC,
  isDisabled,
}: {
  sellPriceInRLC: string;
  setSellPriceInRLC: (value: string) => void;
  isDisabled: boolean;
}) {
  return (
    <div className="relative ml-6 mt-2 w-[150px]">
      <Input
        type="number"
        value={sellPriceInRLC}
        disabled={isDisabled}
        placeholder="Price"
        className="rounded-xl pr-12"
        onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
          setSellPriceInRLC(event.target.value)
        }
      />
      <span className="absolute right-3 top-2 text-sm">RLC</span>
    </div>
  );
}
