import { FastifyInstance } from 'fastify';
import { PriceRepository } from '../repositories/price.repository.js';
import { WeatherRepository } from '../repositories/weather.repository.js';
import { ProductionRepository } from '../repositories/production.repository.js';
import { DimensionRepository } from '../repositories/dimension.repository.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/dashboard/summary', async (request, reply) => {
    const { spice = 'small_cardamom' } = request.query as { spice?: string; scope?: string };

    const latest = PriceRepository.getLatestPrice(spice);
    let change30d = 0;
    if (latest) {
      const past = PriceRepository.getPrice30DaysAgo(spice, latest.date);
      if (past && past.avg_price > 0) {
        change30d = Math.round(((latest.avg_price - past.avg_price) / past.avg_price) * 1000) / 10;
      }
    }

    const weatherStatus = WeatherRepository.getLatestMonsoonStatus();
    const prodKpi = ProductionRepository.getIdukkiProductionKPI(spice);
    const recentAuctions = PriceRepository.getRecentAuctions(spice, 8);
    const qualityInfo = DimensionRepository.getDataQualitySummary();

    return {
      latest_price: latest ? {
        spice_code: latest.spice_code,
        spice_name: latest.spice_name,
        date: latest.date,
        avg_price: latest.avg_price,
        min_price: latest.min_price,
        max_price: latest.max_price,
        currency: latest.currency,
        unit: latest.unit,
        change_30d_pct: change30d,
      } : null,
      latest_arrival: latest ? {
        date: latest.date,
        arrived_kg: latest.quantity,
        sold_kg: latest.quantity_sold,
        market: latest.seller_or_auctioneer,
      } : null,
      weather_status: weatherStatus,
      production_overview: prodKpi,
      recent_auctions: recentAuctions,
      data_quality: qualityInfo,
    };
  });
}
