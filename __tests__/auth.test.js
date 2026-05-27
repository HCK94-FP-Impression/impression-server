const request = require("supertest");
const app = require("../app");
const { User } = require("../models");
const { signToken } = require("../helpers/jwt");

let token;

beforeAll(async () => {
  const user = await User.create({
    username: "testuser",
    email: "test@mail.com",
    password: "123456",
  });
  token = signToken({ id: user.id, email: user.email });
});

afterAll(async () => {
  await User.destroy({
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
});

describe("POST /auth/register", () => {
  test("Positive Case - Should register successfully", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "newuser",
      email: "newuser@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(201);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty(
      "message",
      "User registered successfully",
    );
    expect(response.body).toHaveProperty("userId", expect.any(Number));
  });

  test("Negative Case - Should return 400 if username is empty", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "",
      email: "noname@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Username cannot be empty");
  });

  test("Negative Case - Should return 400 if email is empty", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "someuser",
      email: "",
      password: "123456",
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Email cannot be empty");
  });

  test("Negative Case - Should return 400 if email is invalid", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "someuser",
      email: "invalidemail",
      password: "123456",
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty(
      "message",
      "Email must be a valid email address",
    );
  });

  test("Negative Case - Should return 400 if email already exists", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "duplicate",
      email: "test@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Negative Case - Should return 400 if password is empty", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "someuser",
      email: "someuser@mail.com",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Password cannot be empty");
  });
});

describe("POST /auth/login", () => {
  test("Positive Case - Should login successfully and set cookie", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Login successful");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  test("Negative Case - Should return 400 if email is not provided", async () => {
    const response = await request(app).post("/auth/login").send({
      password: "123456",
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Email is required");
  });

  test("Negative Case - Should return 400 if password is not provided", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@mail.com",
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", "Password is required");
  });

  test("Negative Case - Should return 401 if email not found", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "notfound@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(401);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty(
      "message",
      "Invalid email or password",
    );
  });

  test("Negative Case - Should return 401 if password is wrong", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@mail.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty(
      "message",
      "Invalid email or password",
    );
  });

  test("Negative Case - Should return 500 on unexpected error", async () => {
    const { User } = require("../models");
    jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("Unexpected"));

    const response = await request(app).post("/auth/login").send({
      email: "test@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Internal Server Error");
  });
});

describe("GET /auth/me", () => {
  test("Positive Case - Should return current user", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Cookie", `access_token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("id", expect.any(Number));
    expect(response.body.user).toHaveProperty("username", expect.any(String));
    expect(response.body.user).toHaveProperty("email", "test@mail.com");
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Negative Case - Should return 401 if token is expired", async () => {
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { id: 999, email: "expired@mail.com" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "0s" },
    );

    const response = await request(app)
      .get("/auth/me")
      .set("Cookie", `access_token=${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token expired");
  });
});
