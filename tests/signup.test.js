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
const testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "testpassword",
};

// Clean up database before tests
beforeAll((done) => {
    db.query("DELETE FROM users WHERE email = ?", [testUser.email], done);
});

// Close database connection after tests
afterAll((done) => {
    db.end(done);
});

describe("Signup API Tests", () => {
    it("should register a new user", async () => {
        const response = await request(app)
            .post("/api/signup")
            .send(testUser)
            .set("Content-Type", "application/json");

        expect(response.status).toBe(302);
    });

    it("should not register a user with an existing email", async () => {
        const response = await request(app)
            .post("/api/signup")
            .send(testUser)
            .set("Content-Type", "application/json");

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Email is already registered.");
    });
});
