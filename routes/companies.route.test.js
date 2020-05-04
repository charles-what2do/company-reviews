const request = require("supertest");
const app = require("../app");

const { teardownMongoose } = require("../utils/testTeardownMongoose");
const userData = require("../data/testUserData");
const User = require("../models/user.model");
const companiesData = require("../data/testCompaniesData");
const Company = require("../models/company.model");

const jwt = require("jsonwebtoken");
jest.mock("jsonwebtoken");

describe("Company Route", () => {
  let signedInAgent;

  afterAll(async () => {
    await teardownMongoose();
  });

  beforeEach(async () => {
    await User.create(userData);
    await Company.create(companiesData);
    signedInAgent = request.agent(app);
    await signedInAgent.post("/user/login").send(userData[0]);
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await Company.deleteMany();
    await User.deleteMany();
  });

  it("GET /companies should return the test company without reviews", async () => {
    const { reviews, ...expectedCompanyInfo } = companiesData[0];

    const { body: actualCompanies } = await request(app)
      .get("/companies")
      .expect(200);

    expect(actualCompanies).toMatchObject([expectedCompanyInfo]);
  });

  it("GET /companies/:id should return the test company", async () => {
    const { body: actualCompany } = await request(app)
      .get(`/companies/${companiesData[0].id}`)
      .expect(200);

    expect(actualCompany).toMatchObject(companiesData[0]);
  });

  it("POST /companies/:id/reviews should add an review and return updated company object if successfully logged in", async () => {
    const review = {
      rating: 4,
      title: "eligendi adipisci",
      review:
        "Et voluptatem voluptas quisquam quos officia assumenda. Mollitia delectus vitae quia molestias nulla ut hic praesentium. Sed et assumenda et iusto velit laborum sunt non.",
    };

    jwt.verify.mockReturnValueOnce({
      userid: userData[0].id,
      username: userData[0].username,
    });

    const { body: updatedReview } = await signedInAgent
      .post(`/companies/${companiesData[0].id}/reviews`)
      .send(review)
      .expect(201);

    console.log(updatedReview);
    expect(updatedReview).toMatchObject(review);
    expect(updatedReview.userId).toBe(userData[0].id);
    expect(updatedReview.username).toBe(userData[0].username);
  });

  it("POST /companies/:id/reviews should return 401 Unauthorized when when no token is provided", async () => {
    const { body: error } = await request(app)
      .post(`/companies/${companiesData[0].id}/reviews`)
      .expect(401);
    expect(error.error).toBe("You are not authorized");
  });
});
