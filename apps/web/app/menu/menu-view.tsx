"use client";

import { useMemo, useState } from "react";
import type { MenuItem } from "@qr-kitchen/shared";
import { FoodImage } from "./food-image";
import { QuantityStepper } from "./quantity-stepper";
import { buildCategories, formatNumber } from "./menu-data";
import styles from "./menu.module.css";
import { ArrowRightIcon, InfoIcon, PlusIcon, RefreshIcon, SparkIcon } from "./icons";

type MenuViewProps = {
  items: MenuItem[];
  cart: Record<string, number>;
  loading: boolean;
  error: string | null;
  table: string;
  onAdd: (item: MenuItem) => void;
  onRemove: (id: string) => void;
  onRetry: () => void;
};

export function MenuView({ items, cart, loading, error, table, onAdd, onRemove, onRetry }: MenuViewProps) {
  const [activeTab, setActiveTab] = useState("ทั้งหมด");

  const categories = useMemo(() => buildCategories(items), [items]);
  const effectiveTab = categories.includes(activeTab) ? activeTab : "ทั้งหมด";
  const availableCount = items.filter((item) => item.available).length;

  const recommended = useMemo(() => {
    const flagged = items.filter((item) => item.recommended);
    if (flagged.length > 0) return flagged;
    return items.filter((item) => item.available).slice(0, 4);
  }, [items]);

  const hero = recommended.find((item) => item.available) ?? items.find((item) => item.available);
  const visibleItems = useMemo(() => {
    if (effectiveTab === "ทั้งหมด") return items;
    if (effectiveTab === "แนะนำ") return recommended;
    return items.filter((item) => item.category === effectiveTab);
  }, [effectiveTab, items, recommended]);

  if (loading) {
    return (
      <div className={styles.view}>
        <div className={styles.intro}>
          <div>
            <h1>มื้อนี้ กินอะไรดี?</h1>
            <p className={styles.introMeta}>
              <InfoIcon size={12} />
              กำลังจัดเตรียมเมนูให้คุณ
            </p>
          </div>
        </div>
        <div className={`${styles.hero} ${styles.skeletonHero}`} />
        <div className={styles.tabSkeletonRow}>
          {[58, 52, 66, 66].map((width, index) => (
            <span key={index} className={styles.skeletonPill} style={{ width }} />
          ))}
        </div>
        <div className={styles.sectionHead}>
          <span className={styles.skeletonLine} style={{ width: 110 }} />
          <span className={styles.skeletonLine} style={{ width: 45 }} />
        </div>
        <div className={styles.dishList}>
          {[0, 1, 2, 3].map((index) => (
            <div className={`${styles.dishCard} ${styles.skeletonCard}`} key={index}>
              <span className={styles.skeletonThumb} />
              <div className={styles.skeletonCopy}>
                <span className={styles.skeletonLine} style={{ width: "68%" }} />
                <span className={styles.skeletonLine} style={{ width: "88%" }} />
                <span className={styles.skeletonLine} style={{ width: "42%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.view}>
        <div className={styles.intro}>
          <div>
            <h1>มื้อนี้ กินอะไรดี?</h1>
            <p className={styles.introMeta}>
              <InfoIcon size={12} />
              โต๊ะของเรายังไม่พร้อมเสิร์ฟ
            </p>
          </div>
        </div>
        <div className={styles.errorBox}>
          <span className={styles.errorIcon}>
            <InfoIcon size={22} />
          </span>
          <h2>เชื่อมต่อเมนูไม่ได้</h2>
          <p>{error}</p>
          <button type="button" className={styles.retryButton} onClick={onRetry}>
            <RefreshIcon size={15} />
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.intro}>
        <div>
          <h1>มื้อนี้ กินอะไรดี?</h1>
          <p className={styles.introMeta}>
            <InfoIcon size={12} />
            โต๊ะ {table} · {availableCount} เมนูพร้อมเสิร์ฟ · เปิด 10:00–22:00
          </p>
        </div>
        <span className={styles.introNote}>
          <span className={styles.liveDot} />
          ครัวเปิดอยู่
        </span>
      </div>

      {hero && (
        <button
          type="button"
          className={styles.hero}
          onClick={() => onAdd(hero)}
          disabled={!hero.available}
          aria-label={`เพิ่ม ${hero.name} ลงตะกร้า`}
        >
          <FoodImage
            src={hero.imageUrl}
            alt={hero.name}
            className={styles.heroImage}
            sizes="(max-width: 520px) 100vw, 430px"
            priority
          />
          <span className={styles.heroShade} />
          <span className={styles.heroContent}>
            <span className={styles.heroTag}>
              <SparkIcon size={11} />
              {hero.category ?? "จานเดียว"} · แนะนำ
            </span>
            <strong className={styles.heroName}>{hero.name}</strong>
            <span className={styles.heroDesc}>{hero.description}</span>
          </span>
          <span className={styles.heroPrice}>
            <small>฿</small>
            {formatNumber(hero.price)}
          </span>
          <span className={styles.heroAdd}>
            <PlusIcon size={17} strokeWidth={2} />
          </span>
        </button>
      )}

      <div className={styles.tabs} role="tablist" aria-label="หมวดหมู่เมนู">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={effectiveTab === category}
            className={`${styles.tab} ${effectiveTab === category ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.sectionHead}>
        <h2>{effectiveTab === "ทั้งหมด" || effectiveTab === "แนะนำ" ? "อร่อยแนะนำ" : effectiveTab}</h2>
        <span>{visibleItems.length} เมนู</span>
      </div>

      {visibleItems.length === 0 ? (
        <div className={styles.emptyMenu}>
          <span>
            <SparkIcon size={22} />
          </span>
          <p>ยังไม่มีเมนูในหมวดนี้</p>
          <button type="button" onClick={() => setActiveTab("ทั้งหมด")}>
            ดูเมนูทั้งหมด
            <ArrowRightIcon size={13} />
          </button>
        </div>
      ) : (
        <div className={styles.dishList}>
          {visibleItems.map((item) => {
            const quantity = cart[item.id] ?? 0;
            return (
              <MenuDishCard
                key={item.id}
                item={item}
                quantity={quantity}
                onAdd={() => onAdd(item)}
                onRemove={() => onRemove(item.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function MenuDishCard({
  item,
  quantity,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <article className={`${styles.dishCard} ${!item.available ? styles.dishUnavailable : ""}`}>
      <FoodImage src={item.imageUrl} alt={item.name} className={styles.dishImage} sizes="150px" />
      <div className={styles.dishBody}>
        <h3 className={styles.dishTitle}>{item.name}</h3>
        <p className={styles.dishDesc}>{item.description}</p>
        <div className={styles.dishFoot}>
          <span className={styles.price}>
            <small>฿</small>
            {formatNumber(item.price)}
          </span>
          {!item.available ? (
            <span className={styles.soldOut}>หมดชั่วคราว</span>
          ) : quantity > 0 ? (
            <QuantityStepper value={quantity} onDecrease={onRemove} onIncrease={onAdd} label={item.name} />
          ) : (
            <button type="button" className={styles.addButton} onClick={onAdd} aria-label={`เพิ่ม ${item.name}`}>
              <PlusIcon size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
