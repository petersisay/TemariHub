import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function startServer(): Promise<void> {
  try {
    console.log(`[TemariHub Server] Starting in ${env.NODE_ENV} mode...`);
    await connectDatabase(env.MONGODB_URI);

    // Automated self-healing database audit: safely prune obsolete sessionTokenHash index
    try {
      const mongooseModule = await import('mongoose');
      const db = mongooseModule.default.connection.db;
      if (db) {
        const sessionCol = db.collection('sessions');
        const sessionIndexes = await sessionCol.indexes().catch(() => []);
        if (sessionIndexes.some((idx: any) => idx.name === 'sessionTokenHash_1')) {
          console.log('[TemariHub Server] Found obsolete sessionTokenHash_1 index on sessions collection. Dropping index...');
          await sessionCol.dropIndex('sessionTokenHash_1');
          console.log('[TemariHub Server] Successfully dropped obsolete sessionTokenHash_1 index from sessions.');
        }

        const userCol = db.collection('users');
        const userIndexes = await userCol.indexes().catch(() => []);
        if (userIndexes.some((idx: any) => idx.name === 'sessionTokenHash_1')) {
          console.log('[TemariHub Server] Found obsolete sessionTokenHash_1 index on users collection. Dropping index...');
          await userCol.dropIndex('sessionTokenHash_1');
          console.log('[TemariHub Server] Successfully dropped obsolete sessionTokenHash_1 index from users.');
        }
      }
    } catch (cleanupErr: any) {
      console.warn('[TemariHub Server] Obsolete index cleanup note:', cleanupErr.message);
    }

    // Automated initial admin bootstrap if configured
    if (env.INITIAL_ADMIN_EMAIL && env.INITIAL_ADMIN_PASSWORD) {
      try {
        const { provisionAdmin } = await import('./scripts/seedAdmin.js');
        const res = await provisionAdmin({
          email: env.INITIAL_ADMIN_EMAIL,
          password: env.INITIAL_ADMIN_PASSWORD,
          name: env.INITIAL_ADMIN_NAME,
          disconnectOnFinish: false,
        });
        console.log(`[TemariHub Server] Initial admin bootstrap status: ${res.status}`);
      } catch (err: any) {
        console.warn(`[TemariHub Server] Initial admin bootstrap warning: ${err.message}`);
      }
    }

    // Trusted sources registry initialization (official Ethiopian institutions)

    // Auto-populate trusted sources registry if empty
    try {
      const { TrustedSource } = await import('./models/TrustedSource.js');
      const sourceCount = await TrustedSource.countDocuments();
      if (sourceCount === 0) {
        console.log('[TemariHub Server] Initializing verified Ethiopian trusted sources registry...');
        const { seedTrustedSources } = await import('./scripts/seedTrustedSources.js');
        await seedTrustedSources(false);
      }
    } catch (err: any) {
      console.warn(`[TemariHub Server] Auto-seed trusted sources warning: ${err.message}`);
    }

    // Start background source monitor and deadline sweep
    if (env.ENABLE_SOURCE_MONITORING) {
      const MONITOR_INTERVAL_MS = (env.SOURCE_MONITOR_INTERVAL_HOURS || 6) * 60 * 60 * 1000;
      const monitorTimer = setInterval(async () => {
        try {
          const { SourceMonitorService } = await import('./modules/sources/sourceMonitor.service.js');
          await SourceMonitorService.checkAllSources();
        } catch (err: any) {
          console.warn(`[TemariHub Server] Background source monitoring error: ${err.message}`);
        }
      }, MONITOR_INTERVAL_MS);
      monitorTimer.unref(); // Don't hold node process alive if shutting down
    }

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
