import { FastifyInstance } from 'fastify';
import { DimensionRepository } from '../repositories/dimension.repository.js';

export async function dimensionRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/spices', async () => ({ data: DimensionRepository.getSpices() }));
  fastify.get('/api/v1/regions', async () => ({ data: DimensionRepository.getRegions() }));
  fastify.get('/api/v1/countries', async () => ({ data: DimensionRepository.getCountries() }));
  fastify.get('/api/v1/markets', async () => ({ data: DimensionRepository.getMarkets() }));
  fastify.get('/api/v1/sources', async () => ({ data: DimensionRepository.getSources() }));
  fastify.get('/api/v1/quality', async () => ({ data: DimensionRepository.getDataQualitySummary() }));
}
