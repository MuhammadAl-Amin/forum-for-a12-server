const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

// Must remove "/" from your production URL
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://forum-for-a12.web.app",
      "https://forum-for-a12.firebaseapp.com",
    ],
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ewkf10.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const postsCollection = client.db("forum").collection("posts");
    const userCollection = client.db("forum").collection("users");
    const voteCollection = client.db("forum").collection("votes");

    app.post("/posts", async (req, res) => {
      const post = req.body;
      const result = await postsCollection.insertOne(post);

      res.send(result);
    });
    app.post("/votes", async (req, res) => {
      const vote = req.body;
      const result = await voteCollection.insertOne(vote);

      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      try {
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);

        if (existingUser) {
          return res.send({ message: "User already exists" });
        }
      } catch (error) {
        console.log(error);
      }

      const result = await userCollection.insertOne(user);

      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };

      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.get("/posts", async (req, res) => {
      const { query } = req.query;

      console.log(query);

      try {
        let posts;

        if (query) {
          posts = await postsCollection
            .find({
              $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { tag: { $regex: query, $options: "i" } },
              ],
            })
            .toArray();
        } else {
          posts = await postsCollection.find().toArray();
        }

        res.status(200).send(posts);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch posts" });
      }
    });
    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await postsCollection.findOne(query);
      res.send(result);
    });
    app.get("/myposts", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const cursor = postsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/votes", async (req, res) => {
      const result = await voteCollection.find().toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
