const User = require("../../src/models/User");

describe("User Model", () => {
  it("should require username, email, and password", async () => {
    const user = new User({});
    try {
      await user.validate();
    } catch (err) {
      expect(err.errors.username).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    }
  });

  it("should assign default role as customer", async () => {
    const user = new User({
      username: "ali",
      email: "ali@example.com",
      password: "1234",
    });
    expect(user.role).toBe("customer");
  });
});
