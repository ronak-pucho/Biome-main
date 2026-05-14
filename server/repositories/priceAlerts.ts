import crypto from "crypto";
import type { Collection } from "mongodb";
import { getMongoDb } from "../db/mongo";

export type PriceAlertEntity = {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  platform: string;
  currentPrice: number;
  targetPrice: number;
  domain: string;
  createdAt: string;
  isActive: boolean;
};

export interface PriceAlertsRepo {
  create(input: Omit<PriceAlertEntity, "id" | "createdAt">): Promise<PriceAlertEntity>;
  listActive(userId: string): Promise<PriceAlertEntity[]>;
  listAllActive(limit?: number): Promise<PriceAlertEntity[]>;
  deactivate(alertId: string, userId: string): Promise<boolean>;
}

export class InMemoryPriceAlertsRepo implements PriceAlertsRepo {
  private alerts = new Map<string, PriceAlertEntity>();

  async create(input: Omit<PriceAlertEntity, "id" | "createdAt">) {
    const created: PriceAlertEntity = {
      ...input,
      id: `alert_${crypto.randomBytes(8).toString("hex")}`,
      createdAt: new Date().toISOString(),
    };
    this.alerts.set(created.id, created);
    return created;
  }

  async listActive(userId: string) {
    return Array.from(this.alerts.values()).filter((a) => a.userId === userId && a.isActive);
  }

  async listAllActive(limit = 200) {
    return Array.from(this.alerts.values())
      .filter((a) => a.isActive)
      .slice(0, limit);
  }

  async deactivate(alertId: string, userId: string) {
    const a = this.alerts.get(alertId);
    if (!a || a.userId !== userId) return false;
    this.alerts.set(alertId, { ...a, isActive: false });
    return true;
  }
}

type AlertDoc = Omit<PriceAlertEntity, "id"> & { _id: string };

export class MongoPriceAlertsRepo implements PriceAlertsRepo {
  private colPromise: Promise<Collection<AlertDoc>> | null = null;

  private async col() {
    if (!this.colPromise) {
      this.colPromise = (async () => {
        const db = await getMongoDb();
        const col = db.collection<AlertDoc>("price_alerts");
        await col.createIndex({ userId: 1, isActive: 1, createdAt: -1 });
        await col.createIndex({ itemId: 1, isActive: 1 });
        return col;
      })();
    }
    return this.colPromise;
  }

  async create(input: Omit<PriceAlertEntity, "id" | "createdAt">) {
    const col = await this.col();
    const createdAt = new Date().toISOString();
    const _id = `alert_${crypto.randomBytes(8).toString("hex")}`;
    const doc: AlertDoc = { _id, ...input, createdAt };
    await col.insertOne(doc);
    return { ...doc, id: doc._id };
  }

  async listActive(userId: string) {
    const col = await this.col();
    const docs = await col.find({ userId, isActive: true }).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => ({ ...d, id: d._id }));
  }

  async listAllActive(limit = 200) {
    const col = await this.col();
    const docs = await col
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d) => ({ ...d, id: d._id }));
  }

  async deactivate(alertId: string, userId: string) {
    const col = await this.col();
    const res = await col.updateOne({ _id: alertId, userId }, { $set: { isActive: false } });
    return res.modifiedCount > 0;
  }
}

export function createPriceAlertsRepo(): PriceAlertsRepo {
  if (process.env.MONGODB_URI) return new MongoPriceAlertsRepo();
  return new InMemoryPriceAlertsRepo();
}
