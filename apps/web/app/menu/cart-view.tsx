"use client";

import { FoodImage } from "./food-image";
import { QuantityStepper } from "./quantity-stepper";
import { formatNumber, SERVICE_FEE } from "./menu-data";
import type { CartLine } from "./menu-data";
import styles from "./menu.module.css";
import { ArrowRightIcon, BagIcon, PlusIcon, SparkIcon, TrashIcon } from "./icons";

type CartViewProps = {
  lines: CartLine[];
  note: string;
  onNoteChange: (value: string) => void;
  onDecrease: (id: string) => void;
  onIncrease: (item: CartLine["item"]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onBack: () => void;
  onCheckout: () => void;
  submitting: boolean;
  submitError: string | null;
};

export function CartView({
  lines,
  note,
  onNoteChange,
  onDecrease,
  onIncrease,
  onRemove,
  onClear,
  onBack,
  onCheckout,
  submitting,
  submitError,
}: CartViewProps) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const total = subtotal + SERVICE_FEE;

  if (lines.length === 0) {
    return (
      <div className={`${styles.view} ${styles.cartView}`}>
        <div className={styles.pageHead}>
          <h1>เช็คอีกนิดก่อนส่งครัว</h1>
          <p>ยังไม่มีรายการในตะกร้า</p>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>
            <BagIcon size={30} />
          </span>
          <h2>ตะกร้ายังว่างอยู่</h2>
          <p>เลือกเมนูที่ถูกใจ แล้วกลับมาสั่งพร้อมกันได้เลย</p>
          <button type="button" className={styles.primaryButton} onClick={onBack}>
            <SparkIcon size={15} />
            ดูเมนูทั้งหมด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.view} ${styles.cartView}`}>
      <div className={styles.pageHead}>
        <h1>เช็คอีกนิดก่อนส่งครัว</h1>
        <p>{count} รายการ · อาหารพร้อมส่งครัว</p>
      </div>

      <div className={styles.cartList}>
        {lines.map((line) => (
          <article className={styles.cartItem} key={line.item.id}>
            <FoodImage
              src={line.item.imageUrl}
              alt={line.item.name}
              className={styles.cartImage}
              sizes="140px"
            />
            <div className={styles.cartBody}>
              <div className={styles.cartTop}>
                <h3 className={styles.cartName}>{line.item.name}</h3>
                <button
                  type="button"
                  className={styles.trashButton}
                  onClick={() => onRemove(line.item.id)}
                  aria-label={`ลบ ${line.item.name} ออกจากตะกร้า`}
                >
                  <TrashIcon size={15} />
                </button>
              </div>
              <span className={styles.unitPrice}>
                <small>฿</small>
                {formatNumber(line.item.price)}
                <em>/ จาน</em>
              </span>
              <p className={styles.cartDesc}>{line.item.description}</p>
              <div className={styles.cartBottom}>
                <QuantityStepper
                  value={line.quantity}
                  onDecrease={() => onDecrease(line.item.id)}
                  onIncrease={() => onIncrease(line.item)}
                  label={line.item.name}
                  large
                />
                <strong className={styles.linePrice}>
                  <small>฿</small>
                  {formatNumber(line.item.price * line.quantity)}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.cartTools}>
        <button type="button" className={styles.textButton} onClick={onBack}>
          <PlusIcon size={14} />
          เลือกเมนูเพิ่ม
        </button>
        <button type="button" className={`${styles.textButton} ${styles.dangerText}`} onClick={onClear}>
          <TrashIcon size={14} />
          ล้างตะกร้า
        </button>
      </div>

      <label className={styles.noteField}>
        <span>หมายเหตุถึงครัว</span>
        <textarea
          rows={3}
          maxLength={200}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="เช่น ไม่ใส่ผัก ไม่เผ็ดมาก (ถ้ามี)"
        />
        <small>{note.length}/200</small>
      </label>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span>ยอดรวม</span>
          <b>฿{formatNumber(subtotal)}</b>
        </div>
        <div className={styles.summaryRow}>
          <span>ค่าบริการ</span>
          <b>฿{formatNumber(SERVICE_FEE)}</b>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>รวมทั้งหมด</span>
          <strong>฿{formatNumber(total)}</strong>
        </div>
        <p className={styles.summaryHint}>ราคารวมภาษีแล้ว · ชำระที่เคาน์เตอร์</p>
      </div>

      <button
        type="button"
        className={styles.checkoutButton}
        onClick={onCheckout}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span className={styles.spinner} />
            กำลังส่งออเดอร์...
          </>
        ) : (
          <>
            <ArrowRightIcon size={17} strokeWidth={2} />
            ยืนยันสั่งอาหาร · ฿{formatNumber(total)}
          </>
        )}
      </button>
      <p className={styles.footNote}>เมื่อกดยืนยัน ครัวจะเริ่มทำอาหารทันที</p>
      {submitError && <p className={styles.formError}>{submitError}</p>}
    </div>
  );
}