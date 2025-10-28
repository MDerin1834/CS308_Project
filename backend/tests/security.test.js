const express = require("express");
const request = require("supertest");
const setupSecurity = require("../src/middleware/security");

describe("Security Middleware", () => {
  let app;
  beforeEach(() => {
    app = express();
    process.env.CLIENT_URL = "http://localhost:3000";
    setupSecurity(app);
    app.get("/test", (req, res) => res.json({ ok: true }));
  });

  it("should set security headers with helmet", async () => {
    const res = await request(app).get("/test");
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
  });

  it("should allow CORS from CLIENT_URL", async () => {
    const res = await request(app)
      .get("/test")
      .set("Origin", "http://localhost:3000");
    expect(res.statusCode).toBe(200);
  });

  it("should apply rate limiting", async () => {
    for (let i = 0; i < 101; i++) await request(app).get("/test");
    const res = await request(app).get("/test");
    expect(res.statusCode).toBe(429);
  });
});
