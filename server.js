const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files like your frontend

// In-memory database (Mock Data)
let products = [
    {
        id: 1,
        name: "Nike Headband",
        price: 21,
        discount: "30%",
        image: "./assets/images/Nike+Dri+Fit+Headband+Tie+2.0+Black.webp",
    },
    {
        id: 2,
        name: "Gatorade Bottle",
        price: 15,
        discount: null,
        image: "./assets/images/gatoradewaterbottle.jpg",
    },
    {
        id: 3,
        name: "UFC Gloves",
        price: 80,
        discount: null,
        image: "./assets/images/UFC-MMA-GLOVES-SM-MD_16a716cb-05fc-42d9-9f7a-13aaa2d862db.d3a97379d48e247f395c6d7d06842b9c.webp",
    },
    {
        id: 4,
        name: "Theragun",
        price: 240,
        discount: "20%",
        image: "./assets/images/pinofit-physio-boost.jpg",
    },
];

// Cart (Temporary storage for simplicity)
let cart = [];

// Routes
// Serve frontend
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// Fetch all products
app.get("/api/products", (req, res) => {
    res.json(products);
});

// Fetch a single product
app.get("/api/products/:id", (req, res) => {
    const product = products.find((p) => p.id === parseInt(req.params.id));
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: "Product not found" });
    }
});

// Add to cart
app.post("/api/cart", (req, res) => {
    const { productId, quantity } = req.body;

    const product = products.find((p) => p.id === productId);
    if (product) {
        cart.push({ product, quantity });
        res.json({ message: "Added to cart", cart });
    } else {
        res.status(404).json({ error: "Product not found" });
    }
});

// View cart
app.get("/api/cart", (req, res) => {
    res.json(cart);
});

// Remove from cart
app.delete("/api/cart/:id", (req, res) => {
    const productId = parseInt(req.params.id);
    cart = cart.filter((item) => item.product.id !== productId);
    res.json({ message: "Item removed from cart", cart });
});


app.post('/api/submit-order', (req, res) => {
    const orderDetails = req.body;

    if (!orderDetails || !orderDetails.fullName || !orderDetails.streetAddress) {
        return res.status(400).json({ error: 'Invalid order details' });
    }

    // Generate a unique receipt file name
    const receiptFileName = `receipt_${Date.now()}.html`;
    const receiptsDir = path.join(__dirname, 'receipts');
    const receiptFilePath = path.join(receiptsDir, receiptFileName);

    // Ensure the receipts directory exists
    if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir);
    }

    // Generate receipt content
    const receiptContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Receipt</title>
        </head>
        <body>
            <h1>Order Receipt</h1>
            <p><strong>Full Name:</strong> ${orderDetails.fullName}</p>
            <p><strong>Address:</strong> ${orderDetails.streetAddress}, ${orderDetails.city}, ${orderDetails.state}, ${orderDetails.postalCode}</p>
            <p><strong>Phone:</strong> ${orderDetails.phone}</p>
            <p><strong>Order Date:</strong> ${orderDetails.orderDate}</p>
            <p><strong>Payment Method:</strong> Cash on Delivery</p>
            <p>Thank you for your order!</p>
        </body>
        </html>
    `;

    // Save the receipt file
    fs.writeFile(receiptFilePath, receiptContent, (err) => {
        if (err) {
            console.error('Error saving receipt:', err);
            return res.status(500).json({ error: 'Failed to save receipt' });
        }

        // Return the URL to the receipt file
        const receiptUrl = `/receipts/${receiptFileName}`;
        res.json({ receiptUrl });
    });
});


// Serve receipt files
app.use('/receipts', express.static(path.join(__dirname, 'receipts')));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

