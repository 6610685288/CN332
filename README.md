# CN332

# Member
dev 1 Puridech Jaidee 6610685288

dev 2 Supawich Boonpraseart 6610685346

# HW1
https://www.canva.com/design/DAG-HuKsqpE/OLfcyrXdL-iAt_4peHDPuA/edit?utm_content=DAG-HuKsqpE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

# HW2
https://www.canva.com/design/DAG-y02-s2Q/3eQb027OF_VSyLdhJd9bDA/edit?utm_content=DAG-y02-s2Q&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

# HW3
https://www.canva.com/design/DAG_aDDNP4g/jMxtAOJFjdrbyJDaHHf_ew/edit

# HW4
https://www.canva.com/design/DAHAD1N1aTo/2rD2mljmqBz1Hrz5Gjn5jg/edit

# HW5
https://www.canva.com/design/DAHAtXQVrJ4/K7ENyw87RlC_mv8x42IgBA/edit

# HW6
https://www.canva.com/design/DAHBXoXtf8k/jmIJBCfdkv2UASyPosSMow/edit

# HW7
https://www.canva.com/design/DAHErs76NGc/2iCBW6dfOyjdsDsWmwATdA/edit

---

# Elderly System - วิธีการติดตั้งและรันโปรเจกต์

โปรเจกต์นี้แบ่งออกเป็น 2 ส่วนหลัก คือ **Backend (Node.js/Express)** และ **Frontend (React/HTML/JS)**

## สิ่งที่ต้องเตรียม (Prerequisites)
1. Node.js (แนะนำ v18 ขึ้นไป)
2. โฟลเดอร์โปรเจกต์ต้องมีไฟล์ `.env` สำหรับ Backend และ Frontend (ดูตัวอย่างที่ `.env.example`)
3. LINE Developers Account (สำหรับสร้าง LIFF ID เพื่อใช้ LINE Login)

## 1. การตั้งค่า Backend
1. เปิด Terminal และเข้าไปที่โฟลเดอร์ Backend:
   ```bash
   cd elderlySystem
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. สร้างไฟล์ `.env` ในโฟลเดอร์ `elderlySystem` (ถ้ายังไม่มี) โดยใส่ข้อมูลเช่น:
   ```env
   PORT=5000
   JWT_SECRET=your_secret_key_here
   DB_DIALECT=postgres
   # และการตั้งค่า DB อื่นๆ
   ```
4. รัน Backend:
   ```bash
   npm start
   ```
   *(Backend จะทำงานที่พอร์ต `5000`)*

## 2. การตั้งค่า Frontend
1. เปิด Terminal หน้าต่างใหม่ และเข้าไปที่โฟลเดอร์ Frontend:
   ```bash
   cd elderlySystem/elderly-system-frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. สร้างไฟล์ `.env` ในโฟลเดอร์นี้เพื่ออนุญาตให้ Localtunnel ผ่านได้:
   ```env
   DANGEROUSLY_DISABLE_HOST_CHECK=true
   ```
4. เข้าไปแก้ไขไฟล์ `public/js/authAdapter.js` เพื่อใส่ **LIFF ID** ของคุณ:
   ```javascript
   this.liffId = 'ใส่_LIFF_ID_ของคุณที่นี่';
   ```
5. รัน Frontend:
   ```bash
   npm start
   ```
   *(Frontend จะทำงานที่พอร์ต `3000`)*

## 3. การรันระบบเพื่อทดสอบ LINE Login ผ่าน Localtunnel
เนื่องจาก LINE บังคับใช้ `https://` คุณจำเป็นต้องรัน Tunnel เพื่อทดสอบในเครื่อง:
1. เปิด Terminal หน้าต่างใหม่ แล้วพิมพ์:
   ```bash
   npx localtunnel --port 3000 --local-host 127.0.0.1
   ```
2. นำ URL `https://...` ที่ได้ ไปใส่ในช่อง **Endpoint URL** ในหน้าเว็บ LINE Developers
3. เปิดหน้าเว็บผ่าน URL นั้น และเข้าใช้งานได้ทันที

---

**การหยุดการทำงาน (Stop Services):**
กด `Ctrl + C` ในแต่ละ Terminal หรือพิมพ์คำสั่ง:
```bash
npx kill-port 5000 3000
```
