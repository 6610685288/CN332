const express = require("express");
const path = require("path");
const cors = require("cors");
const { decorateApiHandler } = require("./decorators/handlerDecorators");
const { InMemoryVehicleAdminService } = require("./services/inMemoryVehicleAdminService");
const { LoggingVehicleAdminDecorator } = require("./decorators/loggingVehicleAdminDecorator");

const app = express();
const port = Number(process.env.PORT) || 3001;

const frontendPublic = path.join(__dirname, "../frontend/public");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPublic));

const d = decorateApiHandler;

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

const vehicleAdmin = new LoggingVehicleAdminDecorator(
  new InMemoryVehicleAdminService(vehicles)
);

function userIdFromBodyOrQuery(body, query) {
  return (
    (body && (body.userId || body.elderlyId)) ||
    (query && (query.userId || query.elderlyId)) ||
    null
  );
}

// ==========================================
// User API
// ==========================================
app.get("/api/vehicles", d((req, res) => res.json(vehicles)));

app.get(
  "/api/activities",
  d((req, res) => {
    const uid = userIdFromBodyOrQuery(null, req.query);
    const list = activities.map((a) => ({
      ...a,
      hasJoined: uid
        ? bookings.some(
            (b) =>
              b.type === "activity" &&
              b.activityId === a.id &&
              b.userId === uid
          )
        : false,
    }));
    res.json(list);
  })
);

app.get(
  "/api/my-bookings",
  d((req, res) => {
    const uid = userIdFromBodyOrQuery(null, req.query);
    if (!uid) return res.json([]);
    res.json(bookings.filter((b) => b.userId === uid));
  })
);

app.post(
  "/api/book-vehicle",
  d((req, res) => {
    const userId = userIdFromBodyOrQuery(req.body, null) || "anonymous";
    const destination = req.body.destination || "";
    const time = req.body.time || req.body.scheduledTime || "";
    const passengers = req.body.passengers;
    let detail = `เวลารับ: ${time}`;
    if (passengers != null) detail += ` | ผู้โดยสาร: ${passengers} คน`;

    const newBooking = {
      id: Date.now(),
      userId,
      type: "vehicle",
      title: `จองรถ: ${destination}`,
      detail,
      timestamp: new Date().toISOString(),
      destination,
      time,
      passengers,
    };
    bookings.unshift(newBooking);
    res.json({ success: true, booking: newBooking });
  })
);

app.post(
  "/api/join-activity",
  d((req, res) => {
    const activityId = Number(req.body.activityId);
    const userId = userIdFromBodyOrQuery(req.body, null) || "anonymous";

    if (!Number.isFinite(activityId)) {
      return res.status(400).json({ error: "activityId ไม่ถูกต้อง" });
    }

    const act = activities.find((a) => a.id === activityId);
    if (!act) {
      return res.status(400).json({ error: "ไม่พบกิจกรรม" });
    }

    const already = bookings.some(
      (b) =>
        b.type === "activity" &&
        b.activityId === activityId &&
        b.userId === userId
    );
    if (already) {
      return res.json({ success: true, alreadyJoined: true });
    }

    if (act.joined >= act.seats) {
      return res.status(400).json({ error: "กิจกรรมเต็มแล้ว" });
    }

    act.joined++;
    const newBooking = {
      id: Date.now(),
      userId,
      activityId,
      type: "activity",
      title: `กิจกรรม: ${act.name}`,
      detail: `เวลา: ${act.time} ณ ${act.location}`,
      timestamp: new Date().toISOString(),
    };
    bookings.unshift(newBooking);
    res.json({ success: true, booking: newBooking });
  })
);

app.post(
  "/api/leave-activity",
  d((req, res) => {
    const activityId = Number(req.body.activityId);
    const userId = userIdFromBodyOrQuery(req.body, null) || "anonymous";

    if (!Number.isFinite(activityId)) {
      return res.status(400).json({ error: "activityId ไม่ถูกต้อง" });
    }

    const idx = bookings.findIndex(
      (b) =>
        b.type === "activity" &&
        b.activityId === activityId &&
        b.userId === userId
    );
    if (idx === -1) {
      return res.status(400).json({ error: "ไม่พบการลงทะเบียนกิจกรรมนี้" });
    }

    const act = activities.find((a) => a.id === activityId);
    if (act && act.joined > 0) act.joined--;
    bookings.splice(idx, 1);
    res.json({ success: true });
  })
);

// ==========================================
// Admin API (vehicles via decorated service)
// ==========================================
app.get("/api/admin/vehicles", d((req, res) => res.json(vehicleAdmin.list())));

app.post(
  "/api/admin/vehicles",
  d((req, res) => {
    const result = vehicleAdmin.create(req.body);
    res.status(201).json(result.vehicle);
  })
);

app.put(
  "/api/admin/vehicles/:id",
  d((req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = vehicleAdmin.update(id, req.body);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.vehicle);
  })
);

app.delete(
  "/api/admin/vehicles/:id",
  d((req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = vehicleAdmin.remove(id);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({ success: true });
  })
);

app.get("/api/admin/activities", d((req, res) => res.json(activities)));

app.post(
  "/api/admin/activities",
  d((req, res) => {
    const seatsRaw = parseInt(req.body.seats, 10);
    const newActivity = {
      id: Date.now(),
      name: req.body.name,
      time: req.body.time,
      location: req.body.location,
      seats: Number.isFinite(seatsRaw) && seatsRaw > 0 ? seatsRaw : 20,
      joined: 0,
      icon: req.body.icon || "📅",
    };
    activities.push(newActivity);
    res.status(201).json(newActivity);
  })
);

app.delete(
  "/api/admin/activities/:id",
  d((req, res) => {
    const id = parseInt(req.params.id, 10);
    const existed = activities.some((a) => a.id === id);
    activities = activities.filter((a) => a.id !== id);
    bookings = bookings.filter(
      (b) => !(b.type === "activity" && b.activityId === id)
    );
    if (!existed) {
      return res.status(404).json({ error: "ไม่พบกิจกรรม" });
    }
    res.json({ success: true });
  })
);

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Admin panel: http://localhost:${port}/admin.html`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `พอร์ต ${port} ถูกใช้งานอยู่แล้ว (EADDRINUSE)\n` +
        `  • ปิดโปรเซสเก่า: ใน PowerShell รัน netstat -ano | findstr :${port} แล้ว taskkill /PID <PID> /F\n` +
        `  • หรือใช้พอร์ตอื่น: $env:PORT=3002; node server.js`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
