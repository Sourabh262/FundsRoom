require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-123';

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid username or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Customer CRM Routes ---
app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.followUpDate) {
      data.followUpDate = new Date(data.followUpDate);
    } else {
      delete data.followUpDate;
    }
    // Clean up empty strings for optional fields
    if (data.email === '') data.email = null;
    if (data.businessName === '') data.businessName = null;
    if (data.gstNumber === '') data.gstNumber = null;
    if (data.address === '') data.address = null;
    if (data.notes === '') data.notes = null;

    const customer = await prisma.customer.create({
      data: data
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create customer' });
  }
});

app.get('/api/customers', authenticateToken, async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = search ? {
    OR: [
      { name: { contains: search } },
      { mobile: { contains: search } },
      { email: { contains: search } }
    ]
  } : {};

  try {
    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
    const total = await prisma.customer.count({ where });
    res.json({ data: customers, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { challans: true }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.followUpDate) {
      data.followUpDate = new Date(data.followUpDate);
    } else if (data.followUpDate === '') {
      data.followUpDate = null;
    }
    
    // Clean up empty strings for optional fields
    if (data.email === '') data.email = null;
    if (data.businessName === '') data.businessName = null;
    if (data.gstNumber === '') data.gstNumber = null;
    if (data.address === '') data.address = null;
    if (data.notes === '') data.notes = null;

    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: data
    });
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    await prisma.$transaction(async (tx) => {
      // First, delete related challan items for any challans this customer has
      const challans = await tx.challan.findMany({ where: { customerId } });
      for (const challan of challans) {
        await tx.challanItem.deleteMany({ where: { challanId: challan.id } });
      }
      // Then delete the challans
      await tx.challan.deleteMany({ where: { customerId } });
      // Finally, delete the customer
      await tx.customer.delete({ where: { id: customerId } });
    });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// --- Product and Inventory Routes ---
app.post('/api/products', authenticateToken, authorizeRoles('Admin', 'Warehouse', 'Sales'), async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: req.body
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create product. SKU might not be unique.' });
  }
});

app.get('/api/products', authenticateToken, async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = search ? {
    OR: [
      { name: { contains: search } },
      { sku: { contains: search } }
    ]
  } : {};

  try {
    const products = await prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
    const total = await prisma.product.count({ where });
    res.json({ data: products, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 } }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.put('/api/products/:id', authenticateToken, authorizeRoles('Admin', 'Warehouse'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticateToken, authorizeRoles('Admin', 'Warehouse'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    await prisma.$transaction([
      prisma.stockMovement.deleteMany({ where: { productId } }),
      prisma.challanItem.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } })
    ]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.post('/api/inventory/movement', authenticateToken, authorizeRoles('Admin', 'Warehouse'), async (req, res) => {
  const { productId, quantity, type, reason } = req.body;
  if (!['IN', 'OUT'].includes(type)) return res.status(400).json({ error: 'Invalid movement type' });
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Product not found');
      
      const newStock = type === 'IN' ? product.stock + quantity : product.stock - quantity;
      if (newStock < 0) throw new Error('Insufficient stock');
      
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });
      
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type,
          reason,
          createdBy: req.user.username
        }
      });
      return { product: updatedProduct, movement };
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Sales Challan Routes ---
const generateChallanNumber = async () => {
  const count = await prisma.challan.count();
  return `CH-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
};

app.post('/api/challans', authenticateToken, authorizeRoles('Admin', 'Sales'), async (req, res) => {
  const { customerId, status, items } = req.body; 
  // items: [{ productId, quantity }]
  
  if (!items || items.length === 0) return res.status(400).json({ error: 'Challan must have items' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalQuantity = 0;
      const challanItemsData = [];
      
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product ID ${item.productId} not found`);
        
        if (status === 'Confirmed') {
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name} (SKU: ${product.sku})`);
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: product.stock - item.quantity }
          });
          
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'OUT',
              reason: 'Sales Challan Confirmation',
              createdBy: req.user.username
            }
          });
        }
        
        totalQuantity += item.quantity;
        challanItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          snapshotData: JSON.stringify(product)
        });
      }

      const challanNumber = await generateChallanNumber();
      
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          status,
          totalQuantity,
          createdBy: req.user.username,
          items: {
            create: challanItemsData
          }
        },
        include: { items: true, customer: true }
      });
      
      return challan;
    });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/challans', authenticateToken, async (req, res) => {
  try {
    const challans = await prisma.challan.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challans' });
  }
});

app.get('/api/challans/:id', authenticateToken, async (req, res) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true, items: true }
    });
    if (!challan) return res.status(404).json({ error: 'Challan not found' });
    res.json(challan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challan' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
