import mediumZoom, { Zoom } from 'medium-zoom';
import { useRef, ComponentProps, RefCallback } from 'react';

export function ImageZoom(props: ComponentProps<'img'>) {
  const zoomRef = useRef<Zoom | null>(null);

  function getZoom() {
    if (zoomRef.current === null) {
      zoomRef.current = mediumZoom({
        background: 'black',
        scrollOffset: Infinity,
        container: '#root',
      });
    }

    return zoomRef.current;
  }

  const attachZoom: RefCallback<HTMLImageElement> = (node) => {
    const zoom = getZoom();

    if (node) {
      zoom.attach(node);
    } else {
      zoom.detach();
    }
  };

  return <img {...props} ref={attachZoom} />;
}
