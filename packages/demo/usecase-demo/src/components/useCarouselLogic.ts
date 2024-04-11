export function OnScrollLeft(carousel) {
  carousel.current.scrollBy({
    top: 0,
    left: -carousel.current.clientWidth,
    behavior: 'smooth',
  });
}

export function OnScrollRight(carousel) {
  carousel.current.scrollBy({
    top: 0,
    left: carousel.current.clientWidth,
    behavior: 'smooth',
  });
}
