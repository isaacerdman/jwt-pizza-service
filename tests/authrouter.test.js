const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { authRouter, setAuthUser } = require("../src/routes/authRouter.js");
const { DB, Role } = require("../src/database/database.js");
const config = require("../src/config.js");

jest.mock("../src/database/database.js");
jest.mock("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(setAuthUser);
app.use("/api/auth", authRouter);

describe("Auth Router", () => {
  let token;
  let user;

  beforeEach(() => {
    user = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      roles: [{ role: Role.Admin }],
    };
    token = "mockToken";
    jwt.sign.mockReturnValue(token);
    jwt.verify.mockReturnValue(user);
  });

  test("should register a new user", async () => {
    DB.addUser.mockResolvedValue(user);
    DB.loginUser.mockResolvedValue();

    const response = await request(app).post("/api/auth").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("token", token);
  });

  test("should login an existing user", async () => {
    DB.getUser.mockResolvedValue(user);
    DB.loginUser.mockResolvedValue();

    const response = await request(app)
      .put("/api/auth")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("token", token);
  });

  test("should logout a user", async () => {
    DB.isLoggedIn.mockResolvedValue(true);
    DB.logoutUser.mockResolvedValue();

    const response = await request(app)
      .delete("/api/auth")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "logout successful" });
  });

  test("should update user info", async () => {
    DB.updateUser.mockResolvedValue({ ...user, email: "updated@example.com" });
    DB.isLoggedIn.mockResolvedValue(true);

    const response = await request(app)
      .put(`/api/auth/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "updated@example.com", password: "newpass" });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("updated@example.com");
  });

  test("should not update user if unauthorized", async () => {
    const anotherUser = {
      id: 2,
      email: "other@example.com",
      roles: [{ role: "diner" }],
    };
    jwt.verify.mockReturnValue(anotherUser);
    DB.isLoggedIn.mockResolvedValue(true);

    const response = await request(app)
      .put("/api/auth/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "updated@example.com", password: "newpass" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "unauthorized" });
  });
});
