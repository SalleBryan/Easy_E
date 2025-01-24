const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Environment Variables
require("dotenv").config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html")); // Serve the homepage
});

// Signup API
app.post("/api/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase.from("users").insert([
            {
                username: name,
                email: email,
                password: hashedPassword,
            },
        ]);

        if (error) {
            console.error("Error inserting user:", error);
            return res.status(500).json({ error: "Failed to register user." });
        }

        // Redirect to the homepage after successful signup
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Login API
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

        // Set token in a cookie
        res.cookie("token", token, { httpOnly: true });

        // Redirect to the homepage after successful login
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Middleware to Authenticate Users via JWT
const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token." });
    }
};

// API to Get All Products
app.get("/api/products", async (req, res) => {
    try {
        const { data: products, error } = await supabase.from("products").select("*");

        if (error) {
            console.error("Error fetching products:", error);
            return res.status(500).json({ error: "Failed to retrieve products." });
        }

        res.status(200).json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// API to Add a New Product
app.post("/api/products", authenticate, async (req, res) => {
    const { name, category, description, price, image_url } = req.body;

    if (!name || !category || !description || !price || !image_url) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const { error } = await supabase.from("products").insert([
            {
                name,
                category,
                description,
                price,
                image_url,
            },
        ]);

        if (error) {
            console.error("Error adding product:", error);
            return res.status(500).json({ error: "Failed to add product." });
        }

        res.status(201).json({ message: "Product added successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// API to Delete a Product
app.delete("/api/products/:id", authenticate, async (req, res) => {
    const productId = req.params.id;

    try {
        const { error } = await supabase.from("products").delete().eq("id", productId);

        if (error) {
            console.error("Error deleting product:", error);
            return res.status(500).json({ error: "Failed to delete product." });
        }

        res.status(200).json({ message: "Product deleted successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Start the Server
//app.listen(port, () => {
 //   console.log(`Server is running on http://localhost:${port}`);
//});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

module.exports = app;
