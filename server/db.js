import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const connection = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432
};

const DATABASE = process.env.DB_NAME || 'bass_practice';

const pool = new Pool({ ...connection, database: DATABASE });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Per-query logging is noise in normal operation; set DB_DEBUG=1 to see it.
const DEBUG_SQL = process.env.DB_DEBUG === '1';
const oneLine = (sql) => sql.replace(/\s+/g, ' ').trim().slice(0, 120);

// Postgres reports "database does not exist" as SQLSTATE 3D000.
const UNDEFINED_DATABASE = '3D000';

/**
 * Create the application database if it is missing.
 *
 * Requiring a separate `createdb` step is a real obstacle on Windows, where the
 * PostgreSQL bin folder is not on PATH by default and the command simply is not
 * found. The server can do it itself by connecting to the always-present
 * `postgres` maintenance database.
 */
async function createDatabaseIfMissing() {
  const admin = new Pool({ ...connection, database: 'postgres' });
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      DATABASE
    ]);
    if (exists.rowCount === 0) {
      // The database name cannot be parameterised, so it is quoted as an identifier.
      await admin.query(`CREATE DATABASE "${DATABASE.replace(/"/g, '""')}"`);
      console.log(`Created database "${DATABASE}"`);
    }
    return true;
  } catch (err) {
    console.error(`Could not create database "${DATABASE}":`, err.message);
    return false;
  } finally {
    await admin.end().catch(() => {});
  }
}

function explainConnectionFailure(err) {
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOENT') {
    return (
      `Could not reach PostgreSQL at ${connection.host}:${connection.port}. ` +
      'Is the server running? On Windows, check the "postgresql-x64-<version>" ' +
      'service in Services, or run: pg_ctl status'
    );
  }
  if (err.code === '28P01') {
    return (
      `Password authentication failed for user "${connection.user}". ` +
      'Check DB_USER and DB_PASSWORD in your .env file.'
    );
  }
  return err.message;
}

const RETRY_SECONDS = 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const db = {
  // True once the schema is in place and routes can safely query.
  ready: false,

  /**
   * Wait for PostgreSQL rather than exiting.
   *
   * Exiting looks tidy but behaves badly under `node --watch`, which traps the
   * exit and parks the process — so the API never comes up, the Vite proxy floods
   * the console with ECONNREFUSED, and the one line explaining why scrolls away.
   * Retrying instead means you can start PostgreSQL after the app and it simply
   * connects, with no restart.
   */
  async init() {
    let explained = false;

    for (;;) {
      try {
        await this.query('SELECT NOW()', undefined, { quiet: true });
        break;
      } catch (err) {
        if (err.code === UNDEFINED_DATABASE && (await createDatabaseIfMissing())) {
          continue;
        }
        if (!explained) {
          console.error('Database unavailable:', explainConnectionFailure(err));
          console.error(`Retrying every ${RETRY_SECONDS}s — start PostgreSQL and this will connect on its own.`);
          explained = true;
        }
        await sleep(RETRY_SECONDS * 1000);
      }
    }

    console.log('Database connected');
    await this.createTables();
    this.ready = true;
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
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS habits JSONB`,
      `ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS exercise_id VARCHAR(10)`,
      `CREATE TABLE IF NOT EXISTS course_progress (
        quiz_id VARCHAR(10) PRIMARY KEY,
        attempts INT DEFAULT 0,
        best_score DECIMAL(5, 2) DEFAULT 0,
        passed BOOLEAN DEFAULT FALSE,
        weak_topics TEXT[],
        last_attempt TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const migration of migrations) {
      try {
        await this.query(migration);
      } catch (err) {
        console.error('Migration error:', err);
      }
    }
  },

  async query(text, params, { quiet = false } = {}) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      if (DEBUG_SQL) {
        console.log('SQL', { text: oneLine(text), ms: Date.now() - start, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      // Log the message, not the whole error object. Callers that can say
      // something more useful — init(), for one — do so and would otherwise be
      // buried under a page of stack trace.
      if (!quiet) {
        console.error(`SQL error (${error.code ?? 'no code'}): ${error.message}`);
        if (DEBUG_SQL) console.error('  in:', oneLine(text));
      }
      throw error;
    }
  }
};

export default db;
