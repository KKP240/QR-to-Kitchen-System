# QR-to-Kitchen System

ระบบสั่งอาหารผ่าน QR Code และแสดงรายการอาหารบนจอในครัวแบบ Real Time
พัฒนาเป็นส่วนหนึ่งของรายวิชา **Cloud Application** บน **AWS Academy Learner Lab**
สถาปัตยกรรมเป็น **Serverless** (ไม่มีเซิร์ฟเวอร์ที่ต้องดูแลหรือรันค้างไว้)

---

## สารบัญ

1. [โปรเจกต์นี้คืออะไร](#1-โปรเจกต์นี้คืออะไร)
2. [สถาปัตยกรรม](#2-สถาปัตยกรรม)
3. [สถานะปัจจุบัน (ทำอะไรไปแล้ว / ยังไม่ได้ทำ)](#3-สถานะปัจจุบัน)
4. [โครงสร้างโฟลเดอร์](#4-โครงสร้างโฟลเดอร์)
5. [สิ่งที่ต้องติดตั้งก่อน](#5-สิ่งที่ต้องติดตั้งก่อน)
6. [เริ่มต้นใช้งาน: เลือกเส้นทางของคุณ](#6-เริ่มต้นใช้งาน-เลือกเส้นทางของคุณ)
7. [เส้นทาง A: พัฒนาบนเครื่อง (ไม่ต้องใช้ AWS)](#7-เส้นทาง-a-พัฒนาบนเครื่อง-ไม่ต้องใช้-aws)
8. [เส้นทาง B: Deploy ขึ้น AWS บัญชีของคุณเอง](#8-เส้นทาง-b-deploy-ขึ้น-aws-บัญชีของคุณเอง)
9. [คู่มือสำหรับ Frontend](#9-คู่มือสำหรับ-frontend)
10. [คู่มือสำหรับ Backend](#10-คู่มือสำหรับ-backend)
11. [ข้อจำกัดของ AWS Academy Learner Lab (ต้องอ่าน)](#11-ข้อจำกัดของ-aws-academy-learner-lab-ต้องอ่าน)
12. [การทำงานร่วมกันเป็นทีม และการ commit](#12-การทำงานร่วมกันเป็นทีมและการ-commit)
13. [การแบ่งงานที่แนะนำสำหรับทีม 5 คน](#13-การแบ่งงานที่แนะนำสำหรับทีม-5-คน)
14. [แก้ปัญหาเบื้องต้น (Troubleshooting)](#14-แก้ปัญหาเบื้องต้น-troubleshooting)
15. [การลบ resource เมื่อเลิกใช้](#15-การลบ-resource-เมื่อเลิกใช้)
16. [Roadmap](#16-roadmap)

---

## 1. โปรเจกต์นี้คืออะไร

**ลูกค้า**
- สแกน QR Code ที่โต๊ะ → เปิดหน้าเมนู (รู้เลขโต๊ะอัตโนมัติจากลิงก์)
- เลือกรายการอาหาร → กดสั่งซื้อ

**ครัว**
- มีหน้าจอแสดงออเดอร์ที่ลูกค้าสั่งเข้ามา (อัปเดตอัตโนมัติ)
- เปลี่ยนสถานะออเดอร์ได้: `pending → cooking → ready → served`

**เจ้าของร้าน (หลังบ้าน)**
- จัดการเมนูและราคาอาหาร
- จัดการโต๊ะและ QR Code ประจำโต๊ะ

**ตัวอย่างลิงก์ใน QR Code:** `https://<โดเมนเว็บ>/menu/?table=5`

---

## 2. สถาปัตยกรรม

```
ลูกค้า / ครัว / เจ้าของร้าน (เบราว์เซอร์)
        │ HTTPS
        ▼
CloudFront ──► S3 (ไฟล์ static ของ Next.js)        ← หน้าเว็บ
        │
        │ fetch (JSON)
        ▼
Lambda Function URL ──► Lambda "ApiFunction" (router ตัวเดียว)
                              │
                              ▼
                         DynamoDB (Menu, Orders, Tables, Connections)
```

| ส่วน | เทคโนโลยี | หมายเหตุ |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript | **Static export** เท่านั้น (ดูข้อ 9) |
| Hosting | S3 (private) + CloudFront (HTTPS) | สร้างผ่าน `infra/web-hosting.yaml` |
| Backend | AWS Lambda (Node.js 22) ตัวเดียว + router ในโค้ด | เข้าถึงผ่าน **Lambda Function URL** |
| Database | DynamoDB (on-demand) | 4 ตาราง |
| Real Time | **Polling** (จอครัวเรียก `GET /orders` ทุก 2-3 วินาที) | ตัวเลือกอนาคต: AWS IoT Core |
| IaC | AWS SAM / CloudFormation | โฟลเดอร์ `infra/` |
| Dev (เครื่อง) | Docker (DynamoDB Local) | ใช้เฉพาะตอนพัฒนา ไม่ได้ใช้รันจริง |
| Monorepo | pnpm workspaces | `apps/*`, `packages/*` |

**ทำไมไม่ใช้ API Gateway / Amplify:** Learner Lab บล็อกบริการเหล่านี้ (ดูข้อ 11) จึงใช้ Lambda Function URL แทน และใช้ S3 + CloudFront แทน Amplify

**ทำไม Lambda ตัวเดียว:** เพิ่ม endpoint ใหม่ได้โดยไม่ต้องแก้ `infra/template.yaml` และทุกคนในทีมแก้คนละไฟล์ใน `apps/api/src/routes/` ได้โดยไม่ชนกัน

---

## 3. สถานะปัจจุบัน

| ส่วน | สถานะ |
|---|---|
| Monorepo (pnpm workspace), shared types | ✅ เสร็จ |
| Next.js static export + หน้า `/`, `/menu`, `/kitchen`, `/admin` | ✅ โครงเสร็จ (หน้า `/menu` ดึงเมนูจริงจาก API แล้ว ส่วน `/kitchen` และ `/admin` ยังเป็นหน้าเปล่า) |
| API router + `GET /health`, `GET /menu` | ✅ ใช้งานได้ |
| API Auth + roles (`customer`, `kitchen`, `manager`) | ✅ JWT login และจำกัดสิทธิ์ตาม endpoint |
| API: `POST/GET /orders`, `PATCH /orders/:id/status` | ✅ ใช้งานได้ (ต้อง login ตาม role) |
| API: `POST/PUT/DELETE /menu` | ✅ ผู้จัดการเท่านั้น |
| API: `/tables` | 🔲 ตรวจ role ผู้จัดการแล้ว แต่การจัดการข้อมูลยังตอบ `501` |
| DynamoDB 4 ตาราง (deploy บน AWS) | ✅ เสร็จ |
| Local dev: Docker DynamoDB Local + local API server | ✅ เสร็จ |
| Hosting S3 + CloudFront + สคริปต์ `web:deploy` | ✅ เสร็จ (ทดสอบเปิดจากมือถือแล้ว) |
| สคริปต์ตั้ง credentials / deploy อัตโนมัติ (ไม่ต้องแก้ Account ID) | ✅ เสร็จ |
| Auth เจ้าของร้าน (Cognito) | ⏸ ข้ามไว้ก่อน: มีไฟล์ `infra/auth.yaml` แต่ deploy ยังไม่สำเร็จ ยังไม่ได้ตรวจสาเหตุ |
| ระบบออเดอร์ + จอครัว | 🔲 ยังไม่ทำ |
| QR Code generator ในหลังบ้าน | 🔲 ยังไม่ทำ |

> API ยังเป็นงานพัฒนา: การจัดการโต๊ะยังไม่ implement และไม่มีการสมัครสมาชิกผ่าน HTTP; สร้างบัญชีผ่านคำสั่ง local ด้านล่าง

---

## 4. โครงสร้างโฟลเดอร์

```
QR-to-Kitchen-System/
├── apps/
│   ├── web/                      # FRONTEND (Next.js)
│   │   ├── app/
│   │   │   ├── page.tsx          # หน้าแรก (ลิงก์ไปหน้าอื่น)
│   │   │   ├── menu/page.tsx     # หน้าลูกค้า (?table=เลขโต๊ะ)
│   │   │   ├── kitchen/page.tsx  # จอครัว
│   │   │   └── admin/page.tsx    # หลังบ้านเจ้าของร้าน
│   │   ├── lib/api.ts            # ฟังก์ชันเรียก API (ใช้ตัวนี้ทุกที่)
│   │   ├── .env.example          # ตัวอย่างค่า env (commit ได้)
│   │   └── .env.local            # ค่า env ของคุณเอง (ห้าม commit)
│   └── api/                      # BACKEND (Lambda)
│       └── src/
│           ├── index.ts          # จุดเข้าของ Lambda
│           ├── router.ts         # จับคู่ method + path -> handler
│           ├── routes/           # ไฟล์ route แยกตาม domain
│           │   ├── index.ts      # รวมทุก route (เพิ่มไฟล์ใหม่ต้องลงทะเบียนที่นี่)
│           │   ├── health.ts
│           │   ├── menu.ts
│           │   ├── orders.ts
│           │   └── tables.ts
│           ├── lib/              # config, dynamo client, response, types, seed-data
│           ├── handlers/seed.ts  # Lambda สำหรับใส่เมนูตัวอย่าง (ช่วงพัฒนา)
│           └── local/            # เครื่องมือรันบนเครื่องเท่านั้น (ห้ามถูก import จาก routes)
│               ├── server.ts     # local API server (พอร์ต 4000)
│               ├── env.ts        # ชี้ไป DynamoDB Local
│               ├── create-tables.ts
│               └── seed.ts
├── packages/
│   └── shared/src/index.ts       # TypeScript types ที่ web และ api ใช้ร่วมกัน
├── infra/                        # โครงสร้าง AWS (ผู้ดูแลโครงสร้างเท่านั้นที่แก้)
│   ├── template.yaml             # API Lambda + Function URL + DynamoDB (SAM)
│   ├── web-hosting.yaml          # S3 + CloudFront
│   ├── auth.yaml                 # Cognito (ยังไม่เสร็จ)
│   └── samconfig.toml            # ค่า deploy ของ SAM
├── scripts/
│   ├── set-aws-credentials.ps1   # วาง credentials จาก clipboard ลงเครื่อง
│   ├── deploy.bat                # build + deploy backend
│   └── deploy-web.bat            # build + upload หน้าเว็บ
├── docker-compose.yml            # DynamoDB Local + dynamodb-admin
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

### ส่วนไหนแตะได้ / ห้ามแตะ

| โฟลเดอร์/ไฟล์ | ใครแก้ได้ |
|---|---|
| `apps/web/**` | ทีม Frontend |
| `apps/api/src/routes/**`, `apps/api/src/lib/**` | ทีม Backend (แก้คนละไฟล์ route ตาม domain) |
| `packages/shared/**` | แก้ได้ แต่ต้องแจ้งทีม เพราะกระทบทั้ง web และ api |
| `infra/**`, `scripts/**`, `docker-compose.yml` | **ผู้ดูแลโครงสร้างคนเดียว** ถ้าต้องการเปลี่ยนให้เปิด Issue หรือแจ้งก่อน |
| `apps/api/src/local/**` | แก้ได้เมื่อจำเป็นเฉพาะการพัฒนาบนเครื่อง |

---

## 5. สิ่งที่ต้องติดตั้งก่อน

| เครื่องมือ | เวอร์ชัน | ตรวจสอบ | จำเป็นสำหรับ |
|---|---|---|---|
| Node.js | **20.9 ขึ้นไป** (แนะนำ 22) | `node -v` | ทุกคน |
| pnpm | ล่าสุด | `pnpm -v` | ทุกคน (`npm install -g pnpm`) |
| Git | ล่าสุด | `git --version` | ทุกคน |
| Docker Desktop | ล่าสุด | `docker --version` | พัฒนา backend บนเครื่อง |
| AWS CLI v2 | ล่าสุด | `aws --version` | เฉพาะคนที่จะ deploy |
| AWS SAM CLI | ล่าสุด | `sam --version` | เฉพาะคนที่จะ deploy |

**Windows:** ติดตั้งผ่าน winget ได้ (`winget install Amazon.AWSCLI`, `winget install Amazon.SAM-CLI`) แล้ว **ปิดและเปิด Command Prompt ใหม่**

> สคริปต์ใน `scripts/` (`.bat`, `.ps1`) เขียนสำหรับ **Windows** ถ้าใช้ macOS/Linux ให้ใช้คำสั่งแบบ manual ในข้อ 8.7

**Frontend อย่างเดียวไม่จำเป็นต้องมี AWS CLI / SAM CLI** (ดูเส้นทาง A และข้อ 9)

---

## 6. เริ่มต้นใช้งาน: เลือกเส้นทางของคุณ

| บทบาท | ทำอะไร | ต้องมีบัญชี AWS ไหม |
|---|---|---|
| **Frontend** | แก้โค้ดใน `apps/web` | ไม่ต้อง (ใช้ API บนเครื่อง หรือใช้ URL ของเพื่อน) |
| **Backend** | แก้โค้ดใน `apps/api` | ไม่ต้องสำหรับพัฒนา แต่ต้องมีเพื่อน deploy ทดสอบบน AWS จริง |
| **ผู้ดูแลโครงสร้าง** | แก้ `infra/`, deploy | ต้อง (AWS Academy Learner Lab) |

ทุกคนเริ่มจาก clone และติดตั้ง dependencies:

```bat
git clone https://github.com/KKP240/QR-to-Kitchen-System.git
cd QR-to-Kitchen-System
pnpm install
```

ถ้า `pnpm install` ขึ้น `ERR_PNPM_IGNORED_BUILDS` ไม่ต้องกังวล (ดูข้อ 14)

---

## 7. เส้นทาง A: พัฒนาบนเครื่อง (ไม่ต้องใช้ AWS)

เปิด Command Prompt **3 หน้าต่าง** ที่โฟลเดอร์โปรเจกต์

### 7.1 เปิดฐานข้อมูลจำลอง (Docker)

เปิด Docker Desktop ให้ทำงานอยู่ก่อน แล้วรัน:

```bat
docker compose up -d
pnpm --filter @qr-kitchen/api run db:create
pnpm --filter @qr-kitchen/api run db:seed
```

- `db:create` สร้างตาราง 4 ตาราง
- `db:seed` ใส่เมนูตัวอย่าง 3 รายการ
- ดูข้อมูลในตารางได้ที่ http://localhost:8001 (dynamodb-admin)
- ข้อมูลเป็นแบบ **in-memory** ถ้า `docker compose down` หรือปิด Docker ข้อมูลจะหาย ต้องรัน `db:create` และ `db:seed` ใหม่ (ตั้งใจไว้)
- ถ้า `db:create` ขึ้น `socket hang up` แปลว่า DynamoDB ยังบูตไม่เสร็จ รอ 5-10 วินาทีแล้วรันใหม่

### 7.2 เปิด API บนเครื่อง (หน้าต่างที่ 2)

```bat
pnpm --filter @qr-kitchen/api run dev
```

ทดสอบ:
- http://localhost:4000/health → `{"status":"ok", ...}`
- http://localhost:4000/menu → เมนู 3 รายการ
- http://localhost:4000/orders → `401 Unauthorized` หากไม่ส่ง Bearer token

### 7.3 ทดสอบ Auth และ role ด้วย Postman

หลังจากสร้าง DynamoDB tables แล้ว ให้เปิด API ตามข้อ 7.2 และสร้างบัญชีทดสอบในหน้าต่างใหม่:

```bat
pnpm --filter @qr-kitchen/api run admin:create customer01 password123 customer
pnpm --filter @qr-kitchen/api run admin:create kitchen01 password123 kitchen
pnpm --filter @qr-kitchen/api run admin:create manager01 password123 manager
```

`admin:create` ต้องการรหัสผ่านอย่างน้อย 8 ตัว และถ้าไม่ระบุ role จะสร้าง `manager` (บัญชีเก่าที่ใช้ role `owner` ให้สร้างซ้ำด้วย role `manager`)

ใน Postman สร้าง request `POST http://localhost:4000/auth/login` โดยเลือก **Body → raw → JSON**:

```json
{"username":"customer01","password":"password123"}
```

ทำซ้ำโดยเปลี่ยน username เพื่อ login เป็น role อื่น จาก response เก็บค่า `token` แล้วเปิด **Authorization → Bearer Token** ใน request ถัดไป (หรือใส่ header `Authorization: Bearer <token>`). ตรวจ token ด้วย `GET http://localhost:4000/auth/me` ซึ่งควรคืน username และ role ที่ login ไว้

ลองตรวจสิทธิ์ตามนี้:

| Request | Token | ผลที่คาดหวัง |
|---|---|---|
| `GET /orders` โดยไม่ใส่ token | ไม่มี | `401 Unauthorized` |
| `POST /orders` พร้อม `{"tableId":"5","items":[{"menuItemId":"m1","quantity":1}]}` | customer | `201 Created` |
| `GET /orders` | kitchen หรือ manager | `200 OK` พร้อมรายการออเดอร์ |
| `PATCH /orders/<id>/status` พร้อม `{"status":"cooking"}` | kitchen หรือ manager | `200 OK` และสถานะเปลี่ยน |
| `POST /menu` พร้อม `{"name":"ข้าวผัด","price":65}` | customer หรือ kitchen | `403 Forbidden` |
| `POST /menu` พร้อม body เดียวกัน | manager | `201 Created` |
| `GET /tables` | manager | `501 Not Implemented` (ผ่าน auth แล้ว แต่ route ยังไม่ implement) |

สิทธิ์โดยสรุป: `customer` สั่งอาหาร, `kitchen` ดูรายการและเปลี่ยนสถานะออเดอร์, `manager` จัดการเมนู/โต๊ะและเข้าถึงงานออเดอร์ทั้งหมด ส่วน `GET /menu` และ `GET /health` เป็น public

### 7.4 ตั้งค่าและเปิดหน้าเว็บ (หน้าต่างที่ 3)

สร้างไฟล์ `apps/web/.env.local` (copy จาก `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

แล้วรัน:

```bat
pnpm --filter @qr-kitchen/web dev
```

เปิด http://localhost:3000/menu/?table=5 ต้องเห็น **โต๊ะ: 5** และเมนู 3 รายการ

> หลังแก้ `.env.local` ต้องหยุด (Ctrl+C) แล้วรัน `pnpm dev` ใหม่ Next.js อ่านค่า env ตอนเริ่มเท่านั้น

### 7.5 ตรวจความถูกต้องของโค้ด

```bat
pnpm --filter @qr-kitchen/api run typecheck
pnpm --filter @qr-kitchen/web build
```

`web build` สำเร็จแปลว่า static export ผ่าน (ผลลัพธ์อยู่ที่ `apps/web/out`)

### 7.6 ถ้าไม่อยากรัน Docker/API เอง (Frontend)

ให้ผู้ดูแลโครงสร้างส่ง **API URL บน AWS** มา แล้วใส่ใน `.env.local`:

```
NEXT_PUBLIC_API_URL=https://xxxxxxxx.lambda-url.us-east-1.on.aws
```

CORS เปิดไว้แล้ว (`*`) จึงเรียกจาก `localhost:3000` ได้ ข้อควรระวัง: URL นี้ผูกกับบัญชี AWS ของเจ้าของ และ Lab ต้องกำลังรันอยู่/ข้อมูลยังไม่ถูกรีเซ็ต

---

## 8. เส้นทาง B: Deploy ขึ้น AWS บัญชีของคุณเอง

ทำเมื่อต้องการทดสอบบน AWS จริง **แต่ละคนใช้บัญชี Learner Lab ของตัวเอง** ได้โดยไม่ต้องแก้ไฟล์ใดเลย (Account ID ถูกดึงอัตโนมัติ)

### 8.1 เริ่ม Lab และตั้ง credentials

ต้องทำ **ทุกครั้งที่ Start Lab** เพราะ credentials เปลี่ยนใหม่ทุกครั้ง

1. เข้า AWS Academy → เปิด Learner Lab → กด **Start Lab** รอจนไฟสถานะเป็นสีเขียว
2. กด **AWS Details** → ที่ **AWS CLI** กด **Show**
3. **Copy ทั้งบล็อก** (เริ่มจาก `[default]` ถึง `aws_session_token`)
4. รัน:

```bat
pnpm aws:creds
pnpm aws:whoami
```

`aws:whoami` ต้องแสดง JSON ที่มี `Account` และ `Arn` (มี `voclabs`) ถ้าขึ้น `ExpiredToken` หรือ `NoCredentials` ให้ copy ใหม่แล้วรันซ้ำ

> 🔒 **credentials ห้ามส่งในแชท ห้ามใส่ในโค้ด ห้าม commit** สคริปต์เขียนลง `C:\Users\<ชื่อ>\.aws\` ซึ่งอยู่นอกโปรเจกต์

### 8.2 Deploy Backend (API + DynamoDB)

```bat
pnpm run deploy
```

> ต้องใช้ `pnpm run deploy` (ไม่ใช่ `pnpm deploy`) เพราะ `pnpm deploy` เป็นคำสั่งในตัวของ pnpm

สิ่งที่เกิดขึ้น: สร้าง stack ชื่อ `qr-kitchen` ประกอบด้วย Lambda API, Function URL, DynamoDB 4 ตาราง, SeedFunction ครั้งแรกใช้เวลา 2-5 นาที

ดู URL ของ API:

```bat
aws cloudformation describe-stacks --stack-name qr-kitchen --query "Stacks[0].Outputs" --output table --region us-east-1
```

- ถ้าขึ้น `No changes to deploy` ถือว่าปกติ (ของบน AWS ตรงกับโค้ดแล้ว)

### 8.3 ใส่เมนูตัวอย่างลง DynamoDB บน AWS

เครื่องของเรา (`voclabs`) เขียน DynamoDB ตรง ๆ ไม่ได้ ต้องให้ Lambda (`LabRole`) เขียนให้:

```bat
aws lambda list-functions --query "Functions[].FunctionName" --output text --region us-east-1
aws lambda invoke --function-name <ชื่อที่ขึ้นต้นด้วย qr-kitchen-SeedFunction-> --region us-east-1 seed-out.json
type seed-out.json
```

ต้องเห็น `"seeded":3` แล้วเปิด `<ApiUrl>menu` จะได้เมนู 3 รายการ
(ลบไฟล์ `seed-out.json` ทิ้งหลังใช้ อย่า commit)

### 8.4 Deploy หน้าเว็บ (S3 + CloudFront)

```bat
pnpm run web:deploy
```

สคริปต์จะ: สร้าง stack `qr-kitchen-web` (ครั้งแรก) → build Next.js โดยชี้ API ของ stack `qr-kitchen` → อัปโหลดขึ้น S3 → ล้าง cache CloudFront → แสดง URL ตอนท้าย เช่น `https://xxxx.cloudfront.net`

> ต้อง deploy backend (ข้อ 8.2) ก่อนเสมอ เพราะหน้าเว็บต้องรู้ API URL
> ครั้งแรกใช้เวลา 3-10 นาที (CloudFront สร้างช้า) ถ้าเปิดแล้วเจอ 403 รอ 1-2 นาทีแล้วลองใหม่

เปิด `https://xxxx.cloudfront.net/menu/?table=5` ทดสอบ (ใช้เปิดจากมือถือได้)

### 8.5 ลำดับสรุป (บัญชีใหม่ / Lab ถูกรีเซ็ต)

```
Start Lab → pnpm aws:creds → pnpm run deploy → invoke SeedFunction → pnpm run web:deploy
```

### 8.6 deploy ซ้ำเมื่อแก้โค้ด

| แก้อะไร | รันอะไร |
|---|---|
| โค้ดใน `apps/api` หรือ `infra/template.yaml` | `pnpm run deploy` |
| โค้ดใน `apps/web` | `pnpm run web:deploy` |

### 8.7 สำหรับ macOS/Linux (คำสั่ง manual แทนสคริปต์)

```bash
# 1) วาง credentials ที่ ~/.aws/credentials และ ~/.aws/config (region = us-east-1) ด้วยตัวเอง
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 2) Backend
cd infra
sam build
sam deploy --role-arn arn:aws:iam::$ACCOUNT_ID:role/LabRole --no-fail-on-empty-changeset
cd ..

# 3) Web
aws cloudformation deploy --template-file infra/web-hosting.yaml --stack-name qr-kitchen-web \
  --role-arn arn:aws:iam::$ACCOUNT_ID:role/LabRole --no-fail-on-empty-changeset --region us-east-1
# แล้วอ่านค่า ApiUrl / BucketName / DistributionId จาก describe-stacks
# ตั้ง NEXT_PUBLIC_API_URL=<ApiUrl> แล้ว pnpm --filter @qr-kitchen/web build
# aws s3 sync apps/web/out s3://<BucketName> --delete
# aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

(`sam build` อาจต้องหา `esbuild` ให้เจอ ถ้าไม่เจอให้ `npm install -g esbuild`)

---

## 9. คู่มือสำหรับ Frontend

### 9.1 ทำงานตรงไหน

| หน้า | ไฟล์ | ผู้ใช้ | สิ่งที่ต้องทำ |
|---|---|---|---|
| `/menu/?table=N` | `apps/web/app/menu/page.tsx` | ลูกค้า | ✅ แสดงเมนูแล้ว → เพิ่มตะกร้า, ปรับจำนวน, ปุ่มสั่ง (`POST /orders`), หน้ายืนยัน/สถานะออเดอร์ |
| `/kitchen/` | `apps/web/app/kitchen/page.tsx` | ครัว | 🔲 แสดงออเดอร์ที่ polling จาก `GET /orders` ทุก 2-3 วินาที, ปุ่มเปลี่ยนสถานะ (`PATCH /orders/:id/status`) |
| `/admin/` | `apps/web/app/admin/page.tsx` | เจ้าของร้าน | 🔲 จัดการเมนู/ราคา, จัดการโต๊ะ, สร้าง QR Code ของแต่ละโต๊ะ (หน้านี้ต้องมี login ภายหลัง) |

สร้างหน้าใหม่ให้ทำโฟลเดอร์ใหม่ใต้ `apps/web/app/` เช่น `app/order-status/page.tsx` และ **ต้องมี URL แบบ `/xxx/` ที่ลงท้ายด้วย `/`**

### 9.2 เรียก API: ใช้ `apps/web/lib/api.ts` เสมอ

```tsx
import { api } from "@/lib/api";
import type { MenuItem, Order } from "@qr-kitchen/shared";

const { items } = await api<{ items: MenuItem[] }>("/menu");

const order = await api<Order>("/orders", {
  method: "POST",
  body: JSON.stringify({ tableId: "5", items: [{ menuItemId: "m1", quantity: 2 }] }),
});
```

อย่า `fetch` URL ตรง ๆ และอย่าฝัง URL ไว้ในโค้ด ค่า API มาจาก `NEXT_PUBLIC_API_URL`

### 9.3 กฎสำคัญของ Static Export (ฝ่าฝืนแล้ว build จะพัง)

เว็บถูก host เป็นไฟล์ static บน S3 ไม่มี Node server ดังนั้น **ห้าม**:

- ❌ API Routes ของ Next.js (`app/api/...`) และ `middleware.ts`
- ❌ Server Components ที่ดึงข้อมูลตอน request (ข้อมูลทั้งหมดต้องดึงจากเบราว์เซอร์)
- ❌ Dynamic route ที่ไม่รู้ค่าล่วงหน้า เช่น `app/menu/[table]/page.tsx` → ให้ใช้ **query string** แทน (`/menu/?table=5`)
- ❌ `next/image` แบบ optimize (ตั้ง `unoptimized` ไว้แล้ว)

**ต้อง**:

- ✅ ใส่ `"use client";` บนสุดของหน้าที่ใช้ `useState`, `useEffect`, `fetch`
- ✅ อ่าน query string ใน `useEffect`: `new URLSearchParams(window.location.search).get("table")`
- ✅ ถ้าใช้ `useSearchParams()` ต้องครอบด้วย `<Suspense>`
- ✅ ลิงก์ภายในลงท้ายด้วย `/` เช่น `<a href="/kitchen/">`

### 9.4 Polling จอครัว (แนวทาง)

```tsx
useEffect(() => {
  let stop = false;
  async function load() {
    try {
      const data = await api<{ orders: Order[] }>("/orders?status=pending,cooking");
      if (!stop) setOrders(data.orders);
    } catch (e) { /* แสดงสถานะ "เชื่อมต่อไม่ได้" แต่ไม่หยุด polling */ }
  }
  load();
  const t = setInterval(load, 2500);
  return () => { stop = true; clearInterval(t); };
}, []);
```

### 9.5 Contract ของ API (ระหว่างที่ Backend ยังไม่เสร็จ)

Frontend เขียนตามนี้ได้เลย และทดสอบด้วยข้อมูลจำลองก่อน Backend ที่รับผิดชอบ orders ต้องทำให้ตรงกัน ถ้าจะเปลี่ยน contract **ต้องแก้ `packages/shared/src/index.ts` และแจ้งทีม**

| Method | Path | Body / Query | Response | สถานะ |
|---|---|---|---|---|
| GET | `/health` | - | `{status:"ok", ...}` | ✅ |
| GET | `/menu` | - | `{items: MenuItem[]}` | ✅ |
| POST | `/menu` | MenuItem | MenuItem | 🔲 ต้อง auth |
| PUT | `/menu/:id` | MenuItem | MenuItem | 🔲 ต้อง auth |
| DELETE | `/menu/:id` | - | `{deleted:true}` | 🔲 ต้อง auth |
| POST | `/orders` | `{tableId, items:[{menuItemId, quantity}]}` | `Order` (201) | 🔲 |
| GET | `/orders` | `?status=pending,cooking` | `{orders: Order[]}` | 🔲 |
| PATCH | `/orders/:id/status` | `{status: OrderStatus}` | `Order` | 🔲 |
| GET/POST/DELETE | `/tables`, `/tables/:id` | - | - | 🔲 ต้อง auth |

> ตอนนี้ endpoint ที่ 🔲 ตอบ `501` อย่าตกใจเมื่อเจอ

### 9.6 วิธีทดสอบฝั่ง Frontend

| ทดสอบอะไร | วิธี |
|---|---|
| เปิดหน้าได้ | `pnpm --filter @qr-kitchen/web dev` แล้วเปิด `localhost:3000/<หน้า>/` |
| เรียก API ได้ | เปิด DevTools (F12) → Network ดู request ไปที่ API ต้องได้ 200 |
| build ผ่าน (สำคัญก่อน PR ทุกครั้ง) | `pnpm --filter @qr-kitchen/web build` |
| ตรวจ lint | `pnpm --filter @qr-kitchen/web lint` |
| ดูหน้าจริงที่ build แล้ว | หลัง build เปิดไฟล์ใน `apps/web/out` หรือใช้ `npx serve apps/web/out` |
| ทดสอบบนมือถือ | deploy ด้วย `pnpm run web:deploy` (ผู้ดูแลโครงสร้าง) แล้วเปิดลิงก์ CloudFront |
| จำลอง QR | เปิดลิงก์ `/menu/?table=5` ตรง ๆ หรือสร้าง QR จากลิงก์นั้นด้วยเว็บ/แอปสร้าง QR ใดก็ได้ |

---

## 10. คู่มือสำหรับ Backend

### 10.1 เพิ่ม endpoint

1. เปิดไฟล์ใน `apps/api/src/routes/` ตาม domain (`orders.ts`, `menu.ts`, `tables.ts`)
2. แทนที่ `notImplemented(...)` ด้วยโค้ดจริง:

```ts
{
  method: "POST",
  path: "/orders",
  handler: async ({ event }) => {
    const body = JSON.parse(event.body ?? "{}");
    // ตรวจข้อมูล -> เขียน DynamoDB (db.send(new PutCommand(...)))
    return json(201, order);
  },
},
```

3. path รองรับพารามิเตอร์ `:id` → อ่านจาก `ctx.params.id`
4. ถ้าสร้างไฟล์ route ใหม่ ให้ลงทะเบียนใน `routes/index.ts`
5. ตาราง DynamoDB และชื่อตารางอยู่ใน `lib/config.ts` (`TABLES.menu`, `TABLES.orders`, ...)

**CORS** จัดการใน `lib/response.ts` แล้ว ใช้ `json(status, body)` ทุกครั้ง (preflight `OPTIONS` ตอบอัตโนมัติ)

### 10.2 โมเดลข้อมูล

| ตาราง (`qrk-` นำหน้า) | Key | ข้อมูล |
|---|---|---|
| `qrk-Menu` | `id` (string) | MenuItem: name, price, imageUrl?, available |
| `qrk-Orders` | `id` (string) | Order: tableId, items[], status, createdAt |
| `qrk-Tables` | `id` (string) | โต๊ะ |
| `qrk-Connections` | `connectionId` | เตรียมไว้สำหรับ Real Time แบบ push ในอนาคต (ยังไม่ใช้) |

ตอนนี้ทุกตารางมีแค่ partition key `id` → การ `Scan` ไม่รับประกันลำดับ และคิวรี `status` ต้องใช้ filter ถ้าต้องการ index (GSI) ให้แก้ `infra/template.yaml` **และ** `apps/api/src/local/create-tables.ts` ให้ตรงกัน แล้วแจ้งผู้ดูแลโครงสร้าง

### 10.3 ข้อควรรู้เฉพาะ Learner Lab

- ✅ โค้ดใน Lambda เขียน/อ่าน DynamoDB ได้ (ใช้ `LabRole`)
- ❌ การรันสคริปต์จากเครื่องเราเขียน DynamoDB บน AWS ตรง ๆ **ไม่ได้** (สิทธิ์ `voclabs`) → ใช้ Lambda ทำแทน (เช่น SeedFunction)
- โค้ดห้ามมี credentials ใด ๆ

### 10.4 วิธีทดสอบ Backend

| ทดสอบอะไร | วิธี |
|---|---|
| Type ถูกต้อง | `pnpm --filter @qr-kitchen/api run typecheck` |
| ทดสอบ endpoint บนเครื่อง | เปิด Docker + `pnpm --filter @qr-kitchen/api run dev` แล้วเรียก `http://localhost:4000/...` |
| ทดสอบ POST | PowerShell: `Invoke-RestMethod -Method Post -Uri http://localhost:4000/orders -ContentType "application/json" -Body '{"tableId":"5","items":[]}'` |
| ดูข้อมูลในตาราง | http://localhost:8001 |
| ทดสอบบน AWS จริง | `pnpm run deploy` แล้วเรียก `<ApiUrl>/...` ดู log ได้ที่ AWS Console → CloudWatch → Log groups → `/aws/lambda/qr-kitchen-ApiFunction-...` |

---

## 11. ข้อจำกัดของ AWS Academy Learner Lab (ต้องอ่าน)

สิ่งเหล่านี้ทดสอบแล้วใน Lab ของทีม ผลอาจต่างกันได้เล็กน้อยในแต่ละบัญชี:

| เรื่อง | ผล | ผลกระทบต่อการออกแบบ |
|---|---|---|
| **Credentials** | หมดอายุเมื่อ Lab ปิด ต้อง copy ใหม่ทุกครั้งที่ Start Lab | ใช้ `pnpm aws:creds` |
| **สร้าง IAM Role ใหม่** | ไม่ได้ | ทุก Lambda ใช้ `LabRole` ที่มีอยู่แล้ว (`Role:` ใน template) |
| **API Gateway** (HTTP/REST/WebSocket) | ❌ ถูกบล็อก | ใช้ Lambda Function URL แทน และไม่มี WebSocket → ใช้ Polling |
| **AWS Amplify** | ❌ ถูกบล็อก | ใช้ S3 + CloudFront |
| **DynamoDB สร้างตาราง** | `voclabs` สร้างเองไม่ได้ แต่ CloudFormation ผ่าน `LabRole` ได้ | ต้อง deploy ด้วย `--role-arn` (สคริปต์ทำให้แล้ว) |
| **DynamoDB เขียนข้อมูลจากเครื่อง** | ❌ (`voclabs`) | ใช้ Lambda เขียนแทน (SeedFunction) |
| **S3 + CloudFront ผ่าน CloudFormation** | ✅ ใช้ได้ | ใช้งานอยู่ |
| **Cognito** | เรียกได้ แต่สร้างผ่าน CloudFormation ยังไม่สำเร็จ | อยู่ระหว่างตรวจสอบ (ดูข้อ 16) |
| **AWS IoT Core** | เรียกได้ | ตัวเลือกสำหรับ Real Time ในอนาคต (ยังไม่ทดสอบ) |
| **Region** | ใช้ `us-east-1` เท่านั้น | ฝังไว้ในสคริปต์ |
| **ข้อมูล/resource หลัง Lab ปิด** | มักยังอยู่ แต่ถ้า Lab ถูกรีเซ็ตอาจหาย | รัน deploy ใหม่ + seed ใหม่ได้เสมอ |

**ขอบเขตงบ/ชั่วโมง:** Lab มีเครดิตจำกัด ปิด Lab (End Lab) เมื่อไม่ใช้งาน

---

## 12. การทำงานร่วมกันเป็นทีมและการ commit

### 12.1 กติกา Branch

- **ห้าม push ตรงเข้า `main`** ทำงานผ่าน feature branch + Pull Request
- แนะนำให้ผู้ดูแล repo ตั้ง Branch protection: GitHub → Settings → Branches → Add rule → `main` → Require a pull request before merging
- ตั้งชื่อ branch: `feat/<ส่วน>-<รายละเอียด>`, `fix/...`, `docs/...`
  ตัวอย่าง: `feat/web-kitchen-display`, `feat/api-create-order`, `fix/web-menu-loading`

### 12.2 ขั้นตอนทำงานปกติ

```bat
git checkout main
git pull origin main
git checkout -b feat/web-cart

:: ... แก้โค้ด ...

git status
git add apps/web
git commit -m "feat(web): add cart to menu page"
git push origin feat/web-cart
```

จากนั้นเปิด **Pull Request** บน GitHub → ให้เพื่อนอย่างน้อย 1 คนรีวิว → Merge

**ก่อนเปิด PR ต้องตรวจ:**
- Frontend: `pnpm --filter @qr-kitchen/web build` ผ่าน
- Backend: `pnpm --filter @qr-kitchen/api run typecheck` ผ่าน
- `git status` ไม่มีไฟล์ที่ไม่ควร commit

### 12.3 รูปแบบข้อความ commit

`<ชนิด>(<ส่วน>): <คำอธิบายสั้น ๆ>`

| ชนิด | ใช้เมื่อ |
|---|---|
| `feat` | เพิ่มความสามารถใหม่ |
| `fix` | แก้บัก |
| `refactor` | ปรับโครงสร้างโค้ดโดยพฤติกรรมเดิม |
| `docs` | แก้เอกสาร |
| `chore` | งานจุกจิก (ตั้งค่า, dependency) |
| `infra` | แก้ `infra/` หรือ `scripts/` |

ส่วน (scope): `web`, `api`, `shared`, `infra`

### 12.3.1 ถ้า `main` ใหม่กว่า branch เรา

```bat
git checkout main
git pull origin main
git checkout feat/web-cart
git merge main
```
ถ้ามี conflict ให้แก้ไฟล์ที่ Git ระบุ → `git add .` → `git commit`

### 12.4 ห้าม commit สิ่งเหล่านี้เด็ดขาด

| ไฟล์ | เหตุผล |
|---|---|
| `.env`, `.env.local` | ค่า config เฉพาะเครื่อง/บัญชี |
| `~/.aws/credentials`, `aws-credentials.*` | **ความลับ** (อยู่นอกโปรเจกต์อยู่แล้ว อย่าคัดลอกเข้ามา) |
| `node_modules/`, `.next/`, `apps/web/out/`, `.aws-sam/` | ไฟล์ที่สร้างอัตโนมัติ |
| `seed-out.json`, `cf-config.json` | ไฟล์ผลลัพธ์ชั่วคราว |

ตรวจก่อน commit ทุกครั้งด้วย `git status` ถ้าเผลอ commit ความลับขึ้น GitHub ให้ **แจ้งทีมทันที** และกด **End Lab / Start Lab** ใหม่เพื่อให้ credentials ชุดเดิมใช้ไม่ได้

### 12.5 ปัญหา CRLF/LF บน Windows

คำเตือน `LF will be replaced by CRLF` เป็นเรื่องปกติ ไม่ต้องแก้

### 12.6 ไฟล์ที่ต้องเขียนเป็นภาษาอังกฤษล้วน

`infra/*.yaml`, `scripts/*.bat`, `scripts/*.ps1` **ห้ามมีภาษาไทย แม้ในคอมเมนต์** เพราะ AWS CLI/PowerShell บน Windows อ่านอักขระไทยผิดแล้วพัง (เจอแล้วกับ `charmap codec can't decode`) โค้ดในแอป (`apps/`) และ README ใช้ภาษาไทยได้

---

## 13. การแบ่งงานที่แนะนำสำหรับทีม 5 คน

(ข้อเสนอเริ่มต้น ปรับตามความถนัดได้)

| คน | บทบาท | โฟลเดอร์ที่ดูแล | งาน |
|---|---|---|---|
| 1 | **ผู้ดูแลโครงสร้าง / Cloud** | `infra/`, `scripts/`, `docker-compose.yml` | จัดการ AWS, deploy, Cognito/Auth, CI, รีวิว PR ด้าน infra |
| 2 | **Frontend: ลูกค้า** | `apps/web/app/menu/` (+ หน้าใหม่ของลูกค้า) | เมนู, ตะกร้า, สั่งอาหาร, สถานะออเดอร์ |
| 3 | **Frontend: ครัว** | `apps/web/app/kitchen/` | จอครัว, polling, เปลี่ยนสถานะ, เสียง/สีแจ้งเตือนออเดอร์ใหม่ |
| 4 | **Frontend: หลังบ้าน** | `apps/web/app/admin/` | จัดการเมนู, ราคา, โต๊ะ, สร้าง QR Code, หน้า login |
| 5 | **Backend** | `apps/api/src/routes/` | `POST/GET /orders`, `PATCH .../status`, CRUD เมนูและโต๊ะ |

**กติกาเพื่อไม่ให้ชนกัน:**
- แต่ละคนแก้เฉพาะโฟลเดอร์ของตัวเอง ถ้าต้องแก้ของคนอื่นให้คุยก่อน
- `packages/shared` เป็นจุดตกลงร่วม (contract) → แก้แล้วต้องแจ้งทุกคน
- Component ที่ใช้ร่วมหลายหน้าให้วางใน `apps/web/components/` (สร้างเมื่อจำเป็น) และคุยกันก่อน

---

## 14. แก้ปัญหาเบื้องต้น (Troubleshooting)

### การติดตั้ง / เครื่องมือ

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `ERR_PNPM_IGNORED_BUILDS` (esbuild, unrs-resolver) | pnpm บล็อก build script เพื่อความปลอดภัย | ไม่กระทบการทำงาน ข้ามได้ (ถ้าอยากให้หาย `pnpm approve-builds`) |
| `[WARN] settings in apps/web/pnpm-workspace.yaml do not apply` | `create-next-app` สร้างไฟล์ซ้ำ | ลบ `apps\web\pnpm-workspace.yaml` ได้ |
| `'sam' is not recognized` / `'aws' is not recognized` | ติดตั้งแล้วแต่ยังไม่ refresh PATH | ปิดแล้วเปิด Command Prompt ใหม่ |
| `esbuild` หาไม่เจอตอน `sam build` | PATH | `npm install -g esbuild` หรือใช้ `pnpm run deploy` (สคริปต์เติม PATH ให้) |
| `pnpm deploy` ทำอะไรแปลก ๆ | ชนกับคำสั่งในตัวของ pnpm | ใช้ `pnpm run deploy` |

### Docker / ฐานข้อมูลบนเครื่อง

| อาการ | วิธีแก้ |
|---|---|
| `db:create` ขึ้น `socket hang up` / `ECONNRESET` | DynamoDB Local ยังบูตไม่เสร็จ รอ 5-10 วินาทีแล้วรันใหม่ |
| ติดต่อ `localhost:8000` ไม่ได้ | ตรวจ `docker ps` ต้องเห็น `qrk-dynamodb` ถ้าไม่เห็น: `docker compose up -d`. ถ้ายังไม่ได้ ลองเปลี่ยน `localhost` เป็น `127.0.0.1` ใน `apps/api/src/local/env.ts` |
| port 8000/8001/4000/3000 ถูกใช้อยู่ | ปิดโปรแกรมที่ใช้พอร์ตนั้น หรือเปลี่ยนพอร์ตใน `docker-compose.yml` / ตั้ง `PORT=` |
| `ResourceNotFoundException: Cannot do operations on a non-existent table` | ยังไม่ได้ `db:create` (ข้อมูลหายหลังปิด Docker) → `db:create` และ `db:seed` ใหม่ |
| `/menu` ได้ `{"items":[]}` | ยังไม่ได้ `db:seed` (บนเครื่อง) หรือยังไม่ได้ invoke SeedFunction (บน AWS) |
| ข้อมูลหายหลังรีสตาร์ท Docker | ตั้งใจไว้ (`-inMemory`) รัน create + seed ใหม่ |

### Frontend

| อาการ | วิธีแก้ |
|---|---|
| หน้าเมนูขึ้น `ยังไม่ได้ตั้งค่า` / `NEXT_PUBLIC_API_URL is not set` | สร้าง `apps/web/.env.local` แล้วรีสตาร์ท `pnpm dev` |
| `โหลดเมนูไม่สำเร็จ: Failed to fetch` | API ไม่ได้รัน (`pnpm ... api run dev`) หรือ URL ผิด → ดู F12 → Console/Network |
| `HTTP 501` | endpoint นั้นยังไม่ถูกพัฒนา (ถูกต้องแล้ว) |
| `next build` ฟ้อง error เรื่อง export / dynamic | ละเมิดกฎ static export (ดูข้อ 9.3) |
| เข้า `/menu` ไม่ได้แต่ `/menu/` ได้ | ใส่ `/` ท้ายลิงก์ (`trailingSlash: true`) |
| หน้าบน CloudFront ยังเป็นของเก่า | cache → `pnpm run web:deploy` ใหม่ (ล้าง cache ให้อัตโนมัติ) หรือ hard refresh (Ctrl+Shift+R) |
| CloudFront ขึ้น `403` ตอนเพิ่งสร้าง | รอ 1-2 นาที |

### AWS / Deploy

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `NoCredentials` / `ExpiredToken` / `security token invalid` | Lab หมดอายุ/ยังไม่ Start | Start Lab → copy credentials ใหม่ → `pnpm aws:creds` |
| `Cannot read AWS account` (จาก deploy.bat) | credentials ใช้ไม่ได้ | เหมือนข้างบน |
| `No credentials found in clipboard` | copy ไม่ครบ | กด Show ที่ AWS CLI แล้ว copy **ทั้งบล็อก** (ต้องมี `aws_access_key_id` และ `aws_session_token`) |
| `is in ROLLBACK_COMPLETE state and can not be updated` | deploy ครั้งก่อนล้มและถูก rollback | ดูสาเหตุก่อน: `aws cloudformation describe-stack-events --stack-name <ชื่อ> --query "StackEvents[?ResourceStatus=='CREATE_FAILED'].[LogicalResourceId,ResourceStatusReason]" --output text` แล้วลบ: `aws cloudformation delete-stack --stack-name <ชื่อ>` + `aws cloudformation wait stack-delete-complete --stack-name <ชื่อ>` แล้ว deploy ใหม่ |
| `not authorized to perform: dynamodb:CreateTable` (user `voclabs`) | CloudFormation ไม่ได้ใช้ LabRole | ต้องส่ง `--role-arn .../LabRole` (สคริปต์ทำให้แล้ว) |
| `not authorized to perform: apigateway:POST` | Lab บล็อก API Gateway | อย่าใช้ API Gateway (ใช้ Function URL) |
| `dynamodb:PutItem ... voclabs` ตอน seed จากเครื่อง | เครื่องเราเขียน DynamoDB ไม่ได้ | invoke SeedFunction แทน (ข้อ 8.3) |
| Function URL ขึ้น `Forbidden` | ขาด resource policy | ตรวจว่า `infra/template.yaml` มีทั้ง `ApiUrlPermission` (`InvokeFunctionUrl`) และ `ApiInvokePermission` (`InvokeFunction` + `InvokedViaFunctionUrl`) แล้ว deploy ใหม่ รอ 10-20 วินาที |
| `'charmap' codec can't decode byte ...` | ไฟล์ `.yaml` มีภาษาไทย | ลบภาษาไทย/อักขระพิเศษออกจากไฟล์ใน `infra/` (ดูข้อ 12.6) และ `set PYTHONUTF8=1` |
| `Failed to create/update the stack: Waiter ... ROLLBACK_COMPLETE` | resource ใดล้ม | ดู `CREATE_FAILED` ในล็อก (ข้อความ error ระบุว่าบริการไหนถูกบล็อก) |
| `No changes to deploy` | ไม่ใช่ error | ของบน AWS ตรงกับโค้ดแล้ว |
| `Error: ... Unsupported URL Type "workspace:"` ตอน `sam build` | `apps/api/package.json` มี `workspace:*` | ห้ามใส่ `@qr-kitchen/shared` เป็น dependency ใน `apps/api` (ใช้ `paths` ใน `tsconfig.json` แทน) |
| ใช้ `@qr-kitchen/shared` ใน api แล้ว sam build พัง | ใช้ค่าจริง (ไม่ใช่แค่ type) | ใช้ `import type` หรือแจ้งผู้ดูแลโครงสร้างให้ปรับ |

### ล้างข้อมูลและเริ่มใหม่ (เมื่อไม่รู้จะแก้ยังไง)

```bat
pnpm install
docker compose down
docker compose up -d
pnpm --filter @qr-kitchen/api run db:create
pnpm --filter @qr-kitchen/api run db:seed
```

ถ้าติดปัญหาที่ไม่อยู่ในตาราง ให้ส่งใน LINE/Discord ของทีมพร้อม: คำสั่งที่รัน, ข้อความ error ทั้งหมด (**ตัดค่า key/token ออกก่อน**)

---

## 15. การลบ resource เมื่อเลิกใช้

ลบตามลำดับ (stack hosting ต้องล้าง bucket ก่อน):

```bat
:: 1) หา bucket ของเว็บ
aws cloudformation describe-stacks --stack-name qr-kitchen-web --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text --region us-east-1

:: 2) ล้าง bucket แล้วลบ stack
aws s3 rm s3://<BucketName> --recursive
aws cloudformation delete-stack --stack-name qr-kitchen-web --region us-east-1

:: 3) ลบ backend (จะลบ DynamoDB และข้อมูลทั้งหมด)
aws cloudformation delete-stack --stack-name qr-kitchen --region us-east-1

:: 4) ถ้าเคยสร้าง auth
aws cloudformation delete-stack --stack-name qr-kitchen-auth --region us-east-1
```

---

## 16. Roadmap

**ทำแล้ว**
- [x] Repo + monorepo + shared types
- [x] Next.js static export (3 หน้าหลัก) + หน้าเมนูดึงข้อมูลจริง
- [x] API Lambda ตัวเดียว + router + local dev server + Docker DynamoDB Local
- [x] IaC (SAM) + DynamoDB + Function URL บน Learner Lab
- [x] Hosting S3 + CloudFront (HTTPS) + สคริปต์ deploy
- [x] สคริปต์ credentials / deploy ที่ใช้ได้กับทุกบัญชี

**ต่อไป**
- [ ] **Auth เจ้าของร้าน:** ตรวจสาเหตุที่ Cognito ใน `infra/auth.yaml` deploy ไม่ผ่านด้วย `describe-stack-events` ถ้า LabRole สร้างไม่ได้ ให้ทำ login เองใน Lambda (เก็บรหัสผ่านแบบ hash ใน DynamoDB + ออก JWT) พร้อม middleware ป้องกัน `POST/PUT/DELETE /menu` และ `/tables`
- [ ] ระบบออเดอร์: `POST /orders`, `GET /orders`, `PATCH /orders/:id/status`
- [ ] จอครัว (polling) + เปลี่ยนสถานะ
- [ ] หลังบ้าน: จัดการเมนู/โต๊ะ + สร้าง QR Code
- [ ] ตะกร้าและติดตามสถานะออเดอร์ฝั่งลูกค้า
- [ ] (ตัวเลือก) เปลี่ยน Polling เป็น Real Time จริงด้วย AWS IoT Core
- [ ] ลบ `SeedFunction` ก่อนส่งงาน
- [ ] ตั้ง Branch protection และ CODEOWNERS

---

## ผู้พัฒนา

ทีม 5 คน รายวิชา Cloud Application
