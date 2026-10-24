"use client";

import type { ComponentType } from "react";
import type { Order } from "@qr-kitchen/shared";
import {
  BagIcon,
  BellIcon,
  ChairIcon,
  CheckIcon,
  ClockIcon,
  ClocheIcon,
  PlusIcon,
  SparkIcon,
} from "./icons";
import {
  buildOrderSteps,
  formatClock,
  formatNumber,
  orderDisplayNo,
  orderItemCount,
  orderTotal,
  statusView,
} from "./menu-data";
import styles from "./menu.module.css";

type TrackingViewProps = {
  order: Order;
  table: string;
  onOrderMore: () => void;
};

const statusIcons: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  bag: BagIcon,
  cloche: ClocheIcon,
  bell: BellIcon,
  check: CheckIcon,
};

export function TrackingView({ order, table, onOrderMore }: TrackingViewProps) {
  const view = statusView(order);
  const steps = buildOrderSteps(order);
  const Icon = statusIcons[view.icon] ?? BagIcon;
  const total = orderTotal(order);
  const itemCount = orderItemCount(order);

  return (
    <div className={`${styles.view} ${styles.trackingView}`}>
      <div className={styles.statusPillWrap}>
        <span className={`${styles.statusPill} ${styles.toneCooking}`}>
          <span className={styles.statusDot} />
          สั่งออเดอร์เรียบร้อยแล้ว
        </span>
      </div>

      <div className={styles.trackHero}>
        <span className={`${styles.trackIcon} ${styles[`icon${capitalize(view.tone)}`] ?? ""}`}>
          <Icon size={38} />
        </span>
        <h1>{view.heading}</h1>
        <p>{view.description}</p>
        <span className={styles.waitChip}>
          <ClockIcon size={13} />
          {view.wait}
        </span>
      </div>

      <div className={styles.progressCard}>
        <div className={styles.progress}>
          {steps.map((step, index) => (
            <div
              key={step.label}
              className={`${styles.progressStep} ${styles[`step${capitalize(step.state)}`] ?? ""}`}
            >
              {index > 0 && (
                <span
                  className={`${styles.stepLine} ${step.state !== "todo" ? styles.stepLineActive : ""}`}
                />
              )}
              <span className={styles.stepDot}>
                {step.state === "todo" ? index + 1 : <CheckIcon size={12} strokeWidth={2.4} />}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
              <span className={styles.stepTime}>{step.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.orderCard}>
        <div className={styles.orderHead}>
          <div>
            <span className={styles.orderLabel}>หมายเลขออเดอร์</span>
            <strong className={styles.orderNumber}>#{orderDisplayNo(order.id)}</strong>
          </div>
          <div className={styles.orderMeta}>
            <span className={styles.orderTable}>
              <ChairIcon size={12} />
              โต๊ะ {table}
            </span>
            <span className={styles.orderedAt}>
              สั่งเมื่อ {formatClock(order.createdAt)} น. · {itemCount} รายการ
            </span>
          </div>
        </div>

        <ul className={styles.orderItems}>
          {order.items.map((item, index) => (
            <li key={`${item.menuItemId}-${index}`}>
              <span className={styles.itemQty}>{item.quantity}×</span>
              <span className={styles.itemName}>{item.name}</span>
              <b>฿{formatNumber((Number(item.price) || 0) * (Number(item.quantity) || 0))}</b>
            </li>
          ))}
        </ul>

        {order.note && (
          <div className={styles.orderNote}>
            <strong>หมายเหตุ</strong>
            <span>{order.note}</span>
          </div>
        )}

        <div className={styles.orderTotal}>
          <span>รวมทั้งหมด</span>
          <strong>฿{formatNumber(total)}</strong>
        </div>
      </div>

      <p className={styles.statusLine}>
        <span className={styles.statusLineDot} />
        {view.line}
      </p>

      <button type="button" className={styles.secondaryButton} onClick={onOrderMore}>
        <PlusIcon size={15} />
        สั่งอาหารเพิ่ม
      </button>

      <p className={styles.poweredBy}>ชำระที่เคาน์เตอร์ · พนักงานจะแจ้งเมื่ออาหารพร้อมเสิร์ฟ</p>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}