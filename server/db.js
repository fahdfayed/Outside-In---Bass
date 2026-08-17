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
        name VARCHAR(50) UNIQUE NOT NULL,
        intervals VARCHAR(50) NOT NULL,
        characteristic_tone VARCHAR(10),
        formula TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS practice_sessions (
        id SERIAL PRIMARY KEY,
        session_type VARCHAR(50) NOT NULL,
        duration_seconds INT,
        status VARCHAR(20),
        tempo INT,
        key VARCHAR(10),
        mode VARCHAR(50),
        exercises_completed INT DEFAULT 0,
        exercises_total INT DEFAULT 0,
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS recordings (
        id SERIAL PRIMARY KEY,
        session_id INT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        exercise_number INT,
        audio_data BYTEA,
        duration_seconds DECIMAL(10, 2),
        detected_notes JSONB,
        accuracy_score DECIMAL(5, 2),
        tempo_stability DECIMAL(5, 2),
        note_onset_accuracy DECIMAL(5, 2),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        session_id INT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        exercise_number INT,
        key VARCHAR(10),
        mode VARCHAR(50),
        total_notes INT,
        correct_notes INT,
        wrong_notes INT,
        missed_notes INT,
        chromatic_notes INT,
        timing_offset_ms DECIMAL(8, 2),
        register_range JSONB,
        motif_repetitions INT,
        tension_resolution_count INT,
        score DECIMAL(5, 2),
        feedback TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS practice_history (
        id SERIAL PRIMARY KEY,
        exercise_id INT REFERENCES lesson_exercises(id) ON DELETE CASCADE,
        key VARCHAR(10),
        attempts INT DEFAULT 0,
        best_score DECIMAL(5, 2),
        last_attempted TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS weak_areas (
        id SERIAL PRIMARY KEY,
        key VARCHAR(10),
        mode VARCHAR(50),
        area_type VARCHAR(50),
        weakness_score DECIMAL(5, 2),
        recent_failures INT DEFAULT 0,
        priority_level INT DEFAULT 5,
        last_trained TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const query of queries) {
      try {
        await this.query(query);
      } catch (err) {
        console.error('Table creation error:', err);
      }
    }

    await this.migrate();
  },

  // Additive, idempotent schema changes so existing databases pick up new columns.
  async migrate() {
    const migrations = [
      `ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS plan JSONB`,
      `ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS final_tempo INT`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS axis VARCHAR(10)`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS block_type VARCHAR(20)`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS is_repair BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE recordings ADD COLUMN IF NOT EXISTS block_type VARCHAR(20)`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS outside_count INT DEFAULT 0`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS outside_resolved INT DEFAULT 0`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS resolution_rate DECIMAL(5, 2)`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS habits JSONB`
    ];

    for (const migration of migrations) {
      try {
        await this.query(migration);
      } catch (err) {
        console.error('Migration error:', err);
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
