import { InMemoryClickRepo, InMemoryOrderRepo, InMemorySearchRepo, InMemoryUserRepo } from "./inMemory";
import { MongoClickRepo, MongoOrderRepo, MongoSearchRepo, MongoUserRepo } from "./mongo";
import { createPriceAlertsRepo } from "./priceAlerts";

const useMongo = Boolean(process.env.MONGO_URL || process.env.MONGODB_URI);

export const userRepo = useMongo ? new MongoUserRepo() : new InMemoryUserRepo();
export const searchRepo = useMongo ? new MongoSearchRepo() : new InMemorySearchRepo();
export const clickRepo = useMongo ? new MongoClickRepo() : new InMemoryClickRepo();
export const orderRepo = useMongo ? new MongoOrderRepo() : new InMemoryOrderRepo();
export const priceAlertsRepo = createPriceAlertsRepo();
