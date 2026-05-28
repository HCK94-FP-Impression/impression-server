const request = require("supertest");
const app = require("../app");
const { User, Cv } = require("../models");
const { signToken } = require("../helpers/jwt");

let token;
let tokenNoQuota;
let tokenNoCV; // user dengan quota tapi tidak punya CV

const validCvPayload = {
  experiences: [
    {
      title: "Backend Developer",
      company: "PT Test",
      startDate: "2020-01-01",
      endDate: "2023-01-01",
      description: "Developed REST APIs",
    },
  ],
  educations: [
    {
      degree: "S1 Informatika",
      institution: "Universitas Indonesia",
      startDate: "2016-01-01",
      endDate: "2020-01-01",
      gpa: 3.5,
    },
  ],
  skills: ["JavaScript", "Node.js", "PostgreSQL"],
};

beforeAll(async () => {
  const user = await User.create({
    username: "cvuser",
    email: "cvuser@mail.com",
    password: "123456",
    quota: 100,
  });
  token = signToken({ id: user.id, email: user.email, role: user.role });

  const userNoQuota = await User.create({
    username: "noquota",
    email: "noquota@mail.com",
    password: "123456",
    quota: 0,
  });
  tokenNoQuota = signToken({
    id: userNoQuota.id,
    email: userNoQuota.email,
    role: userNoQuota.role,
  });

  const userNoCV = await User.create({
    username: "nocv",
    email: "nocv@mail.com",
    password: "123456",
    quota: 10,
  });
  tokenNoCV = signToken({
    id: userNoCV.id,
    email: userNoCV.email,
    role: userNoCV.role,
  });
});

afterAll(async () => {
  await Cv.destroy({ truncate: true, restartIdentity: true, cascade: true });
  await User.destroy({ truncate: true, restartIdentity: true, cascade: true });
});

describe("POST /cvs/add", () => {
  test("Positive Case - Should create CV successfully", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send(validCvPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Create CV Success!");
  });

  test("Positive Case - Should create CV with endDate Present", async () => {
    const userTemp = await User.create({
      username: "tempuser",
      email: "tempuser@mail.com",
      password: "123456",
      quota: 10,
    });
    const tokenTemp = signToken({
      id: userTemp.id,
      email: userTemp.email,
      role: userTemp.role,
    });

    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${tokenTemp}`)
      .send({
        experiences: [
          {
            title: "Backend Developer",
            company: "PT Test",
            startDate: "2020-01-01",
            endDate: "present",
          },
        ],
        educations: [
          {
            degree: "S1 Informatika",
            institution: "Universitas Indonesia",
            startDate: "2016-01-01",
            endDate: "present",
            gpa: 3.5,
          },
        ],
        skills: ["JavaScript"],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Create CV Success!");
  });

  test("Negative Case - Should return 403 if quota is insufficient", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${tokenNoQuota}`)
      .send(validCvPayload);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "Not enough tokens to create CV",
    );
  });

  test("Negative Case - Should return 400 if experience title is missing", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        experiences: [
          {
            company: "PT Test",
            startDate: "2020-01-01",
            endDate: "2023-01-01",
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Title is required");
  });

  test("Negative Case - Should return 400 if experience company is missing", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        experiences: [
          {
            title: "Developer",
            startDate: "2020-01-01",
            endDate: "2023-01-01",
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Company is required");
  });

  test("Negative Case - Should return 400 if experience startDate is missing", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        experiences: [
          { title: "Developer", company: "PT Test", endDate: "2023-01-01" },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Start Date is required");
  });

  test("Negative Case - Should return 400 if experience start date is invalid", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        experiences: [
          {
            title: "Developer",
            company: "PT Test",
            startDate: "invalid-date",
            endDate: "2023-01-01",
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Invalid experience start date",
    );
  });

  test("Negative Case - Should return 400 if experience end date is invalid", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        experiences: [
          {
            title: "Developer",
            company: "PT Test",
            startDate: "2020-01-01",
            endDate: "invalid-date",
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Invalid experience end date",
    );
  });

  test("Negative Case - Should return 400 if experience end date is before start date", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        experiences: [
          {
            title: "Developer",
            company: "PT Test",
            startDate: "2023-01-01",
            endDate: "2020-01-01",
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Experience end date cannot be more recent than start date",
    );
  });

  test("Negative Case - Should return 400 if experience start date is in the future", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        experiences: [
          {
            title: "Developer",
            company: "PT Test",
            startDate: "2099-01-01",
            endDate: "2099-06-01",
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Experience start date cannot be more recent than current date",
    );
  });

  test("Negative Case - Should return 400 if education degree is missing", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          {
            institution: "UI",
            startDate: "2016-01-01",
            endDate: "2020-01-01",
            gpa: 3.5,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Degree is required");
  });

  test("Negative Case - Should return 400 if education institution is missing", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          {
            degree: "S1",
            startDate: "2016-01-01",
            endDate: "2020-01-01",
            gpa: 3.5,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Institution is required");
  });

  test("Negative Case - Should return 400 if education startDate is missing", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          { degree: "S1", institution: "UI", endDate: "2020-01-01", gpa: 3.5 },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Start Date is required");
  });

  test("Negative Case - Should return 400 if education gpa is missing", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          {
            degree: "S1",
            institution: "UI",
            startDate: "2016-01-01",
            endDate: "2020-01-01",
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "GPA is required");
  });

  test("Negative Case - Should return 400 if education start date is invalid", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          {
            degree: "S1",
            institution: "UI",
            startDate: "invalid-date",
            endDate: "2020-01-01",
            gpa: 3.5,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Invalid education start date",
    );
  });

  test("Negative Case - Should return 400 if education end date is invalid", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          {
            degree: "S1",
            institution: "UI",
            startDate: "2016-01-01",
            endDate: "invalid-date",
            gpa: 3.5,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Invalid education end date",
    );
  });

  test("Negative Case - Should return 400 if education end date is before start date", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          {
            degree: "S1",
            institution: "UI",
            startDate: "2020-01-01",
            endDate: "2016-01-01",
            gpa: 3.5,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Education end date cannot be more recent than start date",
    );
  });

  test("Negative Case - Should return 400 if education start date is in the future", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        educations: [
          {
            degree: "S1",
            institution: "UI",
            startDate: "2099-01-01",
            endDate: "2099-06-01",
            gpa: 3.5,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Education start date cannot be more recent than current date",
    );
  });

  test("Negative Case - Should return 400 if skill is empty string", async () => {
    const response = await request(app)
      .post("/cvs/add")
      .set("Cookie", `access_token=${token}`)
      .send({
        ...validCvPayload,
        skills: [""],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Skill name is required");
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).post("/cvs/add").send(validCvPayload);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});

describe("GET /cvs", () => {
  test("Positive Case - Should return user's CV", async () => {
    const response = await request(app)
      .get("/cvs")
      .set("Cookie", `access_token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("experiences");
    expect(response.body).toHaveProperty("educations");
    expect(response.body).toHaveProperty("skills");
  });

  test("Negative Case - Should return 404 if CV not found", async () => {
    const response = await request(app)
      .get("/cvs")
      .set("Cookie", `access_token=${tokenNoQuota}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "CV not found");
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app).get("/cvs");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});

describe("PATCH /cvs/edit", () => {
  test("Positive Case - Should update CV successfully", async () => {
    const response = await request(app)
      .patch("/cvs/edit")
      .set("Cookie", `access_token=${token}`)
      .send({
        skills: ["JavaScript", "Node.js", "PostgreSQL", "Docker"],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Update CV Success!");
  });

  test("Positive Case - Should update CV with experiences and educations", async () => {
    const response = await request(app)
      .patch("/cvs/edit")
      .set("Cookie", `access_token=${token}`)
      .send(validCvPayload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Update CV Success!");
  });

  test("Negative Case - Should return 403 if quota is insufficient", async () => {
    const response = await request(app)
      .patch("/cvs/edit")
      .set("Cookie", `access_token=${tokenNoQuota}`)
      .send({ skills: ["JavaScript"] });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "Not enough tokens to edit CV",
    );
  });

  test("Negative Case - Should return 404 if CV not found", async () => {
    const response = await request(app)
      .patch("/cvs/edit")
      .set("Cookie", `access_token=${tokenNoCV}`)
      .send({ skills: ["JavaScript"] });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "User CV not found!");
  });

  test("Negative Case - Should return 401 if no token", async () => {
    const response = await request(app)
      .patch("/cvs/edit")
      .send({ skills: ["JavaScript"] });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", expect.any(String));
  });
});
