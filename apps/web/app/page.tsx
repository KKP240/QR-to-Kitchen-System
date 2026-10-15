import type { OrderStatus } from "@qr-kitchen/shared";

const status: OrderStatus = "pending";

export default function Home() {
  return (
    <main>
      <h1>QR-to-Kitchen System</h1>
      <p>shared types ทำงานปกติ (ตัวอย่างสถานะ: {status})</p>
      <ul>
        <li><a href="/menu/">หน้าลูกค้า</a></li>
        <li><a href="/kitchen/">จอครัว</a></li>
        <li><a href="/admin/">หลังบ้าน</a></li>
      </ul>
    </main>
  );
}