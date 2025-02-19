const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Route for a seller to create a product
router.post(
  '/',
  verifyToken,
  checkRole(['Seller']),
  productController.createProduct
);

// Route for fetching seller products (moved above dynamic routes)
router.get('/sellerProducts', verifyToken, productController.getProductBySellerId);

// Route for all users to view all products
router.get('/', productController.getAllProducts);

// Route for searching product by name
router.get('/search/:name', productController.searchProductByName);


// Route for a seller to update a product by ID
router.put(
  '/:id',
  verifyToken,
  checkRole(['Seller']),
  productController.updateProduct
);

// Route for a seller to delete a product by ID
router.delete(
  '/:id',
  verifyToken,
  checkRole(['Seller']),
  productController.deleteProduct
);






module.exports = router;
