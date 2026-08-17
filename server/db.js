import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bass_practice'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const db = {
  async init() {
    try {
      await this.query('SELECT NOW()');
      console.log('Database connected');
      await this.createTables();
    } catch (err) {
      console.error('Database connection failed', err);
      process.exit(1);
    }
  },

  async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        number INT UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        mode VARCHAR(50),
        concept_focus TEXT,
        content JSONB,
        listening_goals TEXT[],
        pass_criteria TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS lesson_exercises (
        id SERIAL PRIMARY KEY,
        lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
        exercise_number INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50),
        fretboard_data JSONB,
        audio_target JSONB,
        tempo INT,
        duration_seconds INT,
        success_criteria TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS fretboard_notes (
        id SERIAL PRIMARY KEY,
        note_name VARCHAR(10) NOT NULL,
        fret_number INT NOT NULL,
        string_number INT NOT NULL,
        octave INT,
        frequency DECIMAL(8, 2),
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS modes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        intervals VARCHAR(50) NOT NULL,
        characteristic_tone VARCHAR(10),
        formula TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const query of queries) {
      try {
        await this.query(query);
      } catch (err) {
        console.error('Table creation error:', err);
      }
    }
  },

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error', { text, error });
      throw error;
    }
  }
};

export default db;
