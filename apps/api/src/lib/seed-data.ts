import type { MenuItem } from "@qr-kitchen/shared";

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const seedMenuItems: MenuItem[] = [
  {
    id: "m1",
    name: "ข้าวกะเพราหมูสับ",
    description: "กะเพราหมูสับผัดร้อน ๆ ราดข้าวสวย เสิร์ฟพร้อมไข่ดาว",
    category: "จานเดียว",
    price: 89,
    available: true,
    recommended: true,
    imageUrl: photo("photo-1631515243349-e0cb75fb8d3a"),
  },
  {
    id: "m2",
    name: "ต้มยำกุ้งน้ำข้น",
    description: "กุ้งสดเต็มคำ น้ำซุปเข้มข้น หอมตะไคร้และใบมะกรูด",
    category: "กับข้าว",
    price: 159,
    available: true,
    recommended: true,
    imageUrl: photo("photo-1455619452474-d2be8b1e70cd"),
  },
  {
    id: "m3",
    name: "ข้าวผัดหมูสับ",
    description: "ข้าวผัดเม็ดร่วน หอมกระเทียมเจียว เสิร์ฟร้อนจากกระทะ",
    category: "จานเดียว",
    price: 69,
    available: true,
    recommended: true,
    imageUrl: photo("photo-1546069901-ba9599a7e63c"),
  },
  {
    id: "m4",
    name: "ชาไทยเย็น",
    description: "ชาไทยเข้มข้น หวานมันกำลังดี เสิร์ฟเย็นชื่นใจ",
    category: "เครื่องดื่ม",
    price: 45,
    available: true,
    recommended: true,
    imageUrl: photo("photo-1461023058943-07fcbe16d735"),
  },
  {
    id: "m5",
    name: "เกี๊ยวกุ้งทอด",
    description: "เกี๊ยวกุ้งกรอบนอกนุ่มใน เสิร์ฟพร้อมซอสหวานเปรี้ยว",
    category: "กับข้าว",
    price: 159,
    available: true,
    imageUrl: photo("photo-1534422298391-e4f8c172dddb"),
  },
  {
    id: "m6",
    name: "ผัดไทยกุ้งสด",
    description: "เส้นจันท์ผัดซอสกลมกล่อม กุ้งสดตัวโต ถั่วงอกสด",
    category: "จานเดียว",
    price: 89,
    available: true,
    imageUrl: photo("photo-1559314809-0d155014e29e"),
  },
];
