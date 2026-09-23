import { FastifyInstance } from 'fastify';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Cardo Board Spice Intelligence & Visitor Analytics API',
    version: '1.2.0',
    description: 'Open, unauthenticated REST API for Cardo Board global spice intelligence telemetry, scenario extrapolations, and website visitor analytics.',
    contact: {
      name: 'Cardo Board Platform Team',
      url: 'https://geomadappallil-star.github.io/CardoFE/'
    }
  },
  servers: [
    {
      url: 'https://thgczdlokjrxzakncgwd.supabase.co/rest/v1',
      description: 'Production Supabase Cloud Live Hosted REST Gateway'
    },
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  paths: {
    '/api/v1/visitors/stats': {
      get: {
        summary: 'Get Website Visitor Count & Unique Users',
        description: 'Returns real-time aggregated metrics including total visits, unique user count, device breakdown, and last visit timestamp. Requires no authentication.',
        operationId: 'getVisitorStats',
        responses: {
          '200': {
            description: 'Visitor statistics summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    timestamp: { type: 'string', format: 'date-time' },
                    total_visits: { type: 'integer', example: 148 },
                    unique_visitors: { type: 'integer', example: 42 },
                    active_days: { type: 'integer', example: 5 },
                    mobile_visits: { type: 'integer', example: 68 },
                    desktop_visits: { type: 'integer', example: 80 },
                    last_visit_at: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/visitors/logs': {
      get: {
        summary: 'Pull Raw Website Visitor Logs',
        description: 'Pulls recent individual visitor access logs. Open endpoint with no authentication.',
        operationId: 'getVisitorLogs',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of log records to return (default 50, max 200)',
            required: false,
            schema: { type: 'integer', default: 50 }
          }
        ],
        responses: {
          '200': {
            description: 'List of visitor log records',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    count: { type: 'integer' },
                    logs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          visitor_id: { type: 'string' },
                          page_path: { type: 'string' },
                          active_tab: { type: 'string' },
                          device_type: { type: 'string' },
                          created_at: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/visitors/log': {
      post: {
        summary: 'Log a Website Visit Event',
        description: 'Records an anonymous website visit from the frontend.',
        operationId: 'logVisitorEvent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['visitor_id'],
                properties: {
                  visitor_id: { type: 'string', example: 'usr_8f3d1b9c' },
                  session_id: { type: 'string', example: 'sess_9283471' },
                  page_path: { type: 'string', example: '/' },
                  active_tab: { type: 'string', example: 'overview' },
                  device_type: { type: 'string', example: 'Mobile' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Visit logged successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/dashboard/summary': {
      get: {
        summary: 'Get Dashboard Summary Metrics',
        description: 'Returns latest benchmark prices, auction arrivals, weather anomaly, and regional production dominance.',
        parameters: [
          {
            name: 'spice',
            in: 'query',
            schema: { type: 'string', default: 'small_cardamom' }
          }
        ],
        responses: {
          '200': { description: 'Dashboard summary metrics' }
        }
      }
    },
    '/api/v1/extrapolate': {
      post: {
        summary: 'Run Scenario Extrapolation & Price Forecast',
        description: 'Executes econometric forecast model across weather shocks, supply shifts, demand trends, and inflation drift.'
      }
    }
  }
};

export async function openApiRoutes(fastify: FastifyInstance) {
  // Return raw OpenAPI JSON spec
  fastify.get('/openapi.json', async () => openApiSpec);

  // Return Swagger HTML documentation
  fastify.get('/docs', async (request, reply) => {
    reply.type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cardo Board — OpenAPI Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0b0f19; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
  });

  // Root landing endpoint
  fastify.get('/', async () => ({
    name: 'Cardo Board Spice Intelligence & Analytics API',
    version: '1.2.0',
    status: 'online',
    hosted_frontend: 'https://geomadappallil-star.github.io/CardoFE/',
    endpoints: {
      visitor_stats: '/api/v1/visitors/stats',
      visitor_logs: '/api/v1/visitors/logs',
      log_visit: '/api/v1/visitors/log',
      openapi_spec: '/openapi.json',
      interactive_docs: '/docs',
      health: '/health'
    }
  }));
}
