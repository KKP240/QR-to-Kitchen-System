"use client";

import styles from "./menu.module.css";
import { MinusIcon, PlusIcon } from "./icons";

type QuantityStepperProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  label: string;
  large?: boolean;
};

export function QuantityStepper({ value, onDecrease, onIncrease, label, large = false }: QuantityStepperProps) {
  return (
    <div className={`${styles.stepper} ${large ? styles.stepperLarge : ""}`}>
      <button type="button" onClick={onDecrease} aria-label={`ลดจำนวน ${label}`}>
        <MinusIcon size={large ? 15 : 14} strokeWidth={2} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={onIncrease} aria-label={`เพิ่มจำนวน ${label}`}>
        <PlusIcon size={large ? 15 : 14} strokeWidth={2} />
      </button>
    </div>
  );
}
