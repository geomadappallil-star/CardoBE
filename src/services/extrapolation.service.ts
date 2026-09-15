import { getDb } from '../db/connection.js';

export interface ExtrapolationParams {
  spiceCode: string;
  horizonMonths: number; // 6, 12, 18, 24
  weatherShockPct: number; // -40 to +40 (% deviation in monsoon rainfall)
  supplyShockPct: number; // -25 to +25 (% change in crop harvest)
  demandShockPct: number; // -20 to +30 (% change in export/domestic demand)
  inflationPct?: number; // annual baseline drift (default 4%)
}

export class ExtrapolationService {
  static extrapolate(params: ExtrapolationParams) {
    const db = getDb();
    const {
      spiceCode = 'small_cardamom',
      horizonMonths = 12,
      weatherShockPct = 0,
      supplyShockPct = 0,
      demandShockPct = 0,
      inflationPct = 4.0,
    } = params;

    // 1. Fetch trailing 12 months historical data
    const histQuery = `
      SELECT 
        substr(p.date, 1, 7) as month,
        ROUND(AVG(p.avg_price), 2) as avg_price,
        ROUND(
          CASE 
            WHEN SUM(COALESCE(p.quantity_sold, p.quantity, 0)) > 0 
            THEN SUM(p.avg_price * COALESCE(p.quantity_sold, p.quantity, 0)) / SUM(COALESCE(p.quantity_sold, p.quantity, 0))
            ELSE AVG(p.avg_price)
          END, 
          2
        ) as weighted_price,
        ROUND(SUM(COALESCE(p.quantity, 0)), 1) as total_arrivals_kg
      FROM fact_price p
      JOIN dim_spice s ON p.spice_id = s.id
      WHERE s.code = ?
      GROUP BY substr(p.date, 1, 7)
      ORDER BY month DESC
      LIMIT 12
    `;
    const histRows = (db.prepare(histQuery).all(spiceCode) as any[]).reverse();

    if (histRows.length === 0) {
      throw new Error(`No historical data found for spice: ${spiceCode}`);
    }

    const latest = histRows[histRows.length - 1];
    const basePrice = latest.weighted_price || latest.avg_price;
    const baseArrivals = latest.total_arrivals_kg || 2500000;

    // Split latest date (YYYY-MM)
    const [latestYearStr, latestMonthStr] = latest.month.split('-');
    let currYear = parseInt(latestYearStr, 10);
    let currMonth = parseInt(latestMonthStr, 10);

    // 2. Extrapolation algorithm
    // Net price elasticity:
    // - Reduced rainfall (negative shock) shrinks yields -> raises price (-0.55 elasticity)
    // - Supply drop (-supplyShock) raises price (-0.7 elasticity)
    // - Demand increase (+demandShock) raises price (+0.8 elasticity)
    const netPriceImpactPct = 
      (demandShockPct * 0.75) - 
      (supplyShockPct * 0.70) - 
      (weatherShockPct * 0.50);

    const monthlyInflationRate = (inflationPct / 100.0) / 12.0;

    const projections = [];
    let cumulativePriceSum = 0;

    for (let i = 1; i <= horizonMonths; i++) {
      currMonth++;
      if (currMonth > 12) {
        currMonth = 1;
        currYear++;
      }
      const monthStr = currMonth < 10 ? `0${currMonth}` : `${currMonth}`;
      const projDate = `${currYear}-${monthStr}`;

      // Progress factor towards steady state shock (gradually phases in over 4 months)
      const phaseIn = Math.min(1.0, i / 4.0);
      const shockMultiplier = 1.0 + (netPriceImpactPct / 100.0) * phaseIn;
      const inflationMultiplier = Math.pow(1.0 + monthlyInflationRate, i);

      // Seasonal price adjustment
      // Peak lean season (June-August) carries +4% to +8% seasonal price premium
      let seasonalFactor = 1.0;
      if (currMonth in [6, 7, 8]) seasonalFactor = 1.06;
      else if (currMonth in [10, 11, 12]) seasonalFactor = 0.96; // harvest flush

      const baselinePrice = Math.round(basePrice * shockMultiplier * inflationMultiplier * seasonalFactor * 100) / 100;
      
      // Uncertainty spread widens over time (+/- 5% base + 1.2% * sqrt(month))
      const spreadPct = 0.05 + 0.012 * Math.sqrt(i);
      const bullishPrice = Math.round(baselinePrice * (1.0 + spreadPct) * 100) / 100;
      const bearishPrice = Math.round(baselinePrice * (1.0 - spreadPct) * 100) / 100;

      // Projected arrivals: weather and supply affect volume directly
      const volumeMultiplier = Math.max(0.4, 1.0 + (supplyShockPct / 100.0) + (weatherShockPct / 100.0) * 0.35);
      const projArrivals = Math.round(baseArrivals * volumeMultiplier);

      projections.push({
        date: projDate,
        baseline_price: baselinePrice,
        bullish_price: bullishPrice,
        bearish_price: bearishPrice,
        projected_arrivals_kg: projArrivals,
        uncertainty_spread_pct: Math.round(spreadPct * 200 * 10) / 10,
      });

      cumulativePriceSum += baselinePrice;
    }

    const projectedEndPrice = projections[projections.length - 1].baseline_price;
    const projectedChangePct = Math.round(((projectedEndPrice - basePrice) / basePrice) * 1000) / 10;
    const avgProjectedPrice = Math.round((cumulativePriceSum / horizonMonths) * 100) / 100;

    // Qualitative assessment
    let narrative = "Stable market conditions projected under balanced supply and demand assumptions.";
    if (netPriceImpactPct > 15) {
      narrative = "Bullish price breakout expected due to combined supply tightening and sustained demand pressure.";
    } else if (netPriceImpactPct < -15) {
      narrative = "Bearish price correction anticipated driven by supply recovery and softening export inquiries.";
    } else if (weatherShockPct < -20) {
      narrative = "Elevated moisture stress in cultivation belts is compressing projected harvest volume and elevating price support.";
    }

    return {
      meta: {
        spice_code: spiceCode,
        horizon_months: horizonMonths,
        weather_shock_pct: weatherShockPct,
        supply_shock_pct: supplyShockPct,
        demand_shock_pct: demandShockPct,
        inflation_pct: inflationPct,
      },
      current_metrics: {
        latest_historical_month: latest.month,
        base_price: basePrice,
        base_arrivals_kg: baseArrivals,
      },
      summary: {
        avg_projected_price: avgProjectedPrice,
        projected_end_price: projectedEndPrice,
        projected_change_pct: projectedChangePct,
        narrative,
      },
      historical: histRows.map(r => ({
        date: r.month,
        price: r.weighted_price,
        arrivals_kg: r.total_arrivals_kg,
      })),
      projections,
    };
  }
}
