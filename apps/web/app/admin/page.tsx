"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./admin.module.css";
import { QRCode } from "./qr-code";
import { Icon } from "./admin-controls";
import type { MenuItem, RestaurantTable } from "@qr-kitchen/shared";
import { api } from "@/lib/api";
import { AuthGate, SignOutButton, useAuthUser } from "@/components/auth-gate";
import {
  initialMenu,
  emptyDish,
  type Dish,
  type Table,
} from "./admin-data";

import { MenuList } from "./menu-list";

import { TableList } from "./table-list";

import { MenuEditor } from "./menu-editor";

function toDish(item: MenuItem): Dish {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    category: item.category ?? "จานเดียว",
    price: item.price,
    available: item.available,
    image: item.imageUrl || initialMenu[0].image,
  };
}

export default function AdminPage() {
  return (
    <AuthGate roles={["manager"]}>
      <AdminConsole />
    </AuthGate>
  );
}

function AdminConsole() {
  const user = useAuthUser();
  const [view, setView] = useState<"menu" | "tables" | "edit">("menu");
  const [menu, setMenu] = useState<Dish[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [draft, setDraft] = useState(emptyDish);
  const [tableDraft, setTableDraft] = useState<Table | null>(null);
  const [notice, setNotice] = useState("");
  const [origin, setOrigin] = useState("");
  const [date, setDate] = useState("");
  const [printing, setPrinting] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    const browserMetadataTimer = window.setTimeout(() => {
      if (!active) return;
      setOrigin(window.location.origin);
      setDate(
        new Intl.DateTimeFormat("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Bangkok",
        }).format(new Date()),
      );
    }, 0);
    Promise.all([
      api<{ items: MenuItem[] }>("/menu"),
      api<{ tables: RestaurantTable[] }>("/tables"),
    ])
      .then(([menuData, tableData]) => {
        if (!active) return;
        setMenu(menuData.items.map(toDish));
        setTables(tableData.tables);
      })
      .catch((requestError: unknown) => {
        if (active) setNotice(requestError instanceof Error ? requestError.message : "โหลดข้อมูลร้านไม่สำเร็จ");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(browserMetadataTimer);
    };
  }, []);

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

  async function saveDish(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !Number.isFinite(draft.price) || draft.price <= 0) return;
    if (draft.image.trim()) {
      try {
        const imageUrl = new URL(draft.image);
        if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") throw new Error();
      } catch {
        setNotice("URL รูปภาพต้องขึ้นต้นด้วย http:// หรือ https://");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        category: draft.category,
        price: draft.price,
        available: draft.available,
        imageUrl: draft.image.trim() || undefined,
      };
      const saved = draft.id
        ? await api<MenuItem>(`/menu/${encodeURIComponent(draft.id)}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await api<MenuItem>("/menu", { method: "POST", body: JSON.stringify(payload) });
      const item = toDish(saved);
      setMenu((items) => draft.id ? items.map((dish) => dish.id === item.id ? item : dish) : [...items, item]);
      navigate("menu");
      setNotice("บันทึกเมนูเรียบร้อยแล้ว");
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "บันทึกเมนูไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function saveTable(event: FormEvent) {
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
    setSaving(true);
    try {
      const payload = { ...tableDraft, name: tableDraft.name.trim() };
      const saved = tableDraft.id
        ? await api<RestaurantTable>(`/tables/${encodeURIComponent(tableDraft.id)}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await api<RestaurantTable>("/tables", { method: "POST", body: JSON.stringify(payload) });
      setTables((items) => tableDraft.id ? items.map((table) => table.id === saved.id ? saved : table) : [...items, saved]);
      setTableDraft(null);
      setNotice("บันทึกโต๊ะเรียบร้อยแล้ว");
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "บันทึกโต๊ะไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(dish: Dish) {
    try {
      const saved = await api<MenuItem>(`/menu/${encodeURIComponent(dish.id)}`, {
        method: "PUT",
        body: JSON.stringify({ available: !dish.available }),
      });
      const updated = toDish(saved);
      setMenu((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "เปลี่ยนสถานะเมนูไม่สำเร็จ");
    }
  }

  async function deleteDish(dish: Dish) {
    if (!window.confirm(`ลบเมนู “${dish.name}” หรือไม่?`)) return;
    try {
      await api(`/menu/${encodeURIComponent(dish.id)}`, { method: "DELETE" });
      setMenu((items) => items.filter((item) => item.id !== dish.id));
      setNotice("ลบเมนูเรียบร้อยแล้ว");
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "ลบเมนูไม่สำเร็จ");
    }
  }

  async function toggleTable(table: Table) {
    try {
      const saved = await api<RestaurantTable>(`/tables/${encodeURIComponent(table.id)}`, {
        method: "PUT",
        body: JSON.stringify({ active: !table.active }),
      });
      setTables((items) => items.map((item) => item.id === saved.id ? saved : item));
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "เปลี่ยนสถานะโต๊ะไม่สำเร็จ");
    }
  }

  async function deleteTable(table: Table) {
    try {
      await api(`/tables/${encodeURIComponent(table.id)}`, { method: "DELETE" });
      setTables((items) => items.filter((item) => item.id !== table.id));
      setTableDraft(null);
      setNotice("ลบโต๊ะเรียบร้อยแล้ว");
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "ลบโต๊ะไม่สำเร็จ");
    }
  }

  const filteredMenu = menu.filter(
    (dish) =>
      (category === "ทั้งหมด" || dish.category === category) &&
      `${dish.name} ${dish.description}`.includes(search.trim()),
  );
  const availableMenuCount = menu.filter((dish) => dish.available).length;
  const getTableUrl = (table: Table) =>
    `${origin}/menu/?table=${encodeURIComponent(table.name)}`;

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
              <span>{user?.username ?? "ผู้จัดการ"}</span>
          </span>
            <SignOutButton className={styles.signOut} />
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
        {loading ? <p role="status">กำลังโหลดข้อมูลร้าน...</p> : null}
        {view === "menu" && !loading && (
          <MenuList
            menu={menu}
            availableMenuCount={availableMenuCount}
            filteredMenu={filteredMenu}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            editDish={editDish}
            onToggleAvailability={toggleAvailability}
            onDelete={deleteDish}
          />
        )}
        {view === "tables" && !loading && (
          <TableList
            tables={tables}
            search={search}
            setSearch={setSearch}
            setPrinting={setPrinting}
            setTableDraft={setTableDraft}
            onToggle={toggleTable}
            getTableUrl={getTableUrl}
          />
        )}
        {view === "edit" && (
          <MenuEditor
            draft={draft}
            setDraft={setDraft}
            saveDish={saveDish}
            navigate={navigate}
            saving={saving}
          />
        )}
        <p className={styles.localNote}>
          ข้อมูลเมนูและโต๊ะบันทึกผ่าน API
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
                      const selectedTable = tables.find((table) => table.id === tableDraft.id);
                      if (selectedTable) void deleteTable(selectedTable);
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
