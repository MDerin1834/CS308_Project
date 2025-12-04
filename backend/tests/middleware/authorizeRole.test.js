const authorizeRole = require("../../src/middleware/authorizeRole");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authorizeRole middleware", () => {
  test("returns 401 when user is missing", () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();

    authorizeRole("product_manager")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  test("passes through when no roles are specified and user exists", () => {
    const req = { user: { role: "customer" } };
    const res = createRes();
    const next = jest.fn();

    authorizeRole()(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 403 when user role is missing", () => {
    const req = { user: {} };
    const res = createRes();
    const next = jest.fn();

    authorizeRole("product_manager")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Insufficient permissions" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 when user role is not allowed", () => {
    const req = { user: { role: "customer" } };
    const res = createRes();
    const next = jest.fn();

    authorizeRole("product_manager")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Insufficient permissions" });
    expect(next).not.toHaveBeenCalled();
  });

  test("calls next when user role matches a single allowed role", () => {
    const req = { user: { role: "product_manager" } };
    const res = createRes();
    const next = jest.fn();

    authorizeRole("product_manager")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("calls next when user role is in a list of allowed roles", () => {
    const req = { user: { role: "sales_manager" } };
    const res = createRes();
    const next = jest.fn();

    authorizeRole("product_manager", "sales_manager")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});