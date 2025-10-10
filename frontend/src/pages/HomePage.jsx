import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedChat } = useChatStore();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="h-screen pt-14 md:pt-16">
      <div className="h-full bg-neutral-900">
        <div className="flex h-full overflow-hidden relative">
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
  );
};
export default HomePage;