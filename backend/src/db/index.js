import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
  console.log("DB COONECTED!");
}

export default connectDB;