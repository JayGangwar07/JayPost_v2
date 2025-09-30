import mongoose from "mongoose"

async function connectDB() {

  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/atom`)
    console.log("MongoDB connected!!! ", connectionInstance.connection.host)
  }

  catch (error) {
    console.error("src/lib/index.ts  MongoDB connection error: ", error)
    process.exit(1)
  }

}

export default connectDB