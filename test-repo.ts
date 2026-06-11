import { userRepo } from "./server/repositories/index.js";
console.log(typeof (userRepo as any).findByEmail);
console.log(typeof (userRepo as any).findByPhone);
