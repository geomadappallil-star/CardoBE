import { getDb } from '../db/connection.js';

export class ProductionRepository {
  static getProductionSeries(params: { spiceCode?: string; scope?: string }) {
    const db = getDb();
    const { spiceCode = 'small_cardamom' } = params;

    const query = `
      SELECT 
        p.id,
        s.code as spice_code,
        s.name as spice_name,
        COALESCE(r.name, c.name, 'Global') as geography_name,
        r.region_type,
        c.iso3 as country_iso3,
        substr(p.period_start, 1, 4) as year,
        p.production_value,
        p.production_unit,
        p.area_value,
        p.area_unit,
        p.yield_value,
        p.yield_unit,
        p.quality_status,
        src.organization as source_name
      FROM fact_production p
      JOIN dim_spice s ON p.spice_id = s.id
      LEFT JOIN dim_region r ON p.region_id = r.id
      LEFT JOIN dim_country c ON p.country_id = c.id
      JOIN dim_source src ON p.source_id = src.id
      WHERE s.code = ?
      ORDER BY year ASC, p.production_value DESC
    `;

    return db.prepare(query).all(spiceCode);
  }

  static getIdukkiProductionKPI(spiceCode: string = 'small_cardamom') {
    const db = getDb();
    const query = `
      SELECT 
        substr(p.period_start, 1, 4) as year,
        MAX(CASE WHEN r.name = 'Idukki' THEN p.production_value ELSE 0 END) as idukki_prod,
        MAX(CASE WHEN r.name = 'Kerala' THEN p.production_value ELSE 0 END) as kerala_prod,
        MAX(CASE WHEN c.iso3 = 'IND' AND p.region_id IS NULL THEN p.production_value ELSE 0 END) as india_prod
      FROM fact_production p
      JOIN dim_spice s ON p.spice_id = s.id
      LEFT JOIN dim_region r ON p.region_id = r.id
      LEFT JOIN dim_country c ON p.country_id = c.id
      WHERE s.code = ?
      GROUP BY substr(p.period_start, 1, 4)
      ORDER BY year DESC
      LIMIT 1
    `;
    const row = db.prepare(query).get(spiceCode) as any;
    if (!row) return null;

    const share = row.kerala_prod > 0 ? (row.idukki_prod / row.kerala_prod) * 100 : 0;
    return {
      year: parseInt(row.year),
      idukki_production_tonnes: row.idukki_prod,
      kerala_production_tonnes: row.kerala_prod,
      india_production_tonnes: row.india_prod,
      idukki_share_pct: Math.round(share * 10) / 10
    };
  }
}
