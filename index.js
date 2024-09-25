const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config()

// const { ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cphe2d0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const usercollection = client.db("BistroDB").collection("users");
const menucollection = client.db("BistroDB").collection("menu");
const reviewscollection = client.db("BistroDB").collection("reviews");
const cartcollection = client.db("BistroDB").collection("cart");


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    //user related api
    app.post('/userdata',async(req,res)=>{
      const user = req.body;
      // console.log("got it")
      const query = {email: user.email};
      const existingUser = await usercollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exist', insertedId: null})
      }
      const result = await usercollection.insertOne(user);
      res.send(result);
    })
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

    //cart item delete api
    // app.delete("/cartdelete/:id",async(req,res)=>{
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)};
    //   const result = await cartcollection.deleteOne(query);
    //   res.send(result);
    // })

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