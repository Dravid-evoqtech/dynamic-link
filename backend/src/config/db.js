import mongoose from "mongoose";
import { DB_NAME } from "../constants/index.js";
import {TempReferral} from "../models/tempReferral.model.js";
import config from "./config.js";

async function connectToDatabase() {
  console.log("Connecting to MongoDB...");

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URL}/${DB_NAME}`
    );
    await TempReferral.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: config.tempTTL });

    console.log(
      `MONGODB Connected!! DB Host : ${connectionInstance?.connection.host}`
    );
  } catch (err) {
    console.log("MONGODB CONNECTION FAILED :: ", err);
    process.exit(1);
  }
}

export default connectToDatabase;