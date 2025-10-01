import { MessageSquare, Users, ArrowLeft } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-white dark:bg-neutral-900">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
              <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            {/* Decorative dots */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Welcome to Tez Chat!
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Select a conversation from the sidebar to start chatting with your contacts or groups
          </p>
        </div>

        {/* Hint Card */}
        <div className="mt-8 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-start gap-3 text-left">
            <div className="shrink-0 mt-0.5">
              <ArrowLeft className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Getting Started
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Choose a user or group from the sidebar to begin messaging
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;