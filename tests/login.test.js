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

let token;

// Ensure user exists before running tests
beforeAll((done) => {
    const bcrypt = require("bcrypt");
    bcrypt.hash(testUser.password, 10, (err, hashedPassword) => {
        db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [testUser.name, testUser.email, hashedPassword],
            done
        );
    });
});

// Close database connection after tests
afterAll((done) => {
    db.end(done);
});

describe("Login API Tests", () => {
    it("should login an existing user and return a token", async () => {
        const response = await request(app)
            .post("/api/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            })
            .set("Content-Type", "application/json");

        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"]).toBeDefined();

        const cookie = response.headers["set-cookie"][0];
        token = cookie.split(";")[0].split("=")[1]; // Extract token from cookie
    });

    it("should not login with incorrect credentials", async () => {
        const response = await request(app)
            .post("/api/login")
            .send({
                email: testUser.email,
                password: "wrongpassword",
            })
            .set("Content-Type", "application/json");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid email or password.");
    });
});
