const request = require("supertest");
const app = require("../service.js");
const { Role, DB } = require("../database/database.js");

let adminUserAuthToken = null;
let newUserAuthToken = null;

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

function createUser() {
  return {
    name: "pizza diner",
    email: randomText(10) + "@test.com",
    password: "a",
  };
}

function newUsersAuthToken() {
  // if (newUserAuthToken) {
  //     return newUserAuthToken;
  // }
  newUserAuthToken = request(app)
    .post("/api/auth")
    .send(createUser())
    .then((res) => res.body.token);
  return newUserAuthToken;
}

function randomText(length) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

// function getAdminUser(){
//     const adminUser = {
//         name: 'Admin User',
//         email: 'admin@test.com',
//         password: 'admin',
//         roles: [{ role: Role.Admin }],
//     };
//     return adminUser;
// }

async function getAdminAuthToken() {
  // if (adminUserAuthToken) {
  //     return adminUserAuthToken;
  // }
  const newAdminUser = await createAdminUser();
  adminUserAuthToken = request(app)
    .put("/api/auth")
    .send(newAdminUser)
    .then((res) => res.body.token);
  return adminUserAuthToken;
  // const adminLoginRes = await request(app)
  //   .put('/api/auth')
  //   .send({ email: 'admin@test.com', password: 'admin' }); // Use predefined admin credentials
  // adminUserAuthToken = adminLoginRes.body.token;
  // return adminUserAuthToken;
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = "admin" + randomText(5);
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}

module.exports = {
  expectValidJwt,
  createUser,
  randomText,
  getAdminAuthToken,
  newUsersAuthToken,
  createAdminUser,
};
