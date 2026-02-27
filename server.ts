import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("tahfidz.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'siswa' or 'guru'
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    surah_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    student_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    surah_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    notes TEXT,
    grade_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES requests(id),
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (id, name, role, password) VALUES (?, ?, ?, ?)");
  // Students (NISN)
  insertUser.run("1234567890", "Ahmad Fauzi", "siswa", "password123");
  insertUser.run("0987654321", "Siti Aminah", "siswa", "password123");
  // Teachers (ID Guru)
  insertUser.run("GURU001", "Ust. Abdullah", "guru", "admin123");
  insertUser.run("GURU002", "Ustz. Khadijah", "guru", "admin123");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    const { id, password, role } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ? AND password = ? AND role = ?").get(id, password, role) as any;
    
    if (user) {
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "ID atau Password salah" });
    }
  });

  // Get Teachers
  app.get("/api/teachers", (req, res) => {
    const teachers = db.prepare("SELECT id, name FROM users WHERE role = 'guru'").all();
    res.json(teachers);
  });

  // Student: Submit Request
  app.post("/api/requests", (req, res) => {
    const { studentId, teacherId, surahName } = req.body;
    const info = db.prepare("INSERT INTO requests (student_id, teacher_id, surah_name) VALUES (?, ?, ?)").run(studentId, teacherId, surahName);
    res.json({ success: true, id: info.lastInsertRowid });
  });

  // Teacher: Get Pending Requests
  app.get("/api/requests/pending/:teacherId", (req, res) => {
    const { teacherId } = req.params;
    const requests = db.prepare(`
      SELECT r.*, u.name as student_name 
      FROM requests r 
      JOIN users u ON r.student_id = u.id 
      WHERE r.teacher_id = ? AND r.status = 'pending'
    `).all(teacherId);
    res.json(requests);
  });

  // Teacher: Submit Grade
  app.post("/api/grades", (req, res) => {
    const { requestId, studentId, teacherId, surahName, score, notes } = req.body;
    
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO grades (request_id, student_id, teacher_id, surah_name, score, notes) VALUES (?, ?, ?, ?, ?, ?)").run(requestId, studentId, teacherId, surahName, score, notes);
      db.prepare("UPDATE requests SET status = 'completed' WHERE id = ?").run(requestId);
    });
    
    transaction();
    res.json({ success: true });
  });

  // Leger: Get All Grades
  app.get("/api/leger", (req, res) => {
    const leger = db.prepare(`
      SELECT g.*, s.name as student_name, t.name as teacher_name 
      FROM grades g
      JOIN users s ON g.student_id = s.id
      JOIN users t ON g.teacher_id = t.id
      ORDER BY g.grade_date DESC
    `).all();
    res.json(leger);
  });

  // Get Student History
  app.get("/api/history/:studentId", (req, res) => {
    const { studentId } = req.params;
    const history = db.prepare(`
      SELECT g.*, t.name as teacher_name 
      FROM grades g
      JOIN users t ON g.teacher_id = t.id
      WHERE g.student_id = ?
      ORDER BY g.grade_date DESC
    `).all(studentId);
    res.json(history);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
