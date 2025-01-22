const request = require("supertest");
const express = require("express");
const app = require("../server"); // Path to your server.js file
const mysql = require("mysql2");

// Mock Database Connection for Tests
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "5q93pj7m",
    database: "easy_e",
});

// Sample Test Data
const testProduct = {
    name: "Test Product",
    category: "Electronics",
    description: "A test product description.",
    price: 100,
    image_url: "http://example.com/test-product.jpg",
};

let token;

// Insert user and login to get token
beforeAll((done) => {
    const testUser = { email: "testuser@example.com", password: "testpassword" };

    db.query("SELECT * FROM users WHERE email = ?", [testUser.email], (err, results) => {
        if (results.length === 0) {
            const bcrypt = require("bcrypt");
            bcrypt.hash(testUser.password, 10, (err, hashedPassword) => {
                db.query(
                    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                    ["Test User", testUser.email, hashedPassword],
                    () => {
                        request(app)
                            .post("/api/login")
                            .send(testUser)
                            .end((err, res) => {
                                token = res.headers["set-cookie"][0].split(";")[0].split("=")[1];
                                done();
                            });
                    }
                );
            });
        } else {
            request(app)
                .post("/api/login")
                .send(testUser)
                .end((err, res) => {
                    token = res.headers["set-cookie"][0].split(";")[0].split("=")[1];
                    done();
                });
        }
    });
});

// Clean up test product
afterAll((done) => {
    db.query("DELETE FROM products WHERE name = ?", [testProduct.name], () => {
        db.end(done);
    });
});

describe("Products API Tests", () => {
    it("should retrieve all products without authentication", async () => {
        const response = await request(app)
            .get("/api/products")
            .set("Content-Type", "application/json");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("should add a new product when authenticated", async () => {
        const response = await request(app)
            .post("/api/products")
            .send(testProduct)
            .set("Authorization", `Bearer ${token}`)
            .set("Content-Type", "application/json");

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Product added successfully.");
    });

    it("should delete a product when authenticated", async () => {
        // First, retrieve the product to get its ID
        const allProducts = await request(app)
            .get("/api/products")
            .set("Content-Type", "application/json");

        const productId = allProducts.body.find(
            (product) => product.name === testProduct.name
        ).id;

        // Delete the product
        const response = await request(app)
            .delete(`/api/products/${productId}`)
            .set("Authorization", `Bearer ${token}`)
            .set("Content-Type", "application/json");

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Product deleted successfully.");
    });
});
