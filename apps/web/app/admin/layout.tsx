import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จัดการร้าน | ใบกะเพรา",
  description:
    "จัดการเมนูอาหาร ราคา โต๊ะ และ QR Code สำหรับเจ้าของร้านใบกะเพรา",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div lang="th">{children}</div>;
}
