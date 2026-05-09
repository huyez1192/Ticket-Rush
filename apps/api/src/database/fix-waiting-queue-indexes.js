import mongoose from "mongoose";
import { QUEUE_STATUSES } from "../common/constants/index.js";
import "../modules/waiting-queue/waitingQueue.model.js";
import { connectMongo } from "./connectMongo.js";

const COLLECTION_NAME = "waiting_queue";
const OLD_TOKEN_INDEX_NAME = "token_1";
const OLD_TOKEN_HASH_INDEX_NAME = "queueTokenHash_1";
const OLD_ACTIVE_USER_EVENT_INDEX_NAME = "uq_waiting_queue_user_event";
const TOKEN_HASH_INDEX_NAME = "uq_waiting_queue_token_hash";
const ACTIVE_USER_EVENT_INDEX_NAME = "uq_waiting_queue_active_user_event";

async function getWaitingQueueCollection() {
  const collections = await mongoose.connection.db
    .listCollections({ name: COLLECTION_NAME }, { nameOnly: true })
    .toArray();

  if (!collections.length) {
    console.log(`Collection ${COLLECTION_NAME} does not exist yet. Creating indexes through collection handle.`);
  }

  return mongoose.connection.db.collection(COLLECTION_NAME);
}

async function dropIndexIfExists(collection, indexName) {
  const indexes = await collection.indexes();
  const indexExists = indexes.some((index) => index.name === indexName);

  if (!indexExists) {
    console.log(`Index ${indexName} not present; nothing to drop.`);
    return;
  }

  await collection.dropIndex(indexName);
  console.log(`Dropped old index ${indexName}.`);
}

async function unsetOldTokenField(collection) {
  const result = await collection.updateMany({ token: { $exists: true } }, { $unset: { token: "" } });
  console.log(`Unset old token field on ${result.modifiedCount || 0} waiting queue entr${result.modifiedCount === 1 ? "y" : "ies"}.`);
}

async function dropIndexIfIncompatible(collection, indexName, expectedKey) {
  const indexes = await collection.indexes();
  const index = indexes.find((item) => item.name === indexName);

  if (!index) {
    return;
  }

  if (JSON.stringify(index.key) === JSON.stringify(expectedKey)) {
    return;
  }

  await collection.dropIndex(indexName);
  console.log(`Dropped incompatible index ${indexName}.`);
}

async function ensureIndexes(collection) {
  await dropIndexIfIncompatible(collection, TOKEN_HASH_INDEX_NAME, { queueTokenHash: 1 });
  await dropIndexIfIncompatible(collection, ACTIVE_USER_EVENT_INDEX_NAME, { eventId: 1, userId: 1 });

  await collection.createIndex(
    { queueTokenHash: 1 },
    {
      unique: true,
      partialFilterExpression: { queueTokenHash: { $type: "string" } },
      name: TOKEN_HASH_INDEX_NAME
    }
  );
  console.log(`Ensured ${TOKEN_HASH_INDEX_NAME}.`);

  await collection.createIndex(
    { eventId: 1, userId: 1 },
    {
      unique: true,
      partialFilterExpression: { status: { $in: [QUEUE_STATUSES.WAITING, QUEUE_STATUSES.ADMITTED] } },
      name: ACTIVE_USER_EVENT_INDEX_NAME
    }
  );
  console.log(`Ensured ${ACTIVE_USER_EVENT_INDEX_NAME}.`);

  await collection.createIndex({ eventId: 1 }, { name: "idx_waiting_queue_event_id" });
  await collection.createIndex({ status: 1 }, { name: "idx_waiting_queue_status" });
  await collection.createIndex(
    { eventId: 1, status: 1, sequenceNumber: 1 },
    { name: "idx_waiting_queue_event_status_sequence" }
  );
  console.log("Ensured waiting queue lookup indexes.");
}

async function printIndexes(collection) {
  const indexes = await collection.indexes();
  console.log("Current waiting_queue indexes:");

  for (const index of indexes) {
    console.log(`- ${index.name}: ${JSON.stringify(index.key)}${index.unique ? " unique" : ""}`);
  }
}

async function run() {
  await connectMongo();

  const collection = await getWaitingQueueCollection();
  await dropIndexIfExists(collection, OLD_TOKEN_INDEX_NAME);
  await dropIndexIfExists(collection, OLD_TOKEN_HASH_INDEX_NAME);
  await dropIndexIfExists(collection, OLD_ACTIVE_USER_EVENT_INDEX_NAME);
  await unsetOldTokenField(collection);
  await ensureIndexes(collection);
  await printIndexes(collection);

  console.log("Waiting queue index repair completed.");
}

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Waiting queue index repair failed.", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
