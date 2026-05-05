import mongoose from "mongoose";

function isTransactionUnsupported(error) {
  return /Transaction numbers are only allowed|replica set member or mongos/i.test(error?.message || "");
}

export async function runWithOptionalTransaction(work) {
  const session = await mongoose.startSession();

  try {
    try {
      let result;

      await session.withTransaction(async () => {
        result = await work(session);
      });

      return result;
    } catch (error) {
      if (!isTransactionUnsupported(error)) {
        throw error;
      }

      return work(null);
    }
  } finally {
    await session.endSession();
  }
}
