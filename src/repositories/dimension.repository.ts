import { getDb } from '../db/connection.js';

export class DimensionRepository {
  static getSpices() {
    return getDb().prepare("SELECT * FROM dim_spice WHERE active = 1 ORDER BY id ASC").all();
  }

  static getRegions() {
    return getDb().prepare(`
      SELECT r.*, c.name as country_name, c.iso3 as country_iso3 
      FROM dim_region r 
      JOIN dim_country c ON r.country_id = c.id
      ORDER BY r.id ASC
    `).all();
  }

  static getCountries() {
    return getDb().prepare("SELECT * FROM dim_country ORDER BY name ASC").all();
  }

  static getMarkets() {
    return getDb().prepare(`
      SELECT m.*, r.name as region_name 
      FROM dim_market m 
      JOIN dim_region r ON m.region_id = r.id
      ORDER BY m.id ASC
    `).all();
  }

  static getSources() {
    return getDb().prepare("SELECT * FROM dim_source ORDER BY id ASC").all();
  }

  static getDataQualitySummary() {
    const db = getDb();
    const qualityCounts = db.prepare(`
      SELECT quality_status, count(*) as count 
      FROM fact_price 
      GROUP BY quality_status
    `).all() as any[];

    const totalFacts = db.prepare(`
      SELECT 
        (SELECT count(*) FROM fact_price) +
        (SELECT count(*) FROM fact_weather) +
        (SELECT count(*) FROM fact_production) +
        (SELECT count(*) FROM fact_trade) +
        (SELECT count(*) FROM fact_consumption) as total
    `).get() as any;

    const runs = db.prepare("SELECT * FROM data_quality_run ORDER BY id DESC LIMIT 5").all();

    return {
      quality_breakdown: qualityCounts,
      total_records: totalFacts.total,
      runs
    };
  }
}
