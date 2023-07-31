import { Client } from "redis-om";

const client = await new Client().open(databaseKeys.MAIN_URL);

// module.exports = client;
export default client;
