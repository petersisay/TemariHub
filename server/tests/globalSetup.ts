import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export async function setup(): Promise<void> {
  console.log('\n[Test Global Setup] Launching MongoMemoryServer...');
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.TEST_MONGO_URI = uri;
  process.env.MONGODB_URI = uri;
  console.log(`[Test Global Setup] MongoMemoryServer initialized at ${uri}\n`);
}

export async function teardown(): Promise<void> {
  if (mongoServer) {
    console.log('\n[Test Global Teardown] Shutting down MongoMemoryServer...');
    await mongoServer.stop();
    mongoServer = null;
  }
}
