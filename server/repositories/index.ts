import { InMemoryClickRepo, InMemorySearchRepo, InMemoryUserRepo } from "./inMemory";
import { MongoClickRepo, MongoSearchRepo, MongoUserRepo } from "./mongo";
import { createPriceAlertsRepo } from "./priceAlerts";

const useMongo = Boolean(process.env.MONGODB_URI);

export const userRepo = useMongo ? new MongoUserRepo() : new InMemoryUserRepo();
export const searchRepo = useMongo ? new MongoSearchRepo() : new InMemorySearchRepo();
export const clickRepo = useMongo ? new MongoClickRepo() : new InMemoryClickRepo();
export const priceAlertsRepo = createPriceAlertsRepo();
