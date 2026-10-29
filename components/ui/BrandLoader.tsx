import { fontLogo } from "@/config/fonts";

import styles from "./BrandLoader.module.css";

export default function BrandLoader() {
  return (
    <div
      aria-label="Loading"
      className={styles.wrap}
      role="status"
    >
      <span className={`${fontLogo.className} ${styles.title}`}>
        Cinema Paradiso
      </span>
      <span aria-hidden className={styles.line} />
    </div>
  );
}
