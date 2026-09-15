import { FastifyInstance } from 'fastify';
import { WeatherRepository } from '../repositories/weather.repository.js';

export async function weatherRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/weather', async (request, reply) => {
    const { 
      from = '2016-01-01', 
      to = '2026-09-15', 
      frequency = 'monthly' 
    } = request.query as { from?: string; to?: string; frequency?: 'daily' | 'monthly' };

    const data = WeatherRepository.getWeatherSeries({ from, to, frequency });

    return {
      region: 'Idukki',
      baseline_period: '1991-2020',
      data,
      meta: { from, to, frequency, count: data.length }
    };
  });
}
