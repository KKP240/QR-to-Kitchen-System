"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./admin.module.css";
import { QRCode } from "./qr-code";
import { Icon } from "./admin-controls";
import {
  initialMenu,
  initialTables,
  emptyDish,
  type Dish,
  type Table,
} from "./admin-data";

import { MenuList } from "./menu-list";

import { TableList } from "./table-list";

import { MenuEditor } from "./menu-editor";

const STORAGE_KEY = "bai-krapao-admin-v1";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminPage() {
  const [view, setView] = useState<"menu" | "tables" | "edit">("menu");
  const [menu, setMenu] = useState(initialMenu);
  const [tables, setTables] = useState(initialTables);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [draft, setDraft] = useState(emptyDish);
  const [tableDraft, setTableDraft] = useState<Table | null>(null);
  const [notice, setNotice] = useState("");
  const [origin, setOrigin] = useState("");
  const [date, setDate] = useState("");
  const [printing, setPrinting] = useState<string[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // โหลดข้อมูลเดิมก่อน เพื่อไม่ให้ข้อมูลตัวอย่างเขียนทับสิ่งที่ผู้ใช้บันทึกไว้
  useEffect(() => {
    setOrigin(window.location.origin);
    setDate(
      new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      }).format(new Date()),
    );
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (
        data &&
        Array.isArray(data.menu) &&
        Array.isArray(data.tables) &&
        data.menu.every(
          (dish: Dish) =>
            typeof dish.id === "string" &&
            typeof dish.name === "string" &&
            typeof dish.price === "number" &&
            typeof dish.image === "string" &&
            typeof dish.available === "boolean",
        ) &&
        data.tables.every(
          (table: Table) =>
            typeof table.id === "string" &&
            typeof table.name === "string" &&
            typeof table.seats === "number" &&
            typeof table.active === "boolean",
        )
      ) {
        setMenu(data.menu);
        setTables(data.tables);
      }
    } catch {
      setNotice("อ่านข้อมูลที่บันทึกไว้ไม่สำเร็จ กำลังใช้ข้อมูลตัวอย่าง");
    }
    setReady(true);
  }, []);

  // บันทึกทุกครั้งที่แก้ไขเมนูหรือโต๊ะ หลังจากโหลดข้อมูลเดิมเสร็จแล้ว
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ menu, tables }));
      } catch {
        setNotice(
          "บันทึกไม่สำเร็จ พื้นที่จัดเก็บไม่พร้อมหรือเต็ม การแก้ไขล่าสุดจะหายเมื่อปิดหน้านี้",
        );
      }
    }
  }, [menu, tables, ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // รอให้ป้าย QR แสดงในหน้าเว็บก่อนเปิดหน้าต่างพิมพ์
  useEffect(() => {
    if (!printing) return;
    const timer = setTimeout(() => window.print(), 300);
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  function navigate(next: "menu" | "tables") {
    setView(next);
    setSearch("");
  }

  function editDish(dish: Dish) {
    setDraft({ ...dish });
    setView("edit");
  }

  function saveDish(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !Number.isFinite(draft.price) || draft.price <= 0)
      return;
    const item = {
      ...draft,
      name: draft.name.trim(),
      id: draft.id || crypto.randomUUID(),
    };
    setMenu((items) =>
      draft.id
        ? items.map((dish) => (dish.id === draft.id ? item : dish))
        : [...items, item],
    );
    navigate("menu");
    setNotice("บันทึกเมนูเรียบร้อยแล้ว");
  }

  function uploadDishImage(file?: File) {
    if (!file) return;
    if (
      !ALLOWED_IMAGE_TYPES.includes(file.type) ||
      file.size > MAX_IMAGE_SIZE
    ) {
      setNotice("เลือกภาพ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setDraft((dish) => ({ ...dish, image: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function saveTable(event: FormEvent) {
    event.preventDefault();
    if (!tableDraft?.name.trim()) return;
    if (
      tables.some(
        (table) =>
          table.name === tableDraft.name.trim() && table.id !== tableDraft.id,
      )
    ) {
      setNotice("มีชื่อโต๊ะนี้แล้ว กรุณาใช้ชื่ออื่น");
      return;
    }
    const item = {
      ...tableDraft,
      name: tableDraft.name.trim(),
      id: tableDraft.id || crypto.randomUUID(),
    };
    setTables((items) =>
      tableDraft.id
        ? items.map((table) => (table.id === item.id ? item : table))
        : [...items, item],
    );
    setTableDraft(null);
    setNotice("บันทึกโต๊ะเรียบร้อยแล้ว");
  }

  const filteredMenu = menu.filter(
    (dish) =>
      (category === "ทั้งหมด" || dish.category === category) &&
      `${dish.name} ${dish.description}`.includes(search.trim()),
  );
  const availableMenuCount = menu.filter((dish) => dish.available).length;
  const getTableUrl = (table: Table) =>
    `${origin}/menu/?table=${encodeURIComponent(table.id)}`;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/admin/">
          <span className={styles.logo}>
            <Icon name="leaf" size={27} />
          </span>
          <span>
            <strong>ใบกะเพรา</strong>
            <small>อาหารไทย · อิ่มอร่อยเหมือนอยู่บ้าน</small>
          </span>
        </a>
        <div className={styles.headerRight}>
          <span className={styles.date}>{date}</span>
          <span className={styles.storeStatus}>
            <i /> ร้านเปิดอยู่
          </span>
          <span className={styles.profile}>
            <b>บก</b>
            <span>เจ้าของร้าน</span>
          </span>
        </div>
      </header>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.navTitle}>จัดการร้าน</p>
          <nav aria-label="เมนูจัดการร้าน">
            <a href="/kitchen/">
              <Icon name="kitchen" />
              หน้าจอครัว
            </a>
            <button
              className={view !== "tables" ? styles.selected : ""}
              onClick={() => navigate("menu")}
            >
              <Icon name="menu" />
              เมนูและราคา
            </button>
            <button
              className={view === "tables" ? styles.selected : ""}
              onClick={() => navigate("tables")}
            >
              <Icon name="qr" />
              โต๊ะและ QR Code
            </button>
          </nav>
        </div>
        <div className={styles.sidebarNote}>
          <Icon name="heart" />
          <p>
            ทุกจาน
            <br />
            ใส่ใจเหมือนทำให้คนที่บ้าน
          </p>
          <small>ใบกะเพรา · อาหารดีดี</small>
        </div>
      </aside>
      <main className={styles.main}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>
              {view === "edit" ? "เมนูและราคา / แก้ไขเมนู" : "จัดการร้าน"}
            </p>
            <h1>
              {view === "tables"
                ? "โต๊ะและ QR Code"
                : view === "edit"
                  ? draft.id
                    ? "แก้ไขเมนูอาหาร"
                    : "เพิ่มเมนูอาหาร"
                  : "เมนูและราคา"}
            </h1>
            <p className={styles.subtitle}>
              {view === "tables"
                ? "หนึ่งโต๊ะ หนึ่ง QR ลูกค้าสแกนแล้วสั่งอาหารได้ทันที"
                : view === "edit"
                  ? "ปรับข้อมูลจานโปรด แล้วบันทึกเพื่อดูตัวอย่างเมนูของคุณ"
                  : "จัดจานโปรดให้ครบครัน อัปเดตราคาและสถานะได้ในที่เดียว"}
            </p>
          </div>
          {view === "edit" ? (
            <button className={styles.back} onClick={() => navigate("menu")}>
              ← กลับรายการเมนู
            </button>
          ) : (
            <button
              className={styles.primary}
              onClick={() =>
                view === "menu"
                  ? editDish(emptyDish)
                  : setTableDraft({ id: "", name: "", seats: 4, active: true })
              }
            >
              <Icon name="plus" size={16} />
              {view === "menu" ? "เพิ่มเมนูใหม่" : "เพิ่มโต๊ะ"}
            </button>
          )}
        </div>
        {view === "menu" && (
          <MenuList
            menu={menu}
            availableMenuCount={availableMenuCount}
            filteredMenu={filteredMenu}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            editDish={editDish}
            setMenu={setMenu}
          />
        )}
        {view === "tables" && (
          <TableList
            tables={tables}
            search={search}
            setSearch={setSearch}
            setPrinting={setPrinting}
            setTableDraft={setTableDraft}
            setTables={setTables}
            getTableUrl={getTableUrl}
          />
        )}
        {view === "edit" && (
          <MenuEditor
            draft={draft}
            setDraft={setDraft}
            saveDish={saveDish}
            fileInput={fileInput}
            uploadDishImage={uploadDishImage}
            navigate={navigate}
          />
        )}
        <p className={styles.localNote}>
          โหมดตัวอย่าง · บันทึกข้อมูลเฉพาะเบราว์เซอร์นี้ ยังไม่เชื่อมต่อ API
          หลังบ้าน
        </p>
      </main>
      {notice && (
        <div role="status" className={styles.toast}>
          {notice}
          <button onClick={() => setNotice("")} aria-label="ปิดข้อความ">
            ×
          </button>
        </div>
      )}
      {tableDraft && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setTableDraft(null)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-title"
            className={styles.modal}
            onSubmit={saveTable}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") setTableDraft(null);
            }}
          >
            <h2 id="table-title">
              {tableDraft.id ? "แก้ไขโต๊ะ" : "เพิ่มโต๊ะใหม่"}
            </h2>
            <label className={styles.field}>
              ชื่อ / เลขโต๊ะ *
              <input
                autoFocus
                required
                maxLength={20}
                value={tableDraft.name}
                onChange={(event) =>
                  setTableDraft({ ...tableDraft, name: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              จำนวนที่นั่ง *
              <input
                required
                type="number"
                min="1"
                max="30"
                value={tableDraft.seats}
                onChange={(event) =>
                  setTableDraft({
                    ...tableDraft,
                    seats: Number(event.target.value),
                  })
                }
              />
            </label>
            <div className={styles.modalActions}>
              {tableDraft.id && (
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => {
                    if (window.confirm(`ลบโต๊ะ ${tableDraft.name} หรือไม่?`)) {
                      setTables(
                        tables.filter((table) => table.id !== tableDraft.id),
                      );
                      setTableDraft(null);
                    }
                  }}
                >
                  ลบโต๊ะ
                </button>
              )}
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setTableDraft(null)}
              >
                ยกเลิก
              </button>
              <button className={styles.primary} type="submit">
                บันทึกโต๊ะ
              </button>
            </div>
          </form>
        </div>
      )}
      <div className={styles.printArea}>
        {printing &&
          tables
            .filter((table) => printing.includes(table.id))
            .map((table) => (
              <div key={table.id} className={styles.printCard}>
                <h2>ใบกะเพรา</h2>
                <p>สแกนเพื่อดูเมนูและสั่งอาหาร</p>
                <QRCode value={getTableUrl(table)} />
                <h3>โต๊ะ {table.name}</h3>
                <small>{getTableUrl(table)}</small>
              </div>
            ))}
      </div>
    </div>
  );
}
