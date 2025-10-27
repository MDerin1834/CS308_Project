const mongoose = require("mongoose");
const connectDB = require("../src/config/db");

describe("Database Connection", () => {
  it("should connect successfully with valid URI", async () => {
    const mockConnect = jest.spyOn(mongoose, "connect").mockResolvedValueOnce({});
    await connectDB("mongodb://mockuri");
    expect(mockConnect).toHaveBeenCalled();
    mockConnect.mockRestore();
  });

  it("should exit process on connection error", async () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    jest.spyOn(mongoose, "connect").mockRejectedValueOnce(new Error("fail"));
    await connectDB("invalid-uri");
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
