const express = require("express");
const router = express.Router();

// Bug: Imports were separated and createProduct was imported without destructuring, causing it to load the whole object instead of the function.
// Fix: Combined imports using destructuring to correctly extract both functions from the controller.
const { createProduct, getAllProducts } = require("../controllers/productController");

// Bug: Used GET method for creating a product, which violates REST API standards.
// Fix: Changed the route method to POST for creating new resources.
router.post("/products", createProduct);
router.get("/products/all", getAllProducts);

module.exports = router;