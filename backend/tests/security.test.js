const express = require("express");
const request = require("supertest");
const setupSecurity = require("../src/middleware/security");

describe("Security Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    process.env.CLIENT_URL = "http://localhost:3000";

    // helmet + rateLimit + hpp vs.
    setupSecurity(app);

    // 🔹 Rate limiter sadece /api altında çalışıyor, o yüzden endpoint'i oraya koyuyoruz
    app.get("/api/test", (req, res) => res.json({ ok: true }));
  });

  it("should set security headers with helmet", async () => {
    const res = await request(app).get("/api/test");
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
  });

  it("should allow CORS from CLIENT_URL (status 200)", async () => {
    const res = await request(app)
      .get("/api/test")
      .set("Origin", "http://localhost:3000");
    expect(res.statusCode).toBe(200);
  });

  it("should apply rate limiting", async () => {
    // 100 istek hakkı var, 101. istekte 429 bekliyoruz
    for (let i = 0; i < 101; i++) {
      await request(app).get("/api/test");
    }
    const res = await request(app).get("/api/test");
    expect(res.statusCode).toBe(429);
  });
});
