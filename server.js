const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;
const dbFolder = path.join(__dirname, 'db');
const dbFile = path.join(dbFolder, 'grades.db');

if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
}

const db = new sqlite3.Database(dbFile);

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class TEXT NOT NULL,
        section TEXT NOT NULL,
        roll INTEGER NOT NULL UNIQUE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        score INTEGER NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id)
      )
    `);

    db.get('SELECT COUNT(*) AS count FROM students', (err, row) => {
      if (err) {
        console.error(err);
        return;
      }

      if (row.count === 0) {
        const students = [
          ['Aarav Sharma', '10', 'A', 1],
          ['Mira Patel', '10', 'B', 2],
          ['Rohan Singh', '11', 'A', 3]
        ];

        const grades = [
          [1, 'Math', 88],
          [1, 'English', 92],
          [1, 'Science', 81],
          [1, 'History', 76],
          [1, 'Art', 95],
          [2, 'Math', 74],
          [2, 'English', 84],
          [2, 'Science', 90],
          [2, 'History', 78],
          [2, 'Art', 88],
          [3, 'Math', 91],
          [3, 'English', 86],
          [3, 'Science', 89],
          [3, 'History', 82],
          [3, 'Art', 93]
        ];

        const studentStmt = db.prepare('INSERT INTO students (name, class, section, roll) VALUES (?, ?, ?, ?)');
        students.forEach((student) => studentStmt.run(student));
        studentStmt.finalize();

        const gradesStmt = db.prepare('INSERT INTO grades (student_id, subject, score) VALUES (?, ?, ?)');
        grades.forEach((grade) => gradesStmt.run(grade));
        gradesStmt.finalize();
      }
    });
  });
}

function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  return 'D';
}

function getStudentRecord(student, grades) {
  const total = grades.reduce((sum, grade) => sum + grade.score, 0);
  const percentage = grades.length ? Number((total / (grades.length * 100) * 100).toFixed(2)) : 0;
  return {
    ...student,
    grades,
    total,
    percentage,
    letterGrade: calculateGrade(percentage)
  };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY class, section, roll', (err, students) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all('SELECT * FROM grades', (err, grades) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const result = students.map((student) => {
        const studentGrades = grades
          .filter((grade) => grade.student_id === student.id)
          .map(({ subject, score }) => ({ subject, score }));
        return getStudentRecord(student, studentGrades);
      });

      res.json(result);
    });
  });
});

app.post('/api/students', (req, res) => {
  const { name, class: studentClass, section, roll, grades } = req.body;
  if (!name || !studentClass || !section || !roll || !Array.isArray(grades)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.run(
    'INSERT INTO students (name, class, section, roll) VALUES (?, ?, ?, ?)',
    [name, studentClass, section, roll],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const studentId = this.lastID;
      const gradeStmt = db.prepare('INSERT INTO grades (student_id, subject, score) VALUES (?, ?, ?)');
      grades.forEach(({ subject, score }) => {
        gradeStmt.run(studentId, subject, score);
      });
      gradeStmt.finalize(() => {
        res.json({ id: studentId });
      });
    }
  );
});

app.put('/api/students/:id', (req, res) => {
  const studentId = Number(req.params.id);
  const { name, class: studentClass, section, roll, grades } = req.body;
  if (!name || !studentClass || !section || !roll || !Array.isArray(grades)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.run(
    'UPDATE students SET name = ?, class = ?, section = ?, roll = ? WHERE id = ?',
    [name, studentClass, section, roll, studentId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.run('DELETE FROM grades WHERE student_id = ?', [studentId], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const gradeStmt = db.prepare('INSERT INTO grades (student_id, subject, score) VALUES (?, ?, ?)');
        grades.forEach(({ subject, score }) => {
          gradeStmt.run(studentId, subject, score);
        });
        gradeStmt.finalize(() => {
          res.json({ id: studentId });
        });
      });
    }
  );
});

app.delete('/api/students/:id', (req, res) => {
  const studentId = Number(req.params.id);
  db.run('DELETE FROM grades WHERE student_id = ?', [studentId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM students WHERE id = ?', [studentId], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase();

app.listen(port, () => {
  console.log(`Student Grading System running at http://localhost:${port}`);
});
