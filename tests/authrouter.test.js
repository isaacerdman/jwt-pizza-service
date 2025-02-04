const request = require("supertest");
const app = require("../src/service");
const utils = require("../src/routes/util.js");

let tUser = { name: "pizza diner", email: "", password: "a" };
let tUserTok, adUserTok, userToUpdate;

beforeAll(async () => {
  tUser.email = `${utils.randomText(10)}@tests.com`;

  const registerRes = await request(app).post("/api/auth").send(tUser);
  tUserTok = registerRes.body.token;
  utils.expectValidJwt(tUserTok);

  userToUpdate = await utils.createAdminUser();
  adUserTok = await utils.getAdminAuthToken();
});

describe("Authentication Flow", () => {
  test("User can log in with valid credentials", async () => {
    const loginRes = await request(app).put("/api/auth").send(tUser);

    expect(loginRes.status).toBe(200);
    utils.expectValidJwt(loginRes.body.token);

    const expectedUser = { ...tUser, roles: [{ role: "diner" }] };
    delete expectedUser.password;
    expect(loginRes.body.user).toMatchObject(expectedUser);
  });

  test("Login fails with incorrect credentials", async () => {
    const loginRes = await request(app).put("/api/auth").send({
      email: tUser.email,
      password: "wrongpassword",
    });

    expect(loginRes.status).toBe(404);
    expect(loginRes.body.message).toBe("unknown user");
  });

  test("User can log out and token is invalidated", async () => {
    const logoutRes = await request(app)
      .delete("/api/auth")
      .set("Authorization", `Bearer ${tUserTok}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe("logout successful");

    const protectedRes = await request(app)
      .put("/api/auth/1")
      .set("Authorization", `Bearer ${tUserTok}`);

    expect(protectedRes.status).toBe(401);
  });
});

describe("User Management", () => {
  test("User can register successfully", async () => {
    const newUser = {
      name: "pizza diner tester",
      email: `${utils.randomText()}@test.com`,
      password: "a",
    };

    const registerRes = await request(app).post("/api/auth").send(newUser);

    expect(registerRes.status).toBe(200);
    utils.expectValidJwt(registerRes.body.token);

    const expectedUser = { ...newUser, roles: [{ role: "diner" }] };
    delete expectedUser.password;
    expect(registerRes.body.user).toMatchObject(expectedUser);
  });

  test("Admin can update a user", async () => {
    let newUser = utils.createUser();
    const registerRes = await request(app).post("/api/auth").send(newUser);
    expect(registerRes.status).toBe(200);

    newUser.id = registerRes.body.user.id;

    const updateRes = await request(app)
      .put(`/api/auth/${newUser.id}`)
      .set("Authorization", `Bearer ${adUserTok}`)
      .send({ email: newUser.email, password: "test" });

    expect(updateRes.status).toBe(200);
  });

  test("Non-admin user cannot update another user", async () => {
    const updateRes = await request(app)
      .put(`/api/auth/${userToUpdate.id}`)
      .set("Authorization", `Bearer ${tUserTok}`)
      .send({ email: "updated@test.com", password: "newpassword" });

    expect(updateRes.status).toBe(401);
    expect(updateRes.body.message).toBe("unauthorized");
  });
});
