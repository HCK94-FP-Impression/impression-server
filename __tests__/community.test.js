const request = require("supertest");
const app = require("../app");
const {
  User,
  Community,
  CommunityMember,
  CommunityPost,
  Post,
  Rating,
} = require("../models");
const { signToken } = require("../helpers/jwt");

let tokenA; // leader
let tokenB; // approved member
let tokenC; // untuk join test
let tokenE; // non-member sejati
let communityId;

beforeAll(async () => {
  const userA = await User.create({
    username: "leadera",
    email: "leadera@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenA = signToken({ id: userA.id, email: userA.email, role: userA.role });

  const userB = await User.create({
    username: "memberb",
    email: "memberb@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenB = signToken({ id: userB.id, email: userB.email, role: userB.role });

  const userC = await User.create({
    username: "userc",
    email: "userc@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenC = signToken({ id: userC.id, email: userC.email, role: userC.role });

  const userE = await User.create({
    username: "usere",
    email: "usere@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenE = signToken({ id: userE.id, email: userE.email, role: userE.role });

  const community = await Community.create({
    name: "JavaScript Indonesia",
    description: "Komunitas JavaScript di Indonesia",
    domain: "javascript",
    leaderId: userA.id,
  });
  communityId = community.id;

  await CommunityMember.create({
    communityId: community.id,
    userId: userA.id,
    status: "approved",
  });

  await CommunityMember.create({
    communityId: community.id,
    userId: userB.id,
    status: "approved",
  });

  const postA = await Post.create({
    userId: userA.id,
    image: "https://res.cloudinary.com/test/image/upload/test.jpg",
    targetJob: "Backend Developer",
    criteria: ["confident", "professional", "approachable"],
  });

  await Rating.create({
    postId: postA.id,
    voterId: userB.id,
    scores: [2, 3, 1],
    ratingType: "social",
  });

  await Rating.create({
    postId: postA.id,
    voterId: userB.id,
    scores: [2, 3, 1],
    ratingType: "professional_recruiter",
  });

  const userF = await User.create({
    username: "userf",
    email: "userf@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenF = signToken({ id: userF.id, email: userF.email, role: userF.role });

  await CommunityMember.create({
    communityId: community.id,
    userId: userF.id,
    status: "pending",
  });
});

afterAll(async () => {
  await Rating.destroy({
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await Post.destroy({ truncate: true, restartIdentity: true, cascade: true });

  await CommunityPost.destroy({
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await CommunityMember.destroy({
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await Community.destroy({
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await User.destroy({ truncate: true, restartIdentity: true, cascade: true });
});

describe("GET /communities", () => {
  test("Positive Case - Should return list of communities", async () => {
    const response = await request(app)
      .get("/communities")
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("communities");
    expect(response.body.communities).toBeInstanceOf(Array);
    expect(response.body.communities).toHaveLength(1);
  });

  test("Positive Case - Should filter by domain", async () => {
    const response = await request(app)
      .get("/communities?domain=javascript")
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.communities).toBeInstanceOf(Array);
    response.body.communities.forEach((c) => {
      expect(c.domain).toBe("javascript");
    });
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).get("/communities");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Positive Case - Should filter by search name", async () => {
    const response = await request(app)
      .get("/communities?search=JavaScript")
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.communities).toBeInstanceOf(Array);
    expect(response.body.communities.length).toBeGreaterThan(0);
  });
});

describe("GET /communities/:id", () => {
  test("Positive Case - Should return community detail", async () => {
    const response = await request(app)
      .get(`/communities/${communityId}`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("community");
    expect(response.body).toHaveProperty("memberCount");
    expect(response.body).toHaveProperty("membershipStatus");
    expect(response.body.community).toHaveProperty("id", communityId);
  });

  test("Negative Case - Should return 404 if community not found", async () => {
    const response = await request(app)
      .get("/communities/9999")
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Community not found");
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).get(`/communities/${communityId}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Positive Case - Should return membershipStatus approved", async () => {
    const response = await request(app)
      .get(`/communities/${communityId}`)
      .set("Cookie", `access_token=${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("membershipStatus", "approved");
  });
});

describe("POST /communities/:id/join", () => {
  test("Positive Case - Should send join request successfully", async () => {
    const response = await request(app)
      .post(`/communities/${communityId}/join`)
      .set("Cookie", `access_token=${tokenC}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Join request sent successfully",
    );
  });

  test("Negative Case - Should return 400 if already pending", async () => {
    const response = await request(app)
      .post(`/communities/${communityId}/join`)
      .set("Cookie", `access_token=${tokenC}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Membership pending approval",
    );
  });

  test("Negative Case - Should return 400 if already a member", async () => {
    const response = await request(app)
      .post(`/communities/${communityId}/join`)
      .set("Cookie", `access_token=${tokenB}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Already a member");
  });

  test("Negative Case - Should return 404 if community not found", async () => {
    const response = await request(app)
      .post("/communities/9999/join")
      .set("Cookie", `access_token=${tokenC}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Community not found");
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).post(
      `/communities/${communityId}/join`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});

describe("PATCH /communities/:id/members/:userId/approve", () => {
  let pendingUserId;

  beforeAll(async () => {
    const pending = await CommunityMember.findOne({
      where: { communityId, status: "pending" },
    });
    pendingUserId = pending.userId;
  });

  test("Positive Case - Should approve member successfully", async () => {
    const response = await request(app)
      .patch(`/communities/${communityId}/members/${pendingUserId}/approve`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Member approved successfully",
    );
  });

  test("Negative Case - Should return 403 if not leader", async () => {
    const response = await request(app)
      .patch(`/communities/${communityId}/members/${pendingUserId}/approve`)
      .set("Cookie", `access_token=${tokenB}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "Only the community leader can approve members",
    );
  });

  test("Negative Case - Should return 404 if pending membership not found", async () => {
    const response = await request(app)
      .patch(`/communities/${communityId}/members/9999/approve`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      "Pending membership not found",
    );
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).patch(
      `/communities/${communityId}/members/${pendingUserId}/approve`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Negative Case - Should return 404 if community not found", async () => {
    const response = await request(app)
      .patch(`/communities/9999/members/1/approve`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Community not found");
  });
});

describe("PATCH /communities/:id/members/:userId/reject", () => {
  let pendingUserId;

  beforeAll(async () => {
    const userD = await User.create({
      username: "userd",
      email: "userd@mail.com",
      password: "123456",
      quota: 10,
    });
    await CommunityMember.create({
      communityId,
      userId: userD.id,
      status: "pending",
    });
    pendingUserId = userD.id;
  });

  test("Positive Case - Should reject member successfully", async () => {
    const response = await request(app)
      .patch(`/communities/${communityId}/members/${pendingUserId}/reject`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Member rejected successfully",
    );
  });

  test("Negative Case - Should return 403 if not leader", async () => {
    const response = await request(app)
      .patch(`/communities/${communityId}/members/${pendingUserId}/reject`)
      .set("Cookie", `access_token=${tokenB}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "Only the community leader can reject members",
    );
  });

  test("Negative Case - Should return 404 if pending membership not found", async () => {
    const response = await request(app)
      .patch(`/communities/${communityId}/members/9999/reject`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      "Pending membership not found",
    );
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).patch(
      `/communities/${communityId}/members/${pendingUserId}/reject`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Negative Case - Should return 404 if community not found", async () => {
    const response = await request(app)
      .patch(`/communities/9999/members/1/reject`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Community not found");
  });
});

describe("GET /communities/:id/dashboard", () => {
  test("Positive Case - Should return dashboard for approved member", async () => {
    const response = await request(app)
      .get(`/communities/${communityId}/dashboard`)
      .set("Cookie", `access_token=${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("community");
    expect(response.body).toHaveProperty("isLeader");
    expect(response.body).toHaveProperty("leaderboard");
    expect(response.body).toHaveProperty("statistics");
  });

  test("Positive Case - Should return pendingMembers for leader", async () => {
    const response = await request(app)
      .get(`/communities/${communityId}/dashboard`)
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("isLeader", true);
    expect(response.body).toHaveProperty("pendingMembers");
    expect(response.body.pendingMembers).toBeInstanceOf(Array);
  });

  test("Negative Case - Should return 403 if not a member", async () => {
    const response = await request(app)
      .get(`/communities/${communityId}/dashboard`)
      .set("Cookie", `access_token=${tokenE}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "Only approved members can access the dashboard",
    );
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).get(
      `/communities/${communityId}/dashboard`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Negative Case - Should return 404 if community not found", async () => {
    const response = await request(app)
      .get("/communities/9999/dashboard")
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Community not found");
  });
});

describe("GET /communities/:id/posts", () => {
  test("Positive Case - Should return forum posts", async () => {
    const response = await request(app)
      .get(`/communities/${communityId}/posts`)
      .set("Cookie", `access_token=${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("posts");
    expect(response.body.posts).toBeInstanceOf(Array);
  });

  test("Negative Case - Should return 403 if not a member", async () => {
    const response = await request(app)
      .get(`/communities/${communityId}/posts`)
      .set("Cookie", `access_token=${tokenE}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "Only approved members can view posts",
    );
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).get(
      `/communities/${communityId}/posts`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });

  test("Negative Case - Should return 404 if community not found", async () => {
    const response = await request(app)
      .get("/communities/9999/posts")
      .set("Cookie", `access_token=${tokenA}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Community not found");
  });

  test("Negative Case - Should return 404 if community not found", async () => {
    const response = await request(app)
      .post("/communities/9999/posts")
      .set("Cookie", `access_token=${tokenA}`)
      .send({ title: "Test", content: "Test content" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Community not found");
  });
});

describe("POST /communities/:id/posts", () => {
  test("Positive Case - Should create forum post successfully", async () => {
    const response = await request(app)
      .post(`/communities/${communityId}/posts`)
      .set("Cookie", `access_token=${tokenB}`)
      .send({
        title: "Tips Interview Backend",
        content: "Sharing pengalaman interview backend developer.",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("post");
    expect(response.body.post).toHaveProperty(
      "title",
      "Tips Interview Backend",
    );
    expect(response.body.post).toHaveProperty("content", expect.any(String));
  });

  test("Negative Case - Should return 403 if not a member", async () => {
    const response = await request(app)
      .post(`/communities/${communityId}/posts`)
      .set("Cookie", `access_token=${tokenE}`)
      .send({
        title: "Tips Interview",
        content: "Content here.",
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "Only approved members can create posts",
    );
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app)
      .post(`/communities/${communityId}/posts`)
      .send({
        title: "Tips Interview",
        content: "Content here.",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});
