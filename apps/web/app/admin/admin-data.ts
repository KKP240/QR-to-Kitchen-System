export type Dish = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  image: string;
};
export type Table = {
  id: string;
  name: string;
  seats: number;
  active: boolean;
};
export const categories = ["ทั้งหมด", "จานเดียว", "กับข้าว", "เครื่องดื่ม"];
const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=85`;
export const initialMenu: Dish[] = [
  {
    id: "1",
    name: "ข้าวกะเพราหมูสับไข่ดาว",
    description: "กะเพราหอม ๆ ผัดสดทุกจาน",
    category: "จานเดียว",
    price: 89,
    available: true,
    image: photo("photo-1569562211093-4ed0d0758f12"),
  },
  {
    id: "2",
    name: "ข้าวไก่กระเทียม",
    description: "ไก่นุ่ม หอมกระเทียมเจียว",
    category: "จานเดียว",
    price: 79,
    available: true,
    image: photo("photo-1512058564366-18510be2db19"),
  },
  {
    id: "3",
    name: "ข้าวไข่เจียวหมูสับ",
    description: "ไข่เจียวกรอบนอก นุ่มข้างใน",
    category: "จานเดียว",
    price: 69,
    available: true,
    image: photo("photo-1512058564366-18510be2db19"),
  },
  {
    id: "4",
    name: "ต้มยำกุ้งน้ำข้น",
    description: "กุ้งเต็มคำ รสจัดจ้านถึงเครื่อง",
    category: "กับข้าว",
    price: 159,
    available: true,
    image: photo("photo-1548943487-a2e4e43b4853"),
  },
  {
    id: "5",
    name: "ชาไทยเย็น",
    description: "ชาเข้ม หวานมัน กำลังดี",
    category: "เครื่องดื่ม",
    price: 45,
    available: true,
    image: photo("photo-1558857563-b371033873b8"),
  },
  {
    id: "6",
    name: "มะนาวโซดา",
    description: "มะนาวสด ซ่า สดชื่น",
    category: "เครื่องดื่ม",
    price: 40,
    available: false,
    image: photo("photo-1513558161293-cdaf765edfd7"),
  },
];
export const initialTables: Table[] = Array.from({ length: 8 }, (_, index) => ({
  id: String(index + 1),
  name: String(index + 1).padStart(2, "0"),
  seats: index === 1 || index === 6 ? 2 : 4,
  active: true,
}));
export const emptyDish: Dish = {
  id: "",
  name: "",
  description: "",
  category: "จานเดียว",
  price: 0,
  available: true,
  image: initialMenu[0].image,
};
