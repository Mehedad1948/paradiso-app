import { useEffect, useState } from "react";

const useSizeController = (smallThreshold: number = 768) => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
    }
  }, []);

  const isSmall = width > 0 && width < smallThreshold;
  const isLarge = width > 1280;

  return { innerWidth: width, isSmall, isLarge, innerHeight: height };
};

export default useSizeController;
