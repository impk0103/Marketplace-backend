const airtable = require('../config/airtable');
require('dotenv').config();
const tableName = 'Orders';

exports.placeOrder = async (req, res) => {
  const { productName, quantity, buyerPhone, buyerAddress, buyerName } = req.body;
  const buyerId = req.user.userId; // Extract buyer ID from JWT
  const orderStatus = 'Placed'; // Default order status

  try {
    // 1️⃣ Fetch the Product record using the product name
    const productResponse = await airtable.get('/Products', {
      params: { filterByFormula: `{Name} = "${productName}"` }
    });

    if (productResponse.data.records.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResponse.data.records[0];
    const productRecordId = product.id; // Airtable Record ID for product
    const sellerId = product.fields['Seller ID']; // Get seller ID

    // 2️⃣ Fetch the User record using buyerId
    const userResponse = await airtable.get('/Users'); // Fetch all users

    const userRecord = userResponse.data.records.find(user => user.id === buyerId);
    
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRecordId = userRecord.id; // Get Airtable record ID of user

    // 3️⃣ Create new order in Airtable
    const orderResponse = await airtable.post('/Orders', {
      fields: {
        'Product': [productRecordId], // Link to product
        'Buyer': [userRecordId], // Use Airtable's record ID
        'Buyer Name': buyerName,
        'Phone Number': buyerPhone,
        'Address': buyerAddress,
        'Quantity': quantity,
        'Status': orderStatus,
        'Seller ID': sellerId,
      }
    });

    const orderId = orderResponse.data.id; // Get order ID

    // 4️⃣ Update Product table with new order ID
    await airtable.patch(`/Products/${productRecordId}`, {
      fields: {
        'Orders': product.fields['Orders'] ? [...product.fields['Orders'], orderId] : [orderId],
      },
    });

    // 5️⃣ Update Users table with new order ID
    await airtable.patch(`/Users/${userRecordId}`, {
      fields: {
        'Orders': userRecord.fields['Orders']
          ? [...userRecord.fields['Orders'], orderId]
          : [orderId],
      },
    });
    res.status(201).json(orderResponse.data);
  } catch (error) {
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error in request setup:', error.message);
    }
    res.status(500).json({ error: error.message });
  }
};



exports.getBuyerOrders = async (req, res) => {
  const buyerId = req.user.userId; // Extract buyer ID from JWT

  try {
    // 1️⃣ Fetch all Users and find the user matching buyerId
    const userResponse = await airtable.get('/Users');
    const userRecord = userResponse.data.records.find(user => user.id === buyerId);

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orderIds = userRecord.fields['Orders'] || []; // Get array of order IDs

    if (orderIds.length === 0) {
      return res.status(200).json([]); // No orders found
    }

    // 2️⃣ Fetch orders by filtering with the order IDs
    const ordersResponse = await airtable.get('/Orders', {
      params: { filterByFormula: `OR(${orderIds.map(id => `RECORD_ID() = "${id}"`).join(',')})` }
    });

    // 3️⃣ Format the response
    const orders = ordersResponse.data.records.map(order => ({
      id: order.id,
      productName: order.fields['Product Name'],
      quantity: order.fields['Quantity'],
      status: order.fields['Status']
    }));

    res.status(200).json(orders);
  } catch (error) {
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error in request setup:', error.message);
    }
    res.status(500).json({ error: error.message });
  }
};



// Get orders by seller ID
exports.getSellerOrders = async (req, res) => {
  const sellerId = req.user.userId;  // Assuming sellerId is stored in JWT token

  try {
    const response = await airtable.get('/Orders', {
      params: {
        filterByFormula: `{Seller ID} = "${sellerId}"`
      }
    });

    const orders = response.data.records.map(order => ({
      id: order.id,
      productName: order.fields['Product Name'],
      buyerName: order.fields['Buyer Name'],
      phone: order.fields['Phone'],
      address: order.fields['Address'],
      quantity: order.fields['Quantity'],
      status: order.fields['Status']
    }));

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching seller orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update the order status by seller
exports.updateOrderStatus = async (req, res) => {

  
  const { orderId } = req.params;
  const { orderStatus } = req.body;
  const validStatuses = ['Placed', 'Delivered', 'Rejected'];

  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  try {
    // Fetch the order by its ID
    const order = await airtable.get(`/${tableName}/${orderId}`);

    if (!order.data.fields) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = order.data;

    // Check if the sellerId matches the order's sellerId
    if (currentOrder.fields['Seller ID'] !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this order' });
    }

    // Update the order status in Airtable
    const updatedOrder = await airtable.patch(`/${tableName}/${orderId}`, {
      fields: {
        'Status': orderStatus,
      },
    });

    res.status(200).json(updatedOrder.data); // Return the updated order data
  } catch (error) {
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error in request setup:', error.message);
    }
    res.status(500).json({ error: error.message });
  }
};
