const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config()

const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cphe2d0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const menucollection = client.db("BistroDB").collection("menu");
const reviewscollection = client.db("BistroDB").collection("reviews");
const cartcollection = client.db("BistroDB").collection("cart");


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // get cart data
    app.get('/cartData',async(req,res)=>{
      const email = req.query.email;
      const query = {email: email};
      const result = await cartcollection.find(query).toArray();
      res.send(result);
    })

    app.get('/menu',async(req,res)=>{
        const result = await menucollection.find().toArray();
        // console.log(result)
        res.send(result);
    })
    
    app.get('/reviews',async(req,res)=>{
        const result = await reviewscollection.find().toArray();
        // console.log(result)
        res.send(result);
    })

    // cart item post 
    app.post("/cart",async(req,res)=>{
     
      const cartItem = req.body;
      const cart = await cartcollection.insertOne(cartItem);
      res.send(cart)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res)=>{
    res.send('server running...');
})

app.listen(port,()=>{
    console.log("runnign from port",port)
})