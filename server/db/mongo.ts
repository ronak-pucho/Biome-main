import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI_NOT_SET");
  }
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export async function getMongoDb() {
  const dbName = process.env.MONGODB_DB_NAME || "deepenk";
  const c = await getMongoClient();
  return c.db(dbName);
}

