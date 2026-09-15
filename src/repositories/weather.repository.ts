import { getDb } from '../db/connection.js';

export class WeatherRepository {
  static getWeatherSeries(params: { from?: string; to?: string; frequency?: 'daily' | 'monthly' }) {
    const db = getDb();
    const { from = '2016-01-01', to = '2026-09-15', frequency = 'daily' } = params;

    if (frequency === 'monthly') {
      const query = `
        SELECT 
          substr(date, 1, 7) as date,
          ROUND(SUM(rainfall_mm), 1) as rainfall_mm,
          ROUND(SUM(baseline_rainfall_mm), 1) as baseline_rainfall_mm,
          ROUND(SUM(rainfall_mm) - SUM(baseline_rainfall_mm), 1) as anomaly_mm,
          ROUND(
            CASE 
              WHEN SUM(baseline_rainfall_mm) > 0 
              THEN ((SUM(rainfall_mm) - SUM(baseline_rainfall_mm)) / SUM(baseline_rainfall_mm)) * 100 
              ELSE 0 
            END, 
            1
          ) as anomaly_pct,
          ROUND(AVG(tmin_c), 1) as tmin_c,
          ROUND(AVG(tmax_c), 1) as tmax_c,
          ROUND(AVG(tmean_c), 1) as tmean_c,
          ROUND(AVG(soil_moisture), 3) as soil_moisture
        FROM fact_weather
        WHERE region_id = 2 AND date >= ? AND date <= ?
        GROUP BY substr(date, 1, 7)
        ORDER BY date ASC
      `;
      return db.prepare(query).all(from, to);
    }

    const query = `
      SELECT 
        date,
        rainfall_mm,
        baseline_rainfall_mm,
        rainfall_anomaly_mm as anomaly_mm,
        ROUND(
          CASE 
            WHEN baseline_rainfall_mm > 0 
            THEN ((rainfall_mm - baseline_rainfall_mm) / baseline_rainfall_mm) * 100 
            ELSE 0 
          END, 
          1
        ) as anomaly_pct,
        tmin_c,
        tmax_c,
        tmean_c,
        humidity_pct,
        soil_moisture
      FROM fact_weather
      WHERE region_id = 2 AND date >= ? AND date <= ?
      ORDER BY date ASC
    `;
    return db.prepare(query).all(from, to);
  }

  static getLatestMonsoonStatus() {
    const db = getDb();
    // Get latest available month in database
    const query = `
      SELECT 
        substr(date, 1, 7) as month,
        ROUND(SUM(rainfall_mm), 1) as actual_mm,
        ROUND(SUM(baseline_rainfall_mm), 1) as baseline_mm
      FROM fact_weather
      WHERE region_id = 2
      GROUP BY substr(date, 1, 7)
      ORDER BY month DESC
      LIMIT 1
    `;
    const row = db.prepare(query).get() as any;
    if (!row) return null;

    const diff = row.actual_mm - row.baseline_mm;
    const pct = row.baseline_mm > 0 ? (diff / row.baseline_mm) * 100 : 0;
    let status: 'NORMAL' | 'DEFICIT' | 'EXCESS' = 'NORMAL';
    if (pct < -20) status = 'DEFICIT';
    else if (pct > 20) status = 'EXCESS';

    return {
      region: 'Idukki',
      month: row.month,
      rainfall_actual_mm: row.actual_mm,
      rainfall_baseline_mm: row.baseline_mm,
      anomaly_mm: Math.round(diff * 10) / 10,
      anomaly_pct: Math.round(pct * 10) / 10,
      status
    };
  }
}
