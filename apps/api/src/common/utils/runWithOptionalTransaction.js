import mongoose from "mongoose";
import { AppError } from "../errors/AppError.js";
import { env } from "../../config/env.js";

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

      // Local standalone MongoDB does not support multi-document transactions.
      // Keep development usable, but never silently downgrade production
      // checkout/locking writes away from transaction semantics.
      if (env.NODE_ENV !== "development") {
        throw new AppError(
          "MongoDB transactions are required for this operation. Use a replica set or transaction-capable deployment.",
          500
        );
      }

      return work(null);
    }
  } finally {
    await session.endSession();
  }
}
