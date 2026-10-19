import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import {
  validateEnvConfig,
  DEV_DEFAULT_SECRET,
  KNOWN_PLACEHOLDER_SECRETS,
  resolveEnvFilePath,
} from '../src/config/env.js';

describe('Environment Configuration & Session Secret Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Production Session Secret Validation', () => {
    const validProdBase = {
      NODE_ENV: 'production',
      PORT: '5000',
      API_PREFIX: '/api/v1',
      CLIENT_URL: 'https://temarihub.et',
      MONGODB_URI: 'mongodb://localhost:27017/temarihub_prod',
      SESSION_COOKIE_NAME: 'temarihub_sid',
      SESSION_MAX_AGE_MS: '604800000',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '100',
    };

    it('rejects production configuration when SESSION_SECRET is missing', () => {
      const config = { ...validProdBase };
      delete (config as any).SESSION_SECRET;

      expect(() => validateEnvConfig(config)).toThrow(
        /SESSION_SECRET is required in production/
      );
    });

    it('rejects production configuration when SESSION_SECRET is empty or whitespace', () => {
      const config = { ...validProdBase, SESSION_SECRET: '   ' };

      expect(() => validateEnvConfig(config)).toThrow(
        /SESSION_SECRET is required in production/
      );
    });

    it('rejects production configuration when SESSION_SECRET is shorter than 32 characters', () => {
      const config = { ...validProdBase, SESSION_SECRET: 'short-secret-under-32-chars!' };

      expect(() => validateEnvConfig(config)).toThrow(
        /SESSION_SECRET in production must be at least 32 characters long/
      );
    });

    it('rejects production configuration when SESSION_SECRET is the development default', () => {
      const config = { ...validProdBase, SESSION_SECRET: DEV_DEFAULT_SECRET };

      expect(() => validateEnvConfig(config)).toThrow(
        /SESSION_SECRET cannot be a default or placeholder value in production/
      );
    });

    it('rejects production configuration with all known placeholder secrets', () => {
      for (const placeholder of KNOWN_PLACEHOLDER_SECRETS) {
        const config = { ...validProdBase, SESSION_SECRET: placeholder };
        expect(() => validateEnvConfig(config)).toThrow(
          /SESSION_SECRET cannot be a default or placeholder value in production/
        );
      }
    });

    it('accepts a cryptographically strong 32+ character session secret in production', () => {
      const strongSecret = '4a8f9c2d1e0b3a7f6c5d4e3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f';
      const config = { ...validProdBase, SESSION_SECRET: strongSecret };

      const validated = validateEnvConfig(config);
      expect(validated.NODE_ENV).toBe('production');
      expect(validated.SESSION_SECRET).toBe(strongSecret);
      expect(validated.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('2. Development & Test Environment Fallbacks', () => {
    it('permits default secret fallback in development mode', () => {
      const devConfig = {
        NODE_ENV: 'development',
        PORT: '5000',
        API_PREFIX: '/api/v1',
        CLIENT_URL: 'http://localhost:5173',
        MONGODB_URI: 'mongodb://localhost:27017/temarihub_dev',
      };

      const validated = validateEnvConfig(devConfig);
      expect(validated.NODE_ENV).toBe('development');
      expect(validated.SESSION_SECRET).toBe(DEV_DEFAULT_SECRET);
    });

    it('permits default secret fallback in test mode', () => {
      const testConfig = {
        NODE_ENV: 'test',
        PORT: '5000',
        API_PREFIX: '/api/v1',
        CLIENT_URL: 'http://localhost:5173',
        MONGODB_URI: 'mongodb://localhost:27017/temarihub_test',
      };

      const validated = validateEnvConfig(testConfig);
      expect(validated.NODE_ENV).toBe('test');
      expect(validated.SESSION_SECRET).toBe(DEV_DEFAULT_SECRET);
    });
  });

  describe('3. Deterministic Environment File Resolution', () => {
    it('resolves .env from repository root or current directory when present', () => {
      const resolved = resolveEnvFilePath();
      expect(typeof resolved === 'string' || resolved === null).toBe(true);
      if (resolved) {
        expect(fs.existsSync(resolved)).toBe(true);
        expect(resolved.endsWith('.env')).toBe(true);
      }
    });

    it('returns null if no .env exists in candidate directories', () => {
      const resolved = resolveEnvFilePath('C:\\Windows\\System32');
      expect(resolved).toBeNull();
    });
  });
});
