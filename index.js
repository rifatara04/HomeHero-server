const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mz20f4d.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const HouseholdDB = client.db("Household");
    const serviceCollection = HouseholdDB.collection("services");
    const bookingsCollection = HouseholdDB.collection("bookings");
    const reviewsCollection = HouseholdDB.collection("reviews");

    app.get("/top-rated-reviews", async (req, res) => {
      const services = await serviceCollection.find({}).toArray();

      const reviews = await reviewsCollection
        .find()
        .sort({ rating: -1 })
        .limit(6)
        .toArray();

      const modifyReviews = reviews.map((review) => {
        const matchedService = services.find(
          (s) => s._id.toString() === review.reviewId?.toString()
        );

        return matchedService ? { ...review, service: matchedService } : review;
      });

      res.send(modifyReviews);
    });

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/my-services", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = serviceCollection.find(query).sort({ price: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/filter-services", async (req, res) => {
      const minPrice = Number(req.query.minPrice);
      const maxPrice = Number(req.query.maxPrice);
      const query = {
        price: { $gte: minPrice, $lte: maxPrice },
      };
      const cursor = serviceCollection.find(query).sort({ price: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/my-services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-bookings", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const cursor = bookingsCollection.find(query).sort({ price: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/service-review", async (req, res) => {
      const id = req.query.serviceId;
      const query = { reviewId: id };
      const cursor = reviewsCollection.find(query).sort({ rating: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/add-service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    app.post("/add-booking", async (req, res) => {
      const newBooking = req.body;
      const result = await bookingsCollection.insertOne(newBooking);
      res.send(result);
    });

    app.post("/add-review", async (req, res) => {
      const newReview = req.body;
      const result = await reviewsCollection.insertOne(newReview);
      res.send(result);
    });

    app.put("/update-service/:id", async (req, res) => {
      const id = req.params.id;
      const updateObj = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDocument = {
        $set: updateObj,
      };
      const result = await serviceCollection.updateOne(query, updateDocument);
      res.send(result);
    });

    app.delete("/delete-service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/my-booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
