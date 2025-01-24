const request = require("supertest");
const app = require("../server"); // Adjust the path if necessary

describe("Product API Endpoint - Add Product", () => {
    let token;

    // Test setup: create a mock user and log in to get a token for authenticated endpoint
    beforeAll(async () => {
        const userData = {
            name: "Test Usernk",
            email: "testuser@example.com",
            password: "password123",
        };

        // Sign up the user
        await request(app)
            .post("/api/signup")
            .send(userData);

        // Log in to get the JWT token
        const loginResponse = await request(app)
            .post("/api/login")
            .send({
                email: userData.email,
                password: userData.password,
            });

        // Ensure token is retrieved correctly
        token = loginResponse.headers["set-cookie"][0].split(";")[0].split("=")[1];
    });

    // Test the POST /api/products endpoint (add new product)
    it("should add a new product", async () => {
        const newProduct = {
            name: "Test Product",
            category: "Test Category",
            description: "This is a test product.",
            price: 100,
            image_url: "https://example.com/image.jpg",
        };

        // Send POST request to add a new product
        const response = await request(app)
            .post("/api/products")
            .set("Cookie", `token=${token}`) // Ensure token is passed in the cookie header
            .send(newProduct)
            .set("Content-Type", "application/json");

        // Verify the response
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Product added successfully.");
    });
});
