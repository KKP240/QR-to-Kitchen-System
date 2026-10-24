"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./menu.module.css";
import { BowlIcon } from "./icons";

type FoodImageProps = {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function FoodImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 520px) 30vw, 140px",
  priority = false,
}: FoodImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`${styles.imageBox} ${className}`}>
      {!src || failed ? (
        <span className={styles.imageFallback} role="img" aria-label={alt}>
          <BowlIcon size={26} />
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading="eager"
          unoptimized
          className={styles.photo}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
