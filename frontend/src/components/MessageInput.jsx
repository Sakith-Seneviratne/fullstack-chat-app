import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Paperclip, File } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = ({ selectedChat }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null); // ADDED
  const imageInputRef = useRef(null); // RENAMED
  const fileInputRef = useRef(null); // ADDED
  
  const { sendChatMessage, replyingTo, clearReplyingTo } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File must be less than 100MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview({
        data: reader.result,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !filePreview) return;
    if (!selectedChat) return;

    try {
      const messageData = {
        text: text.trim(),
        ...(imagePreview && { image: imagePreview }),
        ...(filePreview && {
          file: filePreview.data,
          fileName: filePreview.name,
          fileType: filePreview.type,
        }),
      };

      await sendChatMessage(selectedChat._id, selectedChat.type === 'group', messageData);

      setText("");
      setImagePreview(null);
      setFilePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="border-t border-neutral-800 p-2 md:p-3">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 flex items-start gap-2 p-2 bg-neutral-800/50 rounded-lg border-l-4 border-blue-500">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-400">
                Replying to {replyingTo.senderId?.fullName || "Unknown"}
              </span>
            </div>
            
            {/* Show image thumbnail if replying to image */}
            {replyingTo.image && (
              <img
                src={replyingTo.image}
                alt="Reply preview"
                className="max-w-[100px] max-h-[60px] rounded mb-1 object-cover"
              />
            )}
            
            {/* Show file info if replying to file */}
            {replyingTo.file && (
              <div className="flex items-center gap-1 mb-1">
                <File size={14} className="text-neutral-400" />
                <span className="text-xs text-neutral-400 truncate">{replyingTo.file.name}</span>
              </div>
            )}
            
            {/* Show text with line clamp */}
            {replyingTo.text && (
              <p className="text-xs text-neutral-400 line-clamp-2">
                {replyingTo.text}
              </p>
            )}
          </div>
          <button
            onClick={clearReplyingTo}
            className="p-1 rounded-full hover:bg-neutral-700 transition-colors shrink-0"
            type="button"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-2 md:mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-neutral-600"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors shadow-md"
              type="button"
            >
              <X className="w-3.5 h-3.5 text-neutral-100" />
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="mb-2 md:mb-3 flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-neutral-800 rounded-lg border border-neutral-600">
          <div className="p-2 bg-neutral-700 rounded-lg">
            <File size={24} className="text-neutral-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-neutral-100">
              {filePreview.name}
            </p>
            <p className="text-xs text-neutral-400">
              {formatFileSize(filePreview.size)}
            </p>
          </div>
          <button
            onClick={removeFile}
            className="w-6 h-6 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
            type="button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-1 md:gap-2">
        <div className="flex-1 flex gap-1 md:gap-2">
          <input
            type="text"
            className="flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-neutral-600 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent text-sm transition-all"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {/* Hidden file inputs */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={imageInputRef}
            onChange={handleImageChange}
          />
          <input
            type="file"
            accept="*/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {/* Image Upload Button */}
          <button
            type="button"
            className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center transition-all ${
              imagePreview
                ? "bg-green-900/20 text-green-400 hover:bg-green-900/30"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
            onClick={() => imageInputRef.current?.click()}
          >
            <Image className="w-5 h-5" />
          </button>

          {/* File Upload Button */}
          <button
            type="button"
            className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center transition-all ${
              filePreview
                ? "bg-neutral-800/20 text-neutral-400 hover:bg-neutral-700/30"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            !text.trim() && !imagePreview && !filePreview
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-neutral-600 hover:bg-neutral-700 text-neutral-100 shadow-sm hover:shadow-md"
          }`}
          disabled={!text.trim() && !imagePreview && !filePreview}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;