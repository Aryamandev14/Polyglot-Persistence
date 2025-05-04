import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import mongoose from 'mongoose';
import redis from 'redis';
import cors from 'cors';
import neo4j from 'neo4j-driver';
import multer from 'multer'
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';
const storage=multer.diskStorage({
    filename: function(req,file,callback){
        callback(null,file.originalname)
    }
})

const upload=multer({storage})
const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL
const pgPool = new Pool({
  connectionString: 'postgresql://myuser:mypassword@localhost:5432/mydb',
});

// MongoDB
mongoose.connect('mongodb://localhost:27017/tpch')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
  const Product = mongoose.model('Product', {
    name: String,
    price: Number,
    imageUrl: String,
  });
// Redis
const redisClient = redis.createClient();
redisClient.on('error', err => console.error('Redis error:', err));
await redisClient.connect();

// Neo4j
const neo4jDriver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'your_password')
);
const session = neo4jDriver.session();

// Create customer table with password field
async function createCustomerTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS customer1 (
      c_custkey SERIAL PRIMARY KEY,
      c_name VARCHAR(255) UNIQUE,
      c_address TEXT,
      c_password VARCHAR(255)
    );
  `;
  await pgPool.query(createTableQuery);
}
createCustomerTable()
  .then(() => console.log('Customer table checked/created'))
  .catch(err => console.error('Table creation error:', err));

// ============ ROUTES ============

// Get all customers
app.get('/customers', async (req, res) => {
  try {
    const { rows } = await pgPool.query('SELECT * FROM customer1 LIMIT 10');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session: Get
app.get('/session/:user', async (req, res) => {
  try {
    const session = await redisClient.get(req.params.user);
    if (session) {
      res.json({ session: JSON.parse(session) });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session: Set
app.post('/session/:c_name', async (req, res) => {
  const c_name = req.params.c_name;
  const customer = req.body;

  try {
    if (!customer) {
      return res.status(400).json({ error: 'No customer data provided' });
    }

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    await redisClient.set(c_name, JSON.stringify(customer));
    res.status(200).json({ message: 'Session saved' });
  } catch (err) {
    console.error('Error saving session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Create customer (register)
app.post('/customers', async (req, res) => {
  const { c_name, c_address, c_password } = req.body;
  try {
    await pgPool.query(
      'INSERT INTO customer1 (c_name, c_address, c_password) VALUES ($1, $2, $3)',
      [c_name, c_address, c_password]
    );
    res.sendStatus(201);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product (admin only)
cloudinary.config({
    cloud_name: 'ddzwdgcyr',
    api_key: '814981324338489',
    api_secret: 'V6F96tC2RqKyC1mNJIqYYgdusUI',
  });
app.post('/products', upload.single('image'), async (req, res) => {
    const { name, price } = req.body;
    const imageFile = req.file;
  
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }
  
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image',
      });
  
      // Delete the local file
      fs.unlinkSync(imageFile.path);
  
      // Save to MongoDB
      const product = new Product({
        name,
        price,
        imageUrl: result.secure_url,
      });
  
      await product.save();
  
      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        product,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  });

// Customer login
app.post('/login', async (req, res) => {
  const { c_name, c_password } = req.body;

  try {
    const result = await pgPool.query(
      'SELECT * FROM customer1 WHERE c_name = $1 AND c_password = $2',
      [c_name, c_password]
    );

    if (result.rows.length > 0) {
      const customer = result.rows[0];
      await redisClient.set(c_name, JSON.stringify(customer));
      res.json({ message: 'Login successful', customer });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/graph/customers-orders', async (req, res) => {
    const { customer, order, product } = req.body;
  
    if (!customer || !order || !product) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      await session.writeTransaction((tx) =>
        tx.run(
          `
          MERGE (c:Customer {name: $customer})
          MERGE (o:Order {id: $order})
          MERGE (p:Product {name: $product})
          MERGE (c)-[:PLACED]->(o)
          MERGE (o)-[:CONTAINS]->(p)
          `,
          { customer, order, product }
        )
      );
      res.json({ message: 'Order recorded successfully in graph DB' });
    } catch (error) {
      console.error('Neo4j error:', error);
      res.status(500).json({ error: 'Failed to record in graph DB' });
    }
  });
    

// Start the server
app.listen(3000, () => console.log('API running on port 3000'));
