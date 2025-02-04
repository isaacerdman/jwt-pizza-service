const request = require("supertest");
const express = require("express");
const { DB } = require("../src/database/database.js");
const { authRouter } = require("../src/routes/authRouter.js");
const orderRouter = require("../src/routes/orderRouter.js");

jest.mock("../src/database/database.js");
jest.mock("../src/routes/authRouter.js", () => ({
  authRouter: {
    authenticateToken: (req, res, next) => {
      req.user = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        isRole: (role) => role === "Admin",
      };
      next();
    },
  },
}));

const app = express();
app.use(express.json());
app.use("/api/order", orderRouter);

describe("Order Router", () => {
  it("GET /api/order/menu should return the menu", async () => {
    DB.getMenu.mockResolvedValue([{ id: 1, title: "Veggie", price: 0.0038 }]);
    const res = await request(app).get("/api/order/menu");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, title: "Veggie", price: 0.0038 }]);
  });

  it("GET /api/order should return user orders", async () => {
    DB.getOrders.mockResolvedValue({ dinerId: 1, orders: [] });
    const res = await request(app)
      .get("/api/order")
      .set("Authorization", "Bearer mock_token");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ dinerId: 1, orders: [] });
  });

  //   it("POST /api/order should create a new order", async () => {
  //     DB.addDinerOrder.mockResolvedValue({
  //       id: 1,
  //       franchiseId: 1,
  //       storeId: 1,
  //       items: [],
  //     });
  //     const res = await request(app)
  //       .post("/api/order")
  //       .send({ franchiseId: 1, storeId: 1, items: [] })
  //       .set("Authorization", "Bearer mock_token");
  //     expect(res.status).toBe(200);
  //     expect(res.body.order).toHaveProperty("id", 1);
  //   });
});
