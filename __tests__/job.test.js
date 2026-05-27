const request = require("supertest");
const app = require("../app");
const { User, Post } = require("../models");
const { signToken } = require("../helpers/jwt");

// Mock axios
jest.mock("axios");
const axios = require("axios");

let token;
let tokenNoPost;

beforeAll(async () => {
  const user = await User.create({
    username: "jobuser",
    email: "jobuser@mail.com",
    password: "123456",
    quota: 10,
  });
  token = signToken({ id: user.id, email: user.email, role: user.role });

  await Post.create({
    userId: user.id,
    image: "https://res.cloudinary.com/test/image/upload/test.jpg",
    targetJob: "Backend Developer",
    criteria: ["confident", "professional", "approachable"],
  });

  const userNoPost = await User.create({
    username: "nopostuser",
    email: "nopostuser@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenNoPost = signToken({
    id: userNoPost.id,
    email: userNoPost.email,
    role: userNoPost.role,
  });
});

afterAll(async () => {
  await Post.destroy({ truncate: true, restartIdentity: true, cascade: true });
  await User.destroy({ truncate: true, restartIdentity: true, cascade: true });
});

describe("GET /jobs", () => {
  test("Positive Case - Should return job recommendations", async () => {
    axios.post.mockResolvedValue({
      data: {
        totalCount: 2,
        jobs: [
          {
            title: "Senior Backend Engineer",
            company: "Ajaib",
            location: "Indonesia",
            link: "https://jooble.org/jdp/123",
          },
          {
            title: "Backend Developer",
            company: "Tokopedia",
            location: "Jakarta",
            link: "https://jooble.org/jdp/456",
          },
        ],
      },
    });

    const response = await request(app)
      .get("/jobs")
      .set("Cookie", `access_token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalCount");
    expect(response.body).toHaveProperty("jobs");
    expect(response.body.jobs).toBeInstanceOf(Array);
    expect(response.body.jobs[0]).toHaveProperty("title", expect.any(String));
    expect(response.body.jobs[0]).toHaveProperty("company", expect.any(String));
    expect(response.body.jobs[0]).toHaveProperty(
      "location",
      expect.any(String),
    );
    expect(response.body.jobs[0]).toHaveProperty("link", expect.any(String));
  });

  test("Negative Case - Should return 400 if user has no post", async () => {
    const response = await request(app)
      .get("/jobs")
      .set("Cookie", `access_token=${tokenNoPost}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Post is required");
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).get("/jobs");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});
