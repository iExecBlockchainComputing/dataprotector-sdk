import { useState } from 'react';

export function MonetizationChoice() {
  const [pricingOptions, setPricingOptions] = useState({
    isFree: false,
    isForRent: false,
    isIncludedInSubscription: false,
    isForSell: false,
  });

  return (
    <>
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
                isIncludedInSubscription: false,
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
                isIncludedInSubscription: false,
                isForSell: false,
              });
            }}
          />
          Rent content
        </label>
        {pricingOptions.isForRent && (
          <div className="ml-6">
            <label className="flex items-center gap-x-2">
              Price to watch:
              <input
                type="text"
                placeholder="2 RLC"
                className="h-8 border border-grey-500 bg-grey-800 px-1.5"
              />
              Available period:
              <input
                type="text"
                placeholder="30 days"
                className="h-8 border border-grey-500 bg-grey-800 px-1.5"
              />
            </label>
            <label className="mt-2 flex gap-x-2">
              <input
                type="checkbox"
                onChange={(e) => {
                  setPricingOptions({
                    isFree: false,
                    isForRent: true,
                    isIncludedInSubscription: e.target.checked,
                    isForSell: false,
                  });
                }}
              />
              Also include in subscription
            </label>
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
                isIncludedInSubscription: true,
                isForSell: false,
              });
            }}
          />
          Include in subscription
        </label>
        <label className="mt-2 block">
          <input
            type="radio"
            name="monetizaion"
            className="mr-2"
            onChange={() => {
              setPricingOptions({
                isFree: false,
                isForRent: false,
                isIncludedInSubscription: false,
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

      <code className="mt-3">{JSON.stringify(pricingOptions, null, 2)}</code>
    </>
  );
}
