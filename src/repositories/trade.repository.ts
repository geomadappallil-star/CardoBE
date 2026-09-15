import { getDb } from '../db/connection.js';

export class TradeRepository {
  static getTradeFlows(spiceCode: string = 'small_cardamom') {
    const db = getDb();
    const query = `
      SELECT 
        t.id,
        s.code as spice_code,
        t.flow,
        rc.name as reporter_country,
        rc.iso3 as reporter_iso3,
        pc.name as partner_country,
        pc.iso3 as partner_iso3,
        substr(t.period_start, 1, 4) as year,
        t.quantity as quantity_tonnes,
        t.trade_value as trade_value_usd,
        t.unit_value_usd_per_kg,
        src.organization as source_name,
        t.quality_status
      FROM fact_trade t
      JOIN dim_spice s ON t.spice_id = s.id
      LEFT JOIN dim_country rc ON t.reporter_country_id = rc.id
      LEFT JOIN dim_country pc ON t.partner_country_id = pc.id
      JOIN dim_source src ON t.source_id = src.id
      WHERE s.code = ?
      ORDER BY year DESC, t.trade_value DESC
    `;
    return db.prepare(query).all(spiceCode);
  }

  static getConsumption(spiceCode: string = 'small_cardamom') {
    const db = getDb();
    const query = `
      SELECT 
        c.id,
        s.code as spice_code,
        co.name as country_name,
        co.iso3 as country_iso3,
        c.year,
        c.quantity as food_supply_tonnes,
        c.per_capita_quantity,
        c.per_capita_unit,
        src.organization as source_name,
        c.quality_status
      FROM fact_consumption c
      JOIN dim_spice s ON c.spice_id = s.id
      JOIN dim_country co ON c.country_id = co.id
      JOIN dim_source src ON c.source_id = src.id
      WHERE s.code = ?
      ORDER BY c.year ASC, co.name ASC
    `;
    return db.prepare(query).all(spiceCode);
  }
}
