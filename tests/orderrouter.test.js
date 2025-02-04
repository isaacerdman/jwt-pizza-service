const request = require("supertest");
const app = require("../src/service");
const { Role } = require("../src/database/database.js");
const utils = require("../src/routes/util.js");

let adUserTok;
let testUserTok;
let newItem;

const franchiseeUser = {
  name: "Franchisee User",
  email: "franchisee@test.com",
  password: "franchisee",
  roles: [{ role: Role.Franchisee }],
};

const createFranchise = async (franchise, authToken) => {
  return await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${authToken}`)
    .send(franchise);
};

beforeAll(async () => {
  adUserTok = await utils.getAdminAuthToken();
  utils.expectValidJwt(adUserTok);

  const registerResponse = await request(app)
    .post("/api/auth")
    .send(franchiseeUser);
  expect(registerResponse.status).toBe(200);

  const loginResponse = await request(app)
    .put("/api/auth")
    .send({ email: franchiseeUser.email, password: franchiseeUser.password });

  testUserTok = await utils.newUsersAuthToken();

  const franchiseResponse = await createFranchise(
    {
      name: `Pizza Palace #${utils.randomText(5)}`,
      admins: [{ email: franchiseeUser.email }],
    },
    adUserTok
  );

  expect(franchiseResponse.status).toBe(200);

  newItem = {
    title: "Student Pizza#" + utils.randomText(10),
    description: "Veggie",
    image: "pizza9.png",
    price: 0.0001,
  };
});

describe("Menu API", () => {
  test("GET /api/order/menu", async () => {
    const res = await request(app).get("/api/order/menu");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("PUT /api/order/menu", async () => {
    const res = await request(app)
      .put("/api/order/menu")
      .send(newItem)
      .set("Authorization", `Bearer ${await utils.getAdminAuthToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((item) => item.title === newItem.title)).toBe(true);
  });

  test("PUT /api/order/menu", async () => {
    const res = await request(app)
      .put("/api/order/menu")
      .send(newItem)
      .set("Authorization", `Bearer ${testUserTok}`);
    expect(res.status).toBe(403);
  });
});

describe("Orders API", () => {
  test("GET /api/order - Retrieve orders", async () => {
    const res = await request(app)
      .get("/api/order")
      .set("Authorization", `Bearer ${testUserTok}`);
    expect(res.status).toBe(200);
    expect(res.body.dinerId).toBeGreaterThan(0);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  test("POST /api/order - Cannot create order without authentication", async () => {
    const res = await request(app)
      .post("/api/order")
      .send({
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
      });
    expect(res.status).toBe(401);
  });

  test("POST /api/order - Cannot create order without items", async () => {
    const res = await request(app)
      .post("/api/order")
      .set("Authorization", `Bearer ${testUserTok}`);
    expect(res.status).toBe(500);
  });
});
