import type { Table } from "./admin-data";
import { QRCode } from "./qr-code";
import styles from "./admin.module.css";
import { Icon, Toggle } from "./admin-controls";

type Props = {
  tables: Table[];
  search: string;
  setSearch: (value: string) => void;
  setPrinting: (ids: string[]) => void;
  setTableDraft: (table: Table) => void;
  onToggle: (table: Table) => void;
  getTableUrl: (table: Table) => string;
};

export function TableList({
  tables,
  search,
  setSearch,
  setPrinting,
  setTableDraft,
  onToggle,
  getTableUrl,
}: Props) {
  const filteredTables = tables.filter((table) =>
    table.name.includes(search.trim()),
  );

  function downloadQRCode(table: Table) {
    const svg = document.getElementById(`qr-${table.id}`);
    if (!svg) return;

    const file = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `table-${table.name}.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <div className={styles.banner}>
        <Icon name="qr" size={25} />
        <div>
          <strong>
            พร้อมให้บริการ {tables.filter((table) => table.active).length} โต๊ะ
          </strong>
          <p>ดาวน์โหลด QR Code ไปวางที่โต๊ะของร้าน</p>
        </div>
        <button
          className={styles.secondary}
          disabled={!tables.length}
          onClick={() => setPrinting(tables.map((table) => table.id))}
        >
          <Icon name="print" size={16} />
          พิมพ์ป้ายทุกโต๊ะ
        </button>
      </div>
      <div className={styles.tableHeading}>
        <h2>
          โต๊ะทั้งหมด <span>{tables.length}</span>
        </h2>
        <label className={styles.search}>
          <Icon name="search" size={15} />
          <input
            aria-label="ค้นหาโต๊ะ"
            placeholder="ค้นหาเลขโต๊ะ"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      <div className={styles.tableGrid}>
        {filteredTables.map((table) => (
          <article key={table.id} className={styles.tableCard}>
            <div className={styles.cardHeading}>
              <h3>
                <Icon name="table" size={17} />
                โต๊ะ {table.name}
              </h3>
              <button
                aria-label={`แก้ไขโต๊ะ ${table.name}`}
                onClick={() => setTableDraft({ ...table })}
              >
                <Icon name="edit" size={15} />
              </button>
            </div>
            <div className={styles.tableMeta}>
              <span>{table.seats} ที่นั่ง</span>
              <label>
                {table.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                <Toggle
                  checked={table.active}
                  label={`เปิดใช้งานโต๊ะ ${table.name}`}
                  onChange={() => onToggle(table)}
                />
              </label>
            </div>
            <div className={styles.qrBox}>
              <QRCode value={getTableUrl(table)} id={`qr-${table.id}`} />
              <small>สั่งอร่อย QR · โต๊ะ {table.name}</small>
            </div>
            <a
              className={styles.customerLink}
              href={getTableUrl(table)}
              target="_blank"
              rel="noreferrer"
            >
              ดูเมนูสำหรับโต๊ะ {table.name} ↗
            </a>
            <div className={styles.cardButtons}>
              <button onClick={() => downloadQRCode(table)}>
                <Icon name="download" size={14} />
                ดาวน์โหลด
              </button>
              <button onClick={() => setPrinting([table.id])}>
                <Icon name="print" size={14} />
                พิมพ์
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filteredTables.length && (
        <p className={styles.empty}>ไม่พบโต๊ะที่ค้นหา</p>
      )}
      <p className={styles.footnote}>
        <Icon name="info" size={14} />
        QR Code เชื่อมหน้าเมนูพร้อมเลขโต๊ะ · สถานะเปิดปิดบันทึกไว้ในเครื่องนี้
      </p>
    </>
  );
}
