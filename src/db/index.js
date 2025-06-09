import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'barbershop.db'));
db.pragma('foreign_keys = ON');

// Appointments
export const createAppointment = db.prepare(`
  INSERT INTO appointments (id, date, time, client_name, client_phone, service, confirmed)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

export const getAppointments = db.prepare(`
  SELECT * FROM appointments
  ORDER BY date, time
`);

export const getAppointmentsByDate = db.prepare(`
  SELECT * FROM appointments
  WHERE date = ?
  ORDER BY time
`);

// Holidays
export const createHoliday = db.prepare(`
  INSERT INTO holidays (id, date, description)
  VALUES (?, ?, ?)
`);

export const getHolidays = db.prepare(`
  SELECT * FROM holidays
  ORDER BY date
`);

export const deleteHoliday = db.prepare(`
  DELETE FROM holidays
  WHERE id = ?
`);

// Blocked Times
export const createBlockedTime = db.prepare(`
  INSERT INTO blocked_times (id, date, time, reason)
  VALUES (?, ?, ?, ?)
`);

export const getBlockedTimes = db.prepare(`
  SELECT * FROM blocked_times
  ORDER BY date, time
`);

export const getBlockedTimesByDate = db.prepare(`
  SELECT * FROM blocked_times
  WHERE date = ?
  ORDER BY time
`);

export const deleteBlockedTime = db.prepare(`
  DELETE FROM blocked_times
  WHERE id = ?
`);

export default db;