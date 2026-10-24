import Image from "next/image";
import type { Dispatch, SetStateAction, FormEvent, RefObject } from "react";
import { categories, type Dish } from "./admin-data";
import styles from "./admin.module.css";
import { Icon, Toggle } from "./admin-controls";

type Props = {
  draft: Dish;
  setDraft: Dispatch<SetStateAction<Dish>>;
  saveDish: (event: FormEvent) => void;
  fileInput: RefObject<HTMLInputElement | null>;
  uploadDishImage: (file?: File) => void;
  navigate: (view: "menu" | "tables") => void;
};

export function MenuEditor({
  draft,
  setDraft,
  saveDish,
  fileInput,
  uploadDishImage,
  navigate,
}: Props) {
  return (
    <div className={styles.editorGrid}>
      <form className={styles.editor} onSubmit={saveDish}>
        <div className={styles.editorBody}>
          <div className={styles.sectionHeading}>
            <h2>ข้อมูลเมนู</h2>
            <small>* ข้อมูลที่จำเป็น</small>
          </div>
          <div className={styles.imageUpload}>
            <Image
              src={draft.image}
              width={105}
              height={90}
              alt="รูปเมนู"
              unoptimized
            />
            <div>
              <label>รูปอาหาร</label>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => fileInput.current?.click()}
              >
                <Icon name="edit" size={16} />
                เปลี่ยนรูปอาหาร
              </button>
              <small>JPG, PNG, WebP ไม่เกิน 5 MB</small>
              <input
                ref={fileInput}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => uploadDishImage(event.target.files?.[0])}
              />
            </div>
          </div>
          <label className={styles.field}>
            ชื่ออาหาร *
            <input
              required
              maxLength={100}
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              placeholder="เช่น ข้าวกะเพราหมูสับไข่ดาว"
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              หมวดหมู่ *
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value })
                }
              >
                {categories.slice(1).map((categoryName) => (
                  <option key={categoryName}>{categoryName}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              ราคา *
              <span className={styles.priceInput}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={draft.price || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, price: Number(event.target.value) })
                  }
                />
                <span>บาท</span>
              </span>
            </label>
          </div>
          <label className={styles.field}>
            คำอธิบายอาหาร
            <textarea
              rows={3}
              maxLength={300}
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
            <small>คำอธิบายสั้น ๆ ที่ช่วยให้ลูกค้ารู้จักเมนูได้ดีขึ้น</small>
          </label>
          <label className={styles.field}>สถานะการขาย</label>
          <div className={styles.statusBox}>
            <Icon name="check" />
            <div>
              <strong>{draft.available ? "พร้อมขาย" : "หมดชั่วคราว"}</strong>
              <small>
                {draft.available
                  ? "ลูกค้าสามารถสั่งเมนูนี้ได้"
                  : "หยุดรับออเดอร์เมนูนี้ชั่วคราว"}
              </small>
            </div>
            <Toggle
              checked={draft.available}
              label="พร้อมขาย"
              onChange={() =>
                setDraft({ ...draft, available: !draft.available })
              }
            />
          </div>
        </div>
        <footer className={styles.editorFooter}>
          <small>ตรวจสอบข้อมูลก่อนบันทึก</small>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => navigate("menu")}
          >
            ยกเลิก
          </button>
          <button type="submit" className={styles.primary}>
            <Icon name="check" size={16} />
            บันทึกการเปลี่ยนแปลง
          </button>
        </footer>
      </form>
      <aside>
        <div className={styles.preview}>
          <h2>
            <Icon name="menu" size={17} />
            ตัวอย่างเมนูของลูกค้า
          </h2>
          <Image
            className={styles.previewImage}
            src={draft.image}
            width={500}
            height={340}
            alt={draft.name || "รูปอาหาร"}
            unoptimized
          />
          <span className={styles.previewBadge}>
            ● {draft.available ? draft.category : "หมดชั่วคราว"}
          </span>
          <h3>{draft.name || "ชื่อเมนูอาหาร"}</h3>
          <p>{draft.description || "คำอธิบายเมนูของคุณ"}</p>
          <div className={styles.previewPrice}>
            ฿{draft.price || 0}
            <span>＋</span>
          </div>
        </div>
        <div className={styles.infoBox}>
          <Icon name="info" size={18} />
          <div>
            <strong>บันทึกแล้ว ข้อมูลจะอยู่ในเครื่องนี้</strong>
            <p>ตัวอย่างนี้ยังไม่เชื่อมต่อระบบจัดการเมนูบนเซิร์ฟเวอร์</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
