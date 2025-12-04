const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../../src/models/User");

describe("User password hashing", () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.BCRYPT_SALT_ROUNDS = "4"; // faster hashing for tests
    await mongoose.connect(mongo.getUri(), { dbName: "test-users" });
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("hashes password on save", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "plain-123",
    });

    expect(user.password).not.toBe("plain-123");
    expect(user.password.startsWith("$2")).toBe(true);
  });

  it("hashes password on insertMany", async () => {
    const [user] = await User.insertMany([
      {
        username: "bob",
        email: "bob@example.com",
        password: "plain-456",
      },
    ]);

    expect(user.password).not.toBe("plain-456");
    expect(user.password.startsWith("$2")).toBe(true);
  });

  it("hashes password on findOneAndUpdate", async () => {
    const created = await User.create({
      username: "carol",
      email: "carol@example.com",
      password: "first-pass",
    });

    const updated = await User.findOneAndUpdate(
      { _id: created._id },
      { password: "new-pass" },
      { new: true }
    );

    expect(updated.password).not.toBe("new-pass");
    expect(updated.password.startsWith("$2")).toBe(true);
  });

  it("does not double-hash when a hashed password is provided", async () => {
    const hashed =
      "$2b$10$123456789012345678901uYf7nR0p3yC59vV5Px14t30TbRUDkxW";

    const user = await User.create({
      username: "dave",
      email: "dave@example.com",
      password: hashed,
    });

    expect(user.password).toBe(hashed);
  });
});
