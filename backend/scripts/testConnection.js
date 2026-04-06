const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://khetesh:khetesh123@devflow.xkb6ydw.mongodb.net/?appName=DevFlow";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
