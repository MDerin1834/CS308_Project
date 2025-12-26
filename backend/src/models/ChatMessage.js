const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderRole: { type: String, required: true },
    text: { type: String, default: "" },
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          name: { type: String, default: "" },
          type: { type: String, default: "" },
          size: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

chatMessageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
