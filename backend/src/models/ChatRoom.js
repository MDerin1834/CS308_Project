const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String, default: "" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    claimedBy: { type: String, default: null },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatRoomSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
