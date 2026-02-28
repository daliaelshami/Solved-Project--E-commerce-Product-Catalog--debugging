require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);


// Bug: Database connection used .then()/.catch() and the server started even if the DB connection failed.
// Fix: Wrapped the DB connection and server startup inside an async function with try/catch.
//require Mongoose
const mongoose = require('mongoose');
// DB connection 
async function connectionDB(){
    try{
        await mongoose.connect("mongodb://localhost:27017/product_catalog");
        console.log('connected');
    }catch(error){
        console.log(error);
    }
}
connectionDB();

app.listen(process.env.PORT, () => console.log("Server Running"));
