const request = require("supertest");
const app = require("../app");

const { teardownMongoose } = require("../utils/testTeardownMongoose");
const userData = require("../data/testUserData");
const User = require("../models/user.model");

const jwt = require("jsonwebtoken");
jest.mock("jsonwebtoken");

describe("User Route", () => {
  let signedInAgent;

  afterAll(async () => {
    await teardownMongoose();
  });

  beforeEach(async () => {
    await User.create(userData);
    signedInAgent = request.agent(app);
    await signedInAgent.post("/user/login").send(userData[0]);
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await User.deleteMany();
  });

  it("POST /user/register should add a user and return a new user object", async () => {
    const expectedUser = {
      username: "aberkhoo",
      firstName: "Aber",
      lastName: "Khoo",
      password: "123456789",
      email: "Aber_Hoo@gmail.com",
    };

    const { body: actualUser } = await request(app)
      .post("/user/register")
      .send(expectedUser)
      .expect(200);

    expect(actualUser.username).toBe(expectedUser.username.toLowerCase());
    expect(actualUser.firstName).toBe(expectedUser.firstName);
    expect(actualUser.lastName).toBe(expectedUser.lastName);
    expect(actualUser.email).toBe(expectedUser.email);
    expect(actualUser.password).not.toBe(expectedUser.password);
  });

  describe("/login", () => {
    it("POST /user/login should login user if username and password is correct", async () => {
      const loginUser = {
        username: userData[1].username,
        password: userData[1].password,
      };

      const { text: message } = await request(app)
        .post("/user/login")
        .send(loginUser)
        .expect("set-cookie", /token=.*; Path=\/; Expires=.* HttpOnly/)
        .expect(200);

      expect(message).toEqual("You are logged in");
    });

    it("POST /user/login should not log trainer in when password is incorrect", async () => {
      const wrongUser = {
        username: userData[1].username,
        password: "random123",
      };

      const { body: error } = await request(app)
        .post("/user/login")
        .send(wrongUser)
        .expect(400);

      expect(error.error).toBe("Wrong password");
    });
  });

  it("GET /user/:username should return user information when login as correct user", async () => {
    const userIndex = 0;
    const { password, ...expectedUserInformation } = userData[userIndex];
    const expectedUsername = userData[userIndex].username;

    console.log(expectedUsername);

    jwt.verify.mockReturnValueOnce({ username: expectedUsername });

    const { body: actualUser } = await signedInAgent
      .get(`/user/${expectedUsername}`)
      .expect(200);

    console.log(actualUser);
    expect(jwt.verify).toBeCalledTimes(1);
    expect(actualUser).toMatchObject(expectedUserInformation);
  });

  it("GET /user/:username should return 401 unathorized when token is invalid", async () => {
    const expectedUsername = userData[0].username;

    jwt.verify.mockImplementationOnce(() => {
      throw new Error("token not valid");
    });

    const { body: error } = await signedInAgent
      .get(`/user/${expectedUsername}`)
      .expect(401);
    expect(jwt.verify).toBeCalledTimes(1);
    expect(error.error).toBe("You are not authorized");
  });

  it("GET /user/:username should return 403 Forbidden when login with incorrect user", async () => {
    const mockUsername = userData[0].username;
    const accessUsername = userData[1].username;

    jwt.verify.mockReturnValueOnce({ username: mockUsername });

    const { body: error } = await signedInAgent
      .get(`/user/${accessUsername}`)
      .expect(403);
    expect(jwt.verify).toBeCalledTimes(1);
    expect(error.error).toBe("Forbidden");
  });

  it("GET /user/:username should return 401 Unauthorized when when no token is provided", async () => {
    const expectedUsername = userData[0].username;

    const { body: error } = await request(app)
      .get(`/user/${expectedUsername}`)
      .expect(401);
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(error.error).toBe("You are not authorized");
  });

  describe("/logout", () => {
    it("POST /user/logout should logout and clear cookie", async () => {
      const response = await request(app).post("/user/logout").expect(200);
      expect(response.text).toBe("You have been logged out");
      expect(response.headers["set-cookie"][0]).toMatch(/^token=/);
    });
  });
});
