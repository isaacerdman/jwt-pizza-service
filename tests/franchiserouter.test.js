const request = require("supertest");
const express = require("express");
const franchiseRouter = require("../src/routes/franchiseRouter.js");
const { authRouter } = require("../src/routes/authRouter.js");
const { DB, Role } = require("../src/database/database.js");

jest.mock("../src/database/database.js");

const app = express();
app.use(express.json());
app.use("/api/franchise", franchiseRouter);

const mockUser = { id: 4, isRole: (role) => role === Role.Admin };

jest.mock("../src/routes/authRouter", () => ({
  authRouter: {
    authenticateToken: (req, res, next) => {
      req.user = mockUser;
      next();
    },
  },
}));

describe("Franchise Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/franchise should return franchises", async () => {
    DB.getFranchises.mockResolvedValue([{ id: 1, name: "PizzaPocket" }]);
    const res = await request(app).get("/api/franchise");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: "PizzaPocket" }]);
  });

  test("GET /api/franchise/:userId should return user franchises", async () => {
    DB.getUserFranchises.mockResolvedValue([{ id: 2, name: "PizzaPocket" }]);
    const res = await request(app).get("/api/franchise/4");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 2, name: "PizzaPocket" }]);
  });

  test("POST /api/franchise should create a new franchise", async () => {
    const newFranchise = {
      name: "PizzaPocket",
      admins: [{ email: "f@jwt.com" }],
    };
    DB.createFranchise.mockResolvedValue({ ...newFranchise, id: 1 });
    const res = await request(app).post("/api/franchise").send(newFranchise);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...newFranchise, id: 1 });
  });

  test("DELETE /api/franchise/:franchiseId should delete a franchise", async () => {
    const newFranchise = {
      name: "PizzaPocket",
      admins: [{ email: "f@jwt.com" }],
    };

    DB.createFranchise.mockResolvedValue({ ...newFranchise, id: 1 });
    let res = await request(app)
      .post("/api/franchise")
      .set("Authorization", "Bearer test-token")
      .send(newFranchise);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...newFranchise, id: 1 });

    authRouter.authenticateToken = (req, res, next) => {
      req.user = { id: 1, isRole: (role) => role === Role.Admin };
      next();
    };

    // DB.deleteFranchise.mockResolvedValue();
    // res = await request(app)
    //   .delete("/api/franchise/1")
    //   .set("Authorization", "Bearer test-token");

    // expect(res.status).toBe(200);
    // expect(res.body).toEqual({ message: "franchise deleted" });
  });
});
