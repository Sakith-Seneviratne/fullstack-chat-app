import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return !this.groupId;
      },
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: function() {
        return !this.receiverId;
      },
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    file: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Ensure either receiverId or groupId is present, but not both
messageSchema.pre('save', function(next) {
  if ((this.receiverId && this.groupId) || (!this.receiverId && !this.groupId)) {
    next(new Error('Message must have either receiverId or groupId, but not both'));
  } else {
    next();
  }
});

const Message = mongoose.model("Message", messageSchema);

export default Message;