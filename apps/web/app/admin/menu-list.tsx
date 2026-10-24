import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import { categories, type Dish } from "./admin-data";
import styles from "./admin.module.css";
import { Icon, Toggle } from "./admin-controls";

type Props = {
  menu: Dish[];
  availableMenuCount: number;
  filteredMenu: Dish[];
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  editDish: (dish: Dish) => void;
  setMenu: Dispatch<SetStateAction<Dish[]>>;
};

export function MenuList({
  menu,
  availableMenuCount,
  filteredMenu,
  search,
  setSearch,
  category,
  setCategory,
  editDish,
  setMenu,
}: Props) {
  function toggleAvailability(dishId: string) {
    setMenu(
      menu.map((dish) =>
        dish.id === dishId ? { ...dish, available: !dish.available } : dish,
      ),
    );
  }

  function deleteDish(dish: Dish) {
    if (!window.confirm(`ลบเมนู “${dish.name}” หรือไม่?`)) return;
    setMenu(menu.filter((menuItem) => menuItem.id !== dish.id));
  }

  return (
    <>
      <div className={styles.stats}>
        {[
          { title: "เมนูทั้งหมด", count: menu.length, icon: "menu" },
          {
            title: "พร้อมเปิดครัวสั่ง",
            count: availableMenuCount,
            icon: "check",
          },
          {
            title: "หมดชั่วคราว",
            count: menu.length - availableMenuCount,
            icon: "info",
          },
        ].map((stat, index) => (
          <div className={styles.stat} key={stat.title}>
            <span className={index === 2 ? styles.orange : ""}>
              <Icon name={stat.icon} size={23} />
            </span>
            <div>
              <p>{stat.title}</p>
              <strong>{stat.count}</strong>
              <small>เมนู</small>
            </div>
          </div>
        ))}
      </div>
      <section className={styles.menuPanel} aria-label="รายการเมนู">
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <Icon name="search" size={16} />
            <input
              aria-label="ค้นหาเมนู"
              placeholder="ค้นหาชื่ออาหารหรือเครื่องดื่ม"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className={styles.tabs}>
            {categories.map((categoryName) => (
              <button
                key={categoryName}
                className={category === categoryName ? styles.activeTab : ""}
                onClick={() => setCategory(categoryName)}
              >
                {categoryName}{" "}
                <span>
                  {categoryName === "ทั้งหมด"
                    ? menu.length
                    : menu.filter((dish) => dish.category === categoryName)
                        .length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.menuTable}>
            <thead>
              <tr>
                <th>ชื่อเมนู</th>
                <th>หมวดหมู่</th>
                <th>ราคา (บาท)</th>
                <th>สถานะการขาย</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenu.map((dish) => (
                <tr key={dish.id}>
                  <td>
                    <div className={styles.dish}>
                      <Image
                        src={dish.image}
                        width={52}
                        height={52}
                        alt={dish.name}
                        unoptimized
                      />
                      <div>
                        <strong>{dish.name}</strong>
                        <p>{dish.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.tag}>{dish.category}</span>
                  </td>
                  <td className={styles.price}>
                    ฿{dish.price.toLocaleString("th-TH")}
                  </td>
                  <td>
                    <div className={styles.availability}>
                      <Toggle
                        checked={dish.available}
                        label={`สถานะการขาย ${dish.name}`}
                        onChange={() => toggleAvailability(dish.id)}
                      />
                      <span>{dish.available ? "พร้อมขาย" : "หมดชั่วคราว"}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => editDish(dish)}>
                        <Icon name="edit" size={15} />
                        แก้ไข
                      </button>
                      <details>
                        <summary aria-label={`ตัวเลือก ${dish.name}`}>
                          ···
                        </summary>
                        <button onClick={() => deleteDish(dish)}>ลบเมนู</button>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredMenu.length && (
          <p className={styles.empty}>
            ไม่พบเมนูที่ค้นหา ลองเปลี่ยนคำค้นหรือเพิ่มเมนูใหม่
          </p>
        )}
        <footer className={styles.panelFooter}>
          <span>
            แสดง {filteredMenu.length ? "1–" + filteredMenu.length : "0"} จาก{" "}
            {filteredMenu.length} เมนู
          </span>
          <span className={styles.pagination}>
            ‹ <b>1</b> ›
          </span>
        </footer>
      </section>
      <p className={styles.footnote}>
        <Icon name="info" size={14} />
        เมนูที่หมดชั่วคราวจะยังคงอยู่ในรายการ และเปิดขายอีกครั้งได้ทุกเมื่อ
      </p>
    </>
  );
}
