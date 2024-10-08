const express = require("express");
const app = express();
const stripe = require("stripe")(
  "sk_test_51Q5n2rFfuMY7T7U1n4ihukaFKqwpoqijhWBj64m5FtXJZ0J7jmqH3TTKZTLzxSrPeyYSm5MPM1c1D7HnZWhSvaTZ00SR9KdgKp"
);
// console.log(process.env.STRIPE_SECRET_KEY)
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

// const { ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cphe2d0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const usercollection = client.db("BistroDB").collection("users");
const menucollection = client.db("BistroDB").collection("menu");
const reviewscollection = client.db("BistroDB").collection("reviews");
const cartcollection = client.db("BistroDB").collection("cart");
const testcollection = client.db("BistroDB").collection("test");
const paymentcollection = client.db("BistroDB").collection("payment");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    //jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    //make admin
    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usercollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //delete user api
    app.delete("/deleteuser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usercollection.deleteOne(query);
      res.send(result);
    });

    //delete menu item by admin
    app.delete("/menu/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menucollection.deleteOne(query);
      res.send(result);
    });
    //user related api
    app.post("/userdata", async (req, res) => {
      const user = req.body;
      // console.log("got it")
      const query = { email: user.email };
      // console.log(query)
      const existingUser = await usercollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await usercollection.insertOne(user);
      res.send(result);
    });

    app.patch("/menu/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: item.name,
          price: item.price,
          category: item.category,
        },
      };
      const result = await menucollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menucollection.findOne(query);
      res.send(result);
    });

    //middleware
    const verifyToken = (req, res, next) => {
      // console.log(req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthrized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      // next();
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthrized access" });
        }
        req.decoded = decoded;
        // console.log("decoded",req.decoded);
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usercollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log("98",email);
      if (!email === req.decoded.email) {
        return res.status(401).send({ message: "unauthrized access" });
      }
      let admin = false;
      const query = { email: email };
      const user = await usercollection.findOne({ query });
      if (user) {
        admin = user?.role === "admin";
      }
      res.send(admin);
    });

    //get all users
    app.get("/user", verifyToken, verifyAdmin, async (req, res) => {
      const result = await usercollection.find().toArray();
      res.send(result);
    });
    // get cart data
    app.get("/cartData", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartcollection.find(query).toArray();
      res.send(result);
    });

    app.get("/menu", async (req, res) => {
      const result = await menucollection.find().toArray();
      // console.log(result)
      res.send(result);
    });

    app.post("/menu", async (req, res) => {
      const item = req.body;
      const result = await menucollection.insertOne(item);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewscollection.find().toArray();
      // console.log(result)
      res.send(result);
    });

    //stripe payment Intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      //minimum amount restriction in stripe. change it back later
      const amount = parseInt(1 * 100);
      // console.log(a)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payment", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentcollection.insertOne(payment);
      console.log(payment);
      // res.send(paymentResult);
      const query = {
        _id: {
          $in: payment.cartIds.map((id) => new ObjectId(id)),
        },
      };
      const deleteResult = await cartcollection.deleteMany(query);
      res.send({paymentResult,deleteResult});
    });

    // cart item post
    app.post("/cart", async (req, res) => {
      const cartItem = req.body;
      const cart = await cartcollection.insertOne(cartItem);
      res.send(cart);
    });

    //get payment history
    app.get('/payments/:email', async(req, res) => {
      const query = {email: req.params.email};

      // TODO: check decoded email to verify with user email
      // if(req.params.email !== req.decoded.email ){
      //   return res.status(403).send({message: 'forbidden acces'})
      // }
      
      const result = await paymentcollection.find(query).toArray();
      res.send(result);
    })

    //cart item delete api
    // app.delete("/cartdelete/:id",async(req,res)=>{
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)};
    //   const result = await cartcollection.deleteOne(query);
    //   res.send(result);
    // })

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
  res.send("server running...");
});

app.listen(port, () => {
  console.log("runnign from port", port);
});
