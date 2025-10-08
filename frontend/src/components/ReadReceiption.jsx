import { Check, CheckCheck } from "lucide-react";

const ReadReceiptIcon = ({ message, authUserId, selectedGroup }) => {
  const senderId = message.senderId._id || message.senderId;
  const isOwnMessage = senderId === authUserId;

  // Don't show read receipts for messages you didn't send
  if (!isOwnMessage) return null;

  // No read status yet
  if (!message.readBy || message.readBy.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs opacity-50 mt-1">
        <Check size={14} />
        <span>Sent</span>
      </div>
    );
  }

  // Filter out own read receipt
  const readByOthers = message.readBy.filter((r) => r.user !== authUserId);

  if (readByOthers.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs opacity-50 mt-1">
        <CheckCheck size={14} />
        <span>Delivered</span>
      </div>
    );
  }

  // Message has been read
  return (
    <div className="flex items-center gap-1 text-xs mt-1">
      <CheckCheck size={14} className="text-neutral-400" />
      {selectedGroup ? (
        <span className="text-neutral-400">
          Read by {readByOthers.length}
        </span>
      ) : (
        <span className="text-neutral-400">Read</span>
      )}
    </div>
  );
};

export default ReadReceiptIcon;