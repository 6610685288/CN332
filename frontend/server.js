const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json()); // สำคัญมาก สำหรับรับข้อมูลแบบ JSON
app.use(express.static("public")); // เสิร์ฟไฟล์ในโฟลเดอร์ public

// ==========================================
// จำลองฐานข้อมูล (In-Memory Database)
// ==========================================
let vehicles = [
  {
    id: 1,
    type: "Golf Cart",
    name: "รถกอล์ฟ 01",
    status: "available",
    icon: "🛺",
  },
  { id: 2, type: "Van", name: "รถตู้ VIP", status: "busy", icon: "🚐" },
];

let activities = [
  {
    id: 101,
    name: "รำไทเก็ก ยามเช้า",
    time: "07:00 - 08:00",
    location: "สวนสาธารณะ",
    seats: 20,
    joined: 18,
    icon: "🧘‍♂️",
  },
  {
    id: 102,
    name: "แอโรบิค แดนซ์",
    time: "17:00 - 18:00",
    location: "ลานสโมสร",
    seats: 30,
    joined: 5,
    icon: "💃",
  },
];

let bookings = [];

// ==========================================
// User API (สำหรับผู้ใช้ทั่วไป)
// ==========================================
app.get("/api/vehicles", (req, res) => res.json(vehicles));
app.get("/api/activities", (req, res) => res.json(activities));
app.get("/api/my-bookings", (req, res) => res.json(bookings));

app.post("/api/book-vehicle", (req, res) => {
  const newBooking = {
    id: Date.now(),
    type: "vehicle",
    title: `จองรถ: ${req.body.destination}`,
    detail: `เวลารับ: ${req.body.time}`,
    timestamp: new Date(),
  };
  bookings.unshift(newBooking);
  res.json({ success: true, booking: newBooking });
});

app.post("/api/join-activity", (req, res) => {
  const act = activities.find((a) => a.id === req.body.activityId);
  if (act && act.joined < act.seats) {
    act.joined++;
    const newBooking = {
      id: Date.now(),
      type: "activity",
      title: `กิจกรรม: ${act.name}`,
      detail: `เวลา: ${act.time} ณ ${act.location}`,
      timestamp: new Date(),
    };
    bookings.unshift(newBooking);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "กิจกรรมเต็มหรือไม่พบกิจกรรม" });
  }
});

// ==========================================
// Admin API (สำหรับผู้ดูแลระบบ)
// ==========================================

// --- จัดการยานพาหนะ ---
// 1. ดึงข้อมูลรถทั้งหมด (มีอยู่แล้วข้างบน แต่ใช้ตัวเดียวกันได้)
app.get("/api/admin/vehicles", (req, res) => res.json(vehicles));

// 2. เพิ่มรถคันใหม่
app.post("/api/admin/vehicles", (req, res) => {
  const newVehicle = {
    id: Date.now(), // สร้าง ID มั่วๆ
    type: req.body.type || "รถกอล์ฟ",
    name: req.body.name,
    status: req.body.status || "available",
    icon: req.body.icon || "🚗",
  };
  vehicles.push(newVehicle);
  res.status(201).json(newVehicle);
});

// 3. แก้ไขสถานะรถ (ว่าง / ไม่ว่าง / ซ่อม)
app.put("/api/admin/vehicles/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const vehicleIndex = vehicles.findIndex((v) => v.id === id);
  if (vehicleIndex > -1) {
    vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], ...req.body };
    res.json(vehicles[vehicleIndex]);
  } else {
    res.status(404).json({ error: "ไม่พบยานพาหนะ" });
  }
});

// 4. ลบรถ
app.delete("/api/admin/vehicles/:id", (req, res) => {
  const id = parseInt(req.params.id);
  vehicles = vehicles.filter((v) => v.id !== id);
  res.json({ success: true });
});

// --- จัดการกิจกรรม ---
// 1. ดึงข้อมูลกิจกรรมทั้งหมด
app.get("/api/admin/activities", (req, res) => res.json(activities));

// 2. เพิ่มกิจกรรมใหม่
app.post("/api/admin/activities", (req, res) => {
  const newActivity = {
    id: Date.now(),
    name: req.body.name,
    time: req.body.time,
    location: req.body.location,
    seats: parseInt(req.body.seats) || 20,
    joined: 0,
    icon: req.body.icon || "📅",
  };
  activities.push(newActivity);
  res.status(201).json(newActivity);
});

// 3. ลบกิจกรรม
app.delete("/api/admin/activities/:id", (req, res) => {
  const id = parseInt(req.params.id);
  activities = activities.filter((a) => a.id !== id);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Admin panel: http://localhost:${port}/admin.html`);
});
