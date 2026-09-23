import { FastifyInstance } from 'fastify';
import { VisitorRepository } from '../repositories/visitor.repository.js';

export async function visitorRoutes(fastify: FastifyInstance) {
  /**
   * Log a new website visit (unauthenticated open endpoint)
   */
  fastify.post('/api/v1/visitors/log', async (request, reply) => {
    const body = (request.body || {}) as any;

    if (!body.visitor_id) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'visitor_id is required',
      });
    }

    const userAgent = request.headers['user-agent'] || body.user_agent;
    const referrer = request.headers['referer'] || body.referrer;

    const result = await VisitorRepository.logVisit({
      visitor_id: body.visitor_id,
      session_id: body.session_id,
      page_path: body.page_path || '/',
      active_tab: body.active_tab || 'overview',
      device_type: body.device_type || (userAgent?.toLowerCase().includes('mobi') ? 'Mobile' : 'Desktop'),
      user_agent: userAgent,
      referrer: referrer,
    });

    return reply.status(201).send(result);
  });

  /**
   * Get visitor metrics & unique user count (unauthenticated open endpoint)
   */
  fastify.get('/api/v1/visitors/stats', async (request, reply) => {
    const stats = await VisitorRepository.getStats();
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      ...stats,
    };
  });

  /**
   * Get recent visitor logs (unauthenticated open endpoint)
   */
  fastify.get('/api/v1/visitors/logs', async (request, reply) => {
    const { limit = '50' } = request.query as { limit?: string };
    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    const logs = await VisitorRepository.getLogs(numLimit);
    return {
      status: 'success',
      count: logs.length,
      logs,
    };
  });
}
