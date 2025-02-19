const airtable = require('../config/airtable');
require('dotenv').config();
const tableName = 'Products';

// Create a new product
exports.createProduct = async (req, res) => {
  const { name, description, price, imageUrl } = req.body;
  const sellerId = req.user.userId; // Assuming seller ID is stored in JWT token
  try {
    const response = await airtable.post(`/${tableName}`, {
      fields: {
        Name: name,
        Description: description,
        Price: price,
        'Image URL': imageUrl,
        'Seller ID': sellerId, // Ensure the product is created by the authenticated seller
      },
    });
   
    res.status(201).json(response.data);
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const response = await airtable.get(`/${tableName}`);
    res.status(200).json(response.data.records);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Search for a product by name
exports.searchProductByName = async (req, res) => {
  const { name } = req.params;

  try {
    const response = await airtable.get(`/${tableName}?filterByFormula=SEARCH("${name.toLowerCase()}", LOWER({Name}))`);
    res.status(200).json(response.data.records);
  } catch (error) {
    console.log(error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.message });
  }
};



exports.getProductBySellerId = async (req, res) => {
    const id = req.user.userId; 
  
    try {
      const response = await airtable.get(
        `/${tableName}?filterByFormula={Seller ID}="${id}"`
      );
  
      if (response.data.records.length === 0) {
        return res.status(404).json({ message: 'No products found' });
      }
  
      res.status(200).json(response.data.records);
    } catch (error) {
      console.log("Error fetching seller products:", error.response?.data || error.message);
      res.status(500).json({ error: error.message });
    }
};


// Update a product by ID
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, imageUrl } = req.body;

  try {
    const product = await airtable.get(`/${tableName}/${id}`);
    const response = await airtable.patch(`/${tableName}/${id}`, {
      fields: {
        Name: name,
        Description: description,
        Price: price,
        'Image URL': imageUrl,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in updateProduct:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product exists
    const product = await airtable.get(`/${tableName}/${id}`);

    if (!product.data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the user is the owner of the product
    if (product.data.fields['Seller ID'] !== req.user.userId) {
      return res.status(403).json({ error: 'You cannot delete this product' });
    }

    // Proceed to delete the product
    await airtable.delete(`/${tableName}/${id}`);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
};
