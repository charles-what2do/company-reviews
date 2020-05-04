const request = require("supertest");
const app = require("./app");

describe("App", () => {
  it("GET / should return JSON object of all endpoints", async () => {
    const { body } = await request(app).get("/");
    expect(body).toEqual({
      "0": "GET /",
      "1": "GET /companies",
      "2": "GET /companies/:id",
      "3": "POST /companies/:id/reviews",
      "4": "GET /user",
      "5": "POST /user/register",
      "6": "POST /user/login",
      "7": "POST /user/logout",
    });
  });
});
