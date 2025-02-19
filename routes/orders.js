const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Route for a buyer to place an order (only buyers should be able to place orders)
router.post(
  '/placeOrder', 
  verifyToken, 
  checkRole(['Buyer']),  // Only buyers can place orders
  orderController.placeOrder
);

// Route for a buyer to view their own orders
router.get(
  '/my-orders', 
  verifyToken, 
  checkRole(['Buyer']),  // Only buyers can view their own orders
  orderController.getBuyerOrders
);

// Route for a seller to view their received orders
router.get(
  '/seller-orders', 
  verifyToken, 
  checkRole(['Seller']),  // Only sellers can view orders they received
  orderController.getSellerOrders
);

// Route for a seller to update the status of an order
router.post('/update-status/:orderId', verifyToken, checkRole('Seller'), orderController.updateOrderStatus);

module.exports = router;
