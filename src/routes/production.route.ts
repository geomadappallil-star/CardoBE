import { FastifyInstance } from 'fastify';
import { ProductionRepository } from '../repositories/production.repository.js';

export async function productionRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/production', async (request, reply) => {
    const { spice = 'small_cardamom' } = request.query as { spice?: string };
    const data = ProductionRepository.getProductionSeries({ spiceCode: spice });
    return { data };
  });
}
