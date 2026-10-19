import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function startServer(): Promise<void> {
  try {
    console.log(`[TemariHub Server] Starting in ${env.NODE_ENV} mode...`);
    await connectDatabase(env.MONGODB_URI);

    const server = app.listen(env.PORT, () => {
      console.log(`[TemariHub Server] Running on http://localhost:${env.PORT}${env.API_PREFIX}`);
      console.log(`[TemariHub Server] Health check available at http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[TemariHub Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        console.log('[TemariHub Server] HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10s if graceful fails
      setTimeout(() => {
        console.error('[TemariHub Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[TemariHub Server] Fatal error during startup:', error);
    process.exit(1);
  }
}

startServer();
