import type { CSSProperties, ReactNode } from "react";
import styles from "./StarBorder.module.css";

type StarBorderProps = {
  children: ReactNode;
  className?: string;
  color?: string;
  speed?: string;
};

/** Wraps a child with a glowing "star" that orbits the top and bottom edges. */
export default function StarBorder({
  children,
  className = "",
  color,
  speed,
}: StarBorderProps) {
  const style = {
    ...(color && { "--star-color": color }),
    ...(speed && { "--star-speed": speed }),
  } as CSSProperties;

  return (
    <span className={`${styles.root} ${className}`} style={style}>
      <span className={styles.bottom} aria-hidden="true" />
      <span className={styles.top} aria-hidden="true" />
      <span className={`${styles.content} block`}>{children}</span>
    </span>
  );
}
