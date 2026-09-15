import { getDb } from '../db/connection.js';

export interface PriceQueryFilters {
  spiceCode?: string;
  from?: string;
  to?: string;
  frequency?: 'daily' | 'monthly' | 'annual';
  marketId?: number;
  limit?: number;
}

export class PriceRepository {
  static getLatestPrice(spiceCode: string = 'small_cardamom') {
    const db = getDb();
    const query = `
      SELECT 
        p.*, 
        s.code as spice_code, 
        s.name as spice_name,
        src.organization as source_name
      FROM fact_price p
      JOIN dim_spice s ON p.spice_id = s.id
      JOIN dim_source src ON p.source_id = src.id
      WHERE s.code = ?
      ORDER BY p.date DESC, p.id DESC
      LIMIT 1
    `;
    return db.prepare(query).get(spiceCode) as any;
  }

  static getPrice30DaysAgo(spiceCode: string = 'small_cardamom', currentDate: string) {
    const db = getDb();
    const query = `
      SELECT p.avg_price, p.date
      FROM fact_price p
      JOIN dim_spice s ON p.spice_id = s.id
      WHERE s.code = ? AND p.date <= date(?, '-30 days')
      ORDER BY p.date DESC
      LIMIT 1
    `;
    return db.prepare(query).get(spiceCode, currentDate) as any;
  }

  static getRecentAuctions(spiceCode: string = 'small_cardamom', limit: number = 20) {
    const db = getDb();
    const query = `
      SELECT 
        p.id,
        p.date,
        s.code as spice_code,
        s.name as spice_name,
        m.name as market_name,
        p.seller_or_auctioneer,
        p.price_type,
        p.min_price,
        p.max_price,
        p.avg_price,
        p.currency,
        p.unit,
        p.quantity as quantity_arrived,
        p.quantity_sold,
        p.quality_status,
        src.organization as source_name
      FROM fact_price p
      JOIN dim_spice s ON p.spice_id = s.id
      LEFT JOIN dim_market m ON p.market_id = m.id
      JOIN dim_source src ON p.source_id = src.id
      WHERE s.code = ?
      ORDER BY p.date DESC, p.id DESC
      LIMIT ?
    `;
    return db.prepare(query).all(spiceCode, limit);
  }

  static getAggregatedSeries(filters: PriceQueryFilters) {
    const db = getDb();
    const { spiceCode = 'small_cardamom', from = '2016-01-01', to = '2026-09-15', frequency = 'daily' } = filters;

    let dateGrouping = "p.date";
    if (frequency === 'monthly') {
      dateGrouping = "substr(p.date, 1, 7)"; // YYYY-MM
    } else if (frequency === 'annual') {
      dateGrouping = "substr(p.date, 1, 4)"; // YYYY
    }

    const query = `
      SELECT 
        ${dateGrouping} as date,
        ROUND(AVG(p.avg_price), 2) as unweighted_mean,
        ROUND(
          CASE 
            WHEN SUM(COALESCE(p.quantity_sold, p.quantity, 0)) > 0 
            THEN SUM(p.avg_price * COALESCE(p.quantity_sold, p.quantity, 0)) / SUM(COALESCE(p.quantity_sold, p.quantity, 0))
            ELSE AVG(p.avg_price)
          END, 
          2
        ) as weighted_mean,
        ROUND(MIN(p.min_price), 2) as min_price,
        ROUND(MAX(p.max_price), 2) as max_price,
        ROUND(SUM(COALESCE(p.quantity, 0)), 1) as total_arrived_kg,
        ROUND(SUM(COALESCE(p.quantity_sold, 0)), 1) as total_sold_kg,
        COUNT(*) as auction_count
      FROM fact_price p
      JOIN dim_spice s ON p.spice_id = s.id
      WHERE s.code = ? 
        AND p.date >= ? 
        AND p.date <= ?
      GROUP BY ${dateGrouping}
      ORDER BY date ASC
    `;

    return db.prepare(query).all(spiceCode, from, to);
  }
}
