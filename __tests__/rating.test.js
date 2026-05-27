const request = require("supertest");
const app = require("../app");
const { User, Post, Rating, Cv } = require("../models");
const { signToken } = require("../helpers/jwt");

jest.mock("../helpers/cloudinary", () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: "https://res.cloudinary.com/test/image/upload/test.jpg",
    }),
  },
}));

let tokenA;
let tokenB;
let tokenC;
let tokenD;
let postId;

beforeAll(async () => {
  // userA — punya post targetJob "Backend Developer"
  const userA = await User.create({
    username: "usera",
    email: "usera@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenA = signToken({ id: userA.id, email: userA.email, role: userA.role });

  const post = await Post.create({
    userId: userA.id,
    image: "https://res.cloudinary.com/test/image/upload/test.jpg",
    targetJob: "Backend Developer",
    criteria: ["confident", "professional", "approachable"],
  });
  postId = post.id;

  // userB — job_seeker, targetJob berbeda → social
  const userB = await User.create({
    username: "userb",
    email: "userb@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenB = signToken({ id: userB.id, email: userB.email, role: userB.role });

  await Post.create({
    userId: userB.id,
    image: "https://res.cloudinary.com/test/image/upload/test.jpg",
    targetJob: "Frontend Developer",
    criteria: ["creative", "detail-oriented", "collaborative"],
  });

  // userC — job_seeker, targetJob sama → professional_same_job
  const userC = await User.create({
    username: "userc",
    email: "userc@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenC = signToken({ id: userC.id, email: userC.email, role: userC.role });

  await Post.create({
    userId: userC.id,
    image: "https://res.cloudinary.com/test/image/upload/test.jpg",
    targetJob: "Backend Developer",
    criteria: ["confident", "professional", "approachable"],
  });

  // userD — recruiter → professional_recruiter
  const userD = await User.create({
    username: "userd",
    email: "userd@mail.com",
    password: "123456",
    quota: 10,
    role: "recruiter",
  });
  tokenD = signToken({ id: userD.id, email: userD.email, role: userD.role });
});

afterAll(async () => {
  await Rating.destroy({
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await Post.destroy({ truncate: true, restartIdentity: true, cascade: true });
  await User.destroy({ truncate: true, restartIdentity: true, cascade: true });
});

describe("POST /ratings", () => {
  test("Positive Case - Should create social rating", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        postId,
        scores: [1, 2, 3],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Rating created successfully",
    );
  });

  test("Positive Case - Should create professional_same_job rating", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenC}`)
      .send({
        postId,
        scores: [2, 2, 2],
        insight: "Profil yang solid untuk backend developer.",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Rating created successfully",
    );
  });

  test("Positive Case - Should create professional_recruiter rating", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenD}`)
      .send({
        postId,
        scores: [3, 3, 2],
        insight: "Kandidat yang menjanjikan.",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Rating created successfully",
    );
  });

  test("Positive Case - Should update existing rating", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        postId,
        scores: [2, 2, 2],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Rating updated successfully",
    );
  });

  test("Negative Case - Should return 400 if postId is not provided", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        scores: [1, 2, 3],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Post ID is required");
  });

  test("Negative Case - Should return 404 if post not found", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        postId: 9999,
        scores: [1, 2, 3],
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Post not found");
  });

  test("Negative Case - Should return 400 if scores is not an array", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        postId,
        scores: "invalid",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Scores must be an array");
  });

  test("Negative Case - Should return 400 if scores length does not match criteria", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        postId,
        scores: [1, 2],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Scores length must match criteria length",
    );
  });

  test("Negative Case - Should return 400 if score value is out of range", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        postId,
        scores: [1, 2, 5],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Each score must be an integer between 0 and 3",
    );
  });

  test("Negative Case - Should return 403 if rating own post", async () => {
    const response = await request(app)
      .post("/ratings")
      .set("Cookie", `access_token=${tokenA}`)
      .send({
        postId,
        scores: [1, 2, 3],
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "You cannot rate your own post",
    );
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app)
      .post("/ratings")
      .send({
        postId,
        scores: [1, 2, 3],
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});
