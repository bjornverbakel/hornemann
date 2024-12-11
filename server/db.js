const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../database/votes.db");
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        option TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Save a vote to the database
const saveVote = (option) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO votes (option) VALUES (?)", [option], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Get all votes from the database
const getVotes = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM votes", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = { saveVote, getVotes };
