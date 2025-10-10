import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedChat } = useChatStore();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="h-screen bg-neutral-950">
      <div className="flex items-center justify-center pt-16 md:pt-20 md:px-4">
        <div className="bg-neutral-900 md:rounded-lg md:shadow-2xl w-full max-w-7xl h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)]">
          <div className="flex h-full md:rounded-lg overflow-hidden relative">
            {/* Sidebar - hidden on mobile when chat is selected */}
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} md:relative absolute md:static inset-0 z-20 md:z-0`}>
              <Sidebar />
            </div>

            {/* Chat Container - takes full width on mobile when visible */}
            <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1`}>
              {!selectedChat ? <NoChatSelected /> : <ChatContainer setShowSidebar={setShowSidebar} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;