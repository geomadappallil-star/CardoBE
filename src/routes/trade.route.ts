import { FastifyInstance } from 'fastify';
import { TradeRepository } from '../repositories/trade.repository.js';

export async function tradeRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/trade', async (request, reply) => {
    const { spice = 'small_cardamom' } = request.query as { spice?: string };
    const data = TradeRepository.getTradeFlows(spice);
    return { data };
  });

  fastify.get('/api/v1/consumption', async (request, reply) => {
    const { spice = 'small_cardamom' } = request.query as { spice?: string };
    const data = TradeRepository.getConsumption(spice);
    return { data };
  });
}
