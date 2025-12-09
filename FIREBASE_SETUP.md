# 🔥 Firebase Setup Guide

เพื่อให้เกมทำงานได้กับ Firebase Firestore คุณต้องทำตามขั้นตอนดังนี้:

## 1. สร้าง Firebase Project

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. คลิก **Add project** (หรือ Create a project)
3. ตั้งชื่อ project เช่น `slave-card-game`
4. เลือกตั้งค่าตามต้องการ (Google Analytics เลือกได้ตามใจชอบ)
5. คลิก **Create project**

## 2. Enable Cloud Firestore Database

> [!IMPORTANT]
> ใช้ **Cloud Firestore** ไม่ใช่ ~~Realtime Database~~
> 
> Firebase มี 2 ตัวเลือก:
> - ✅ **Cloud Firestore** - ใช้อันนี้ (recommended, มี features มากกว่า)
> - ❌ **Realtime Database** - อย่าใช้อันนี้สำหรับโปรเจคนี้

1. ใน Firebase Console เลือกโปรเจคของคุณ
2. ไปที่เมนู **Build** > **Firestore Database** (ไม่ใช่ Realtime Database!)
3. คลิก **Create database**
4. เลือก **Start in test mode** (สำหรับ development)
   - Test mode จะอนุญาตให้ read/write ได้ทุกคนชั่วคราว
   - ⚠️ **สำคัญ**: สำหรับ production ต้องตั้ง security rules ให้ดี
5. เลือก location ที่ใกล้ที่สุด เช่น `asia-southeast1` (Singapore)
6. คลิก **Enable**
7. รอสักครู่จนเห็นหน้า Firestore Console พร้อมใช้งาน

## 3. เพิ่ม Web App และดึง Config

1. ใน Firebase Console > **Project Overview** (หน้าแรก)
2. คลิกไอคอน **Web** (`</>`) เพื่อเพิ่ม web app
3. ตั้งชื่อ app เช่น `slave-card-game-web`
4. ไม่ต้องติ๊ก Firebase Hosting (ถ้าไม่ได้ใช้)
5. คลิก **Register app**
6. คุณจะเห็น `firebaseConfig` object แบบนี้:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
\`\`\`

## 4. กรอก Environment Variables

เปิดไฟล์ `.env.local` ในโปรเจค และกรอกค่าจาก Firebase Config:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
\`\`\`

## 5. รันเกม

\`\`\`bash
npm run dev
\`\`\`

เปิดเบราว์เซอร์ไปที่ http://localhost:3000

## 6. ทดสอบการทำงาน

### ✅ Test Checklist:

- [ ] สร้างห้องใหม่ได้
- [ ] เห็นห้องใน lobby
- [ ] เข้าร่วมห้องได้
- [ ] ตรวจสอบ Firebase Console ว่ามีข้อมูลใน Firestore
- [ ] Restart server (`Ctrl+C` แล้วรัน `npm run dev` ใหม่)
- [ ] ตรวจสอบว่าห้องยังอยู่หลัง restart

## 7. ดูข้อมูลใน Firestore

1. ไปที่ Firebase Console > **Firestore Database**
2. คุณจะเห็น collection `rooms`
3. คลิกดูรายละเอียดห้องที่ถูกสร้าง
4. ลองสร้างห้องเพิ่ม แล้วดูว่าข้อมูล real-time update หรือไม่

---

## 🔒 Security Rules (สำหรับ Production)

เมื่อพร้อม deploy จริง ควรเปลี่ยน Firestore Security Rules:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to rooms collection
    match /rooms/{roomId} {
      allow read: true;
      allow write: true;
    }
  }
}
\`\`\`

สำหรับความปลอดภัยที่ดีกว่า สามารถเพิ่ม validation rules เพิ่มเติมได้

---

## ❓ Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"
- ตรวจสอบว่า API key ใน `.env.local` ถูกต้อง
- ตรวจสอบว่าไม่มีช่องว่างหรือ quotes เกิน

### ไม่เห็นข้อมูลใน Firestore
- ตรวจสอบ Browser Console (`F12`) ดู errors
- ตรวจสอบว่า Firestore database ถูก enable แล้ว
- ตรวจสอบ network tab ว่ามี request ไปที่ Firebase หรือไม่

### Restart server แล้วห้องหาย
- แปลว่า Firebase config ไม่ถูกต้อง หรือยังใช้ in-memory อยู่
- ตรวจสอบว่า `.env.local` มีค่าครบทุก field
- Restart server ใหม่หลังแก้ `.env.local`

---

## 🎮 เริ่มเล่นได้เลย!

หลังจาก setup เสร็จแล้ว ตอนนี้เกมของคุณจะ:
- ✅ เก็บข้อมูลไว้ใน Firebase Firestore
- ✅ ไม่หายเมื่อ restart server
- ✅ สามารถ scale ได้เมื่อมีผู้เล่นเยอะขึ้น
- ✅ มี real-time capabilities (ถ้าต้องการเพิ่ม real-time listeners ในอนาคต)
