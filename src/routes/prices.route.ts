import { FastifyInstance } from 'fastify';
import { PriceRepository } from '../repositories/price.repository.js';

export async function priceRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/prices', async (request, reply) => {
    const { 
      spice = 'small_cardamom', 
      from = '2016-01-01', 
      to = '2026-09-15', 
      frequency = 'daily' 
    } = request.query as { spice?: string; from?: string; to?: string; frequency?: 'daily' | 'monthly' | 'annual' };

    const series = PriceRepository.getAggregatedSeries({
      spiceCode: spice,
      from,
      to,
      frequency
    });

    return {
      data: series,
      meta: {
        spice,
        from,
        to,
        frequency,
        points: series.length
      }
    };
  });

  fastify.get('/api/v1/prices/auctions', async (request, reply) => {
    const { spice = 'small_cardamom', limit = '20' } = request.query as { spice?: string; limit?: string };
    const rows = PriceRepository.getRecentAuctions(spice, parseInt(limit, 10));
    return { data: rows };
  });
}
