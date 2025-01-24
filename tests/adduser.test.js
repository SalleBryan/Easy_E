const request = require("supertest");
const app = require("../server"); // Adjust the path if necessary

describe("User API Endpoint - Signup", () => {
    const newUser = {
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password123", // Make sure this meets your password criteria
    };

    it("should create a new user", async () => {
        // Send POST request to signup route
        const response = await request(app)
            .post("/api/signup")
            .send(newUser)
            .set("Content-Type", "application/json");

        // Check if the response status is 201 (created)
        expect(response.status).toBe(302); // Assuming the route redirects after successful signup
        
        // You can also check for a successful signup message or redirection
        // Example: check for redirect to homepage
        expect(response.headers.location).toBe("/");

        // Optionally, check the database directly (if you want to make sure the user is created)
        // This step can be skipped if you only care about the API response.
    });

    it("should not create a user with existing email", async () => {
        // Send POST request to signup route with the same email
        const response = await request(app)
            .post("/api/signup")
            .send(newUser)
            .set("Content-Type", "application/json");

        // Expect the response status to indicate an error (e.g., 400 Bad Request)
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Email is already registered.");
    });

    it("should not create a user with missing fields", async () => {
        // Send POST request to signup route with missing required fields (e.g., missing email)
        const invalidUser = { name: "Jane Doe", password: "password123" };
        const response = await request(app)
            .post("/api/signup")
            .send(invalidUser)
            .set("Content-Type", "application/json");

        // Expect the response status to indicate an error (e.g., 400 Bad Request)
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("All fields are required.");
    });
});
