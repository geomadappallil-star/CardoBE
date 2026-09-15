import Fastify from 'fastify';
import cors from '@fastify/cors';
import { dashboardRoutes } from './routes/dashboard.route.js';
import { priceRoutes } from './routes/prices.route.js';
import { weatherRoutes } from './routes/weather.route.js';
import { productionRoutes } from './routes/production.route.js';
import { tradeRoutes } from './routes/trade.route.js';
import { dimensionRoutes } from './routes/dimensions.route.js';
import { extrapolateRoutes } from './routes/extrapolate.route.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: true
});

// Register routes
await fastify.register(dashboardRoutes);
await fastify.register(priceRoutes);
await fastify.register(weatherRoutes);
await fastify.register(productionRoutes);
await fastify.register(tradeRoutes);
await fastify.register(dimensionRoutes);
await fastify.register(extrapolateRoutes);

fastify.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

try {
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`Cardo Board API Server running on port ${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
