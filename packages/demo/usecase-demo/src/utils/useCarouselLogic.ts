import React from 'react';

export function useCarouselLogic() {
  function scrollLeft(carousel: React.RefObject<HTMLDivElement>) {
    carousel.current?.scrollBy({
      top: 0,
      left: -carousel.current.clientWidth,
      behavior: 'smooth',
    });
  }
  function scrollRight(carousel: React.RefObject<HTMLDivElement>) {
    carousel.current?.scrollBy({
      top: 0,
      left: carousel.current.clientWidth,
      behavior: 'smooth',
    });
  }
  return {
    scrollLeft,
    scrollRight,
  };
}
