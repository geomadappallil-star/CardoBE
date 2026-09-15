import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ExtrapolationService } from '../services/extrapolation.service.js';

const ExtrapolationSchema = z.object({
  spice: z.string().default('small_cardamom'),
  horizon_months: z.number().min(3).max(36).default(12),
  weather_shock_pct: z.number().min(-50).max(50).default(0),
  supply_shock_pct: z.number().min(-50).max(50).default(0),
  demand_shock_pct: z.number().min(-50).max(50).default(0),
  inflation_pct: z.number().min(0).max(20).default(4),
});

export async function extrapolateRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/extrapolate', async (request, reply) => {
    const parseResult = ExtrapolationSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      reply.status(400);
      return { error: parseResult.error.format() };
    }

    const {
      spice,
      horizon_months,
      weather_shock_pct,
      supply_shock_pct,
      demand_shock_pct,
      inflation_pct,
    } = parseResult.data;

    const result = ExtrapolationService.extrapolate({
      spiceCode: spice,
      horizonMonths: horizon_months,
      weatherShockPct: weather_shock_pct,
      supplyShockPct: supply_shock_pct,
      demandShockPct: demand_shock_pct,
      inflationPct: inflation_pct,
    });

    return result;
  });
}
