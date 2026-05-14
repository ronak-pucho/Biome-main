import type { Collection, Db } from "mongodb";
import crypto from "crypto";
import { getMongoDb } from "../db/mongo";
import type { ClickEventEntity, SearchHistoryEntity, UserEntity } from "../entities";
import type { InMemoryClickRepo, InMemorySearchRepo, InMemoryUserRepo } from "./inMemory";

type UserDoc = Omit<UserEntity, "id"> & { _id: string };
type SearchDoc = Omit<SearchHistoryEntity, "id"> & { _id: string };
type ClickDoc = Omit<ClickEventEntity, "id"> & { _id: string };

async function collections(db?: Db) {
  const database = db ?? (await getMongoDb());

  const users = database.collection<UserDoc>("users");
  const searches = database.collection<SearchDoc>("search_history");
  const clicks = database.collection<ClickDoc>("click_events");

  await users.createIndex({ email: 1 }, { unique: true, sparse: true });
  await users.createIndex({ phone: 1 }, { unique: true, sparse: true });
  await searches.createIndex({ userId: 1, createdAt: -1 });
  await clicks.createIndex({ userId: 1, createdAt: -1 });
  await clicks.createIndex({ searchId: 1, createdAt: -1 });

  return { users, searches, clicks };
}

export class MongoUserRepo implements Pick<InMemoryUserRepo, "upsertByEmail" | "upsertByPhone" | "getById"> {
  private colPromise: Promise<Collection<UserDoc>> | null = null;

  private async col() {
    if (!this.colPromise) {
      this.colPromise = collections().then((c) => c.users);
    }
    return this.colPromise;
  }

  async upsertByEmail(input: { email: string; name?: string; provider: "email" | "google" }) {
    const now = new Date().toISOString();
    const col = await this.col();

    const email = input.email.trim().toLowerCase();
    await col.updateOne(
      { email },
      {
        $set: { name: input.name, provider: input.provider, lastLogin: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    const doc = await col.findOne({ email });
    if (!doc) throw new Error("USER_UPSERT_FAILED");
    return { ...doc, id: doc._id };
  }

  async upsertByPhone(input: { phone: string; name?: string }) {
    const now = new Date().toISOString();
    const col = await this.col();

    const phone = input.phone.trim();
    await col.updateOne(
      { phone },
      {
        $set: { name: input.name, provider: "phone", lastLogin: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    const doc = await col.findOne({ phone });
    if (!doc) throw new Error("USER_UPSERT_FAILED");
    return { ...doc, id: doc._id };
  }

  async getById(id: string) {
    const col = await this.col();
    const doc = await col.findOne({ _id: id });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  }
}

export class MongoSearchRepo implements Pick<InMemorySearchRepo, "create" | "getById" | "listByUser"> {
  private colPromise: Promise<Collection<SearchDoc>> | null = null;

  private async col() {
    if (!this.colPromise) {
      this.colPromise = collections().then((c) => c.searches);
    }
    return this.colPromise;
  }

  async create(input: Omit<SearchHistoryEntity, "id" | "createdAt">) {
    const col = await this.col();
    const createdAt = new Date().toISOString();
    const doc: SearchDoc = { _id: cryptoRandomId("srch"), ...input, createdAt };
    await col.insertOne(doc);
    return { ...doc, id: doc._id };
  }

  async getById(id: string) {
    const col = await this.col();
    const doc = await col.findOne({ _id: id });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  }

  async listByUser(userId: string, limit = 20) {
    const col = await this.col();
    const docs = await col.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map((d) => ({ ...d, id: d._id }));
  }
}

export class MongoClickRepo implements Pick<InMemoryClickRepo, "create"> {
  private colPromise: Promise<Collection<ClickDoc>> | null = null;

  private async col() {
    if (!this.colPromise) {
      this.colPromise = collections().then((c) => c.clicks);
    }
    return this.colPromise;
  }

  async create(input: Omit<ClickEventEntity, "id" | "createdAt">) {
    const col = await this.col();
    const createdAt = new Date().toISOString();
    const doc: ClickDoc = { _id: cryptoRandomId("clk"), ...input, createdAt };
    await col.insertOne(doc);
    return { ...doc, id: doc._id };
  }
}

function cryptoRandomId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}
