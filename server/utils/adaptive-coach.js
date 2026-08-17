export class AdaptiveCoach {
  constructor(db) {
    this.db = db;
  }

  async generateNextSession(userId) {
    try {
      const weakAreas = await this.getWeakAreas();
      const recentPerformance = await this.getRecentPerformance();
      const untestKeys = await this.getUntestKeys();

      const priorities = this.rankPriorities(weakAreas, recentPerformance, untestKeys);
      const exercises = await this.selectExercises(priorities);

      return {
        type: 'adaptive',
        priority_focus: priorities[0],
        exercises,
        estimated_duration: this.estimateDuration(exercises),
        reasoning: this.explainRecommendation(priorities)
      };
    } catch (err) {
      console.error('Error generating next session:', err);
      throw err;
    }
  }

  async getWeakAreas() {
    const result = await this.db.query(
      `SELECT * FROM weak_areas
       WHERE weakness_score > 0
       ORDER BY priority_level DESC, weakness_score DESC
       LIMIT 10`
    );
    return result.rows;
  }

  async getRecentPerformance() {
    const result = await this.db.query(
      `SELECT
         key, mode, AVG(score) as avg_score, COUNT(*) as attempts
       FROM performance_metrics
       WHERE created_at > NOW() - INTERVAL '7 days'
       GROUP BY key, mode
       ORDER BY avg_score ASC
       LIMIT 10`
    );
    return result.rows;
  }

  async getUntestKeys() {
    const allKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // performance_metrics is the real evidence table — a key counts as tested
    // only when it was actually played and scored.
    const result = await this.db.query(
      `SELECT DISTINCT key FROM performance_metrics
       WHERE created_at > NOW() - INTERVAL '30 days'`
    );

    const testedKeys = new Set(result.rows.map(row => row.key));
    return allKeys.filter(key => !testedKeys.has(key));
  }

  rankPriorities(weakAreas, recentPerformance, untestKeys) {
    const priorities = [];

    for (const weak of weakAreas) {
      const score = Number(weak.weakness_score);
      priorities.push({
        key: weak.key,
        mode: weak.mode,
        type: 'weakness',
        reason: `${weak.area_type} weakness - Score: ${score.toFixed(1)}`,
        weight: score * weak.priority_level
      });
    }

    for (const perf of recentPerformance) {
      const avgScore = Number(perf.avg_score);
      if (avgScore < 60) {
        priorities.push({
          key: perf.key,
          mode: perf.mode,
          type: 'low_performance',
          reason: `Low recent performance in ${perf.key} ${perf.mode} - ${perf.attempts} attempts`,
          weight: (100 - avgScore) * 0.5
        });
      }
    }

    for (const key of untestKeys.slice(0, 3)) {
      priorities.push({
        key,
        mode: 'Ionian',
        type: 'untested',
        reason: `Not tested in ${key} recently`,
        weight: 30
      });
    }

    return priorities.sort((a, b) => b.weight - a.weight).slice(0, 5);
  }

  async selectExercises(priorities) {
    if (priorities.length === 0) {
      return this.getMaintenanceExercises();
    }

    const primary = priorities[0];
    const result = await this.db.query(
      `SELECT le.*, l.mode FROM lesson_exercises le
       JOIN lessons l ON le.lesson_id = l.id
       WHERE l.mode = $1
       LIMIT 5`,
      [primary.mode]
    );

    return result.rows.map((ex, idx) => ({
      ...ex,
      sequence: idx,
      key: primary.key,
      mode: primary.mode,
      difficulty: this.assignDifficulty(idx),
      tempo: 80 + idx * 10
    }));
  }

  async getMaintenanceExercises() {
    const result = await this.db.query(
      `SELECT le.*, l.mode FROM lesson_exercises le
       JOIN lessons l ON le.lesson_id = l.id
       ORDER BY RANDOM()
       LIMIT 4`
    );

    return result.rows.map((ex, idx) => ({
      ...ex,
      sequence: idx,
      difficulty: 'intermediate',
      tempo: 100
    }));
  }

  assignDifficulty(index) {
    const difficulties = ['fundamental', 'beginner', 'intermediate', 'advanced', 'mastery'];
    return difficulties[Math.min(index, difficulties.length - 1)];
  }

  estimateDuration(exercises) {
    const baseTime = 2; // 2 minutes per exercise
    const totalSeconds = exercises.length * baseTime * 60;
    return { seconds: totalSeconds, minutes: Math.ceil(totalSeconds / 60) };
  }

  explainRecommendation(priorities) {
    if (priorities.length === 0) {
      return 'Maintenance session - continue building consistency';
    }

    const reasons = priorities.slice(0, 2).map(p => p.reason);
    return `Focus on: ${reasons.join('; ')}`;
  }

  async updateWeakAreas(metrics) {
    for (const metric of metrics) {
      if (metric.score < 70) {
        const existing = await this.db.query(
          `SELECT * FROM weak_areas WHERE key = $1 AND mode = $2`,
          [metric.key, metric.mode]
        );

        if (existing.rows.length > 0) {
          await this.db.query(
            `UPDATE weak_areas
             SET weakness_score = weakness_score + $1,
                 recent_failures = recent_failures + 1,
                 updated_at = NOW(),
                 priority_level = LEAST(10, recent_failures)
             WHERE key = $2 AND mode = $3`,
            [100 - metric.score, metric.key, metric.mode]
          );
        } else {
          await this.db.query(
            `INSERT INTO weak_areas (key, mode, area_type, weakness_score, recent_failures, priority_level)
             VALUES ($1, $2, $3, $4, 1, 1)`,
            [metric.key, metric.mode, 'general', 100 - metric.score]
          );
        }
      }
    }
  }

  async recordSuccess(key, mode, exerciseId) {
    const existing = await this.db.query(
      `SELECT * FROM practice_history WHERE exercise_id = $1 AND key = $2`,
      [exerciseId, key]
    );

    if (existing.rows.length > 0) {
      await this.db.query(
        `UPDATE practice_history
         SET attempts = attempts + 1,
             last_attempted = NOW(),
             updated_at = NOW()
         WHERE exercise_id = $1 AND key = $2`,
        [exerciseId, key]
      );
    } else {
      await this.db.query(
        `INSERT INTO practice_history (exercise_id, key, attempts, last_attempted)
         VALUES ($1, $2, 1, NOW())`,
        [exerciseId, key]
      );
    }

    // Clear weakness if score was high
    await this.db.query(
      `UPDATE weak_areas
       SET recent_failures = GREATEST(0, recent_failures - 1)
       WHERE key = $1 AND mode = $2 AND recent_failures > 0`,
      [key, mode]
    );
  }
}
