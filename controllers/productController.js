const Product = require("../models/Product");

// Bug: The function used .then() and lacked error handling, and it didn't stop execution if validation failed.
// Fix: Refactored to async/await, added try/catch, and added 'return' before res.status to prevent "Headers already sent" error.
exports.createProduct = async (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ msg: "Missing Data" });
  }
  // Bug: The function used .then() and lacked error handling (no .catch).
// Fix: Refactored to async/await and wrapped the database operation in a try/catch block.
  try {
    const product = await Product.create({ name, price });
    res.status(201).json({ msg: "Product Created", data: product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server Error" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const limit = req.query.limit || "10";

    const products = await Product.find().limit(limit);
    res.status(200).json({ msg: "Products fetched", data: products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server Error" });
  }
};
