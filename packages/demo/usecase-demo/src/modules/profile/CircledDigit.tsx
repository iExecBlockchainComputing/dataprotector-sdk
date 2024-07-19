import React from 'react';
import { Check } from 'react-feather';

export function CircledDigit({
  isActive = false,
  isDone = false,
  children,
}: {
  isActive?: boolean;
  isDone?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full font-medium ${isDone ? 'bg-primary text-grey-800' : isActive ? 'bg-yellow-50 text-grey-800' : 'bg-grey-800 text-grey-600'}`}
    >
      {!isDone ? children : <Check size="16" className="ml-px mt-[2px]" />}
    </div>
  );
}
