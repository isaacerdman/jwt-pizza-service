const request = require("supertest");
const app = require("../src/service");
const { Role } = require("../src/database/database.js");
const utils = require("../src/routes/util.js");

let adUserTok;
let franchUserTok;
let fId;
let storeId;

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
  franchUserTok = loginResponse.body.token;

  const franchiseResponse = await createFranchise(
    {
      name: `Pizza Palace #${utils.randomText(5)}`,
      admins: [{ email: franchiseeUser.email }],
    },
    adUserTok
  );

  expect(franchiseResponse.status).toBe(200);
  fId = franchiseResponse.body.id;
});

describe("Franchises API", () => {
  test("GET /api/franchise - Retrieve all franchises", async () => {
    const response = await request(app).get("/api/franchise");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /api/franchise/:userId", async () => {
    const response = await request(app)
      .get(`/api/franchise/${franchiseeUser.id}`)
      .set("Authorization", `Bearer ${franchUserTok}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("POST /api/franchise", async () => {
    const response = await createFranchise(
      { name: "Unauthorized Franchise" },
      franchUserTok
    );
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("unable to create a franchise");
  });

  test("DELETE /api/franchise/:fId", async () => {
    const response = await request(app)
      .delete(`/api/franchise/${fId}`)
      .set("Authorization", `Bearer ${adUserTok}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("franchise deleted");
  });

  test("DELETE /api/franchise/:franchiseId", async () => {
    const response = await request(app)
      .delete(`/api/franchise/${fId}`)
      .set("Authorization", `Bearer ${franchUserTok}`);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("unable to delete a franchise");
  });
});

describe("Stores API", () => {
  test("POST /api/franchise/:franchiseId/store", async () => {
    const response = await request(app)
      .post(`/api/franchise/${fId}/store`)
      .set("Authorization", `Bearer ${franchUserTok}`)
      .send({ name: "Downtown Store" });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("unable to create a store");
  });

  test("DELETE /api/franchise/:franchiseId/store/:storeId", async () => {
    const response = await request(app)
      .delete(`/api/franchise/${fId}/store/${storeId}`)
      .set("Authorization", `Bearer ${adUserTok}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("store deleted");
  });

  test("DELETE /api/franchise/:franchiseId/store/:storeId", async () => {
    const response = await request(app)
      .delete(`/api/franchise/${fId}/store/${storeId}`)
      .set("Authorization", `Bearer ${franchUserTok}`);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("unable to delete a store");
  });
});
