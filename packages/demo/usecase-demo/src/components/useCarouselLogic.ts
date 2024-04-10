import { useEffect } from "react";

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

export function MouseMove(carousel) {
  useEffect(() => {
    let isDown = false;
    let startX: number;
    let startY: number;
    let scrollLeft: number;
    let scrollTop: number;

    carousel?.current?.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - carousel.current.offsetLeft;
      startY = e.pageY - carousel.current.offsetTop;
      scrollLeft = carousel.current.scrollLeft;
      scrollTop = carousel.current.scrollTop;
    });

    carousel?.current?.addEventListener('mouseleave', () => {
      isDown = false;
    });

    carousel?.current?.addEventListener('mouseup', () => {
      isDown = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.current.offsetLeft;
      const y = e.pageY - carousel.current.offsetTop;
      const walkX = (x - startX) * 1;
      const walkY = (y - startY) * 1;
      carousel.current.scrollLeft = scrollLeft - walkX;
      carousel.current.scrollTop = scrollTop - walkY;
    });
  }, []);
}