import { useChatStore } from "../Store/useChatStore.js";
import Sidebar from "../components/Sidebar.jsx";
import NoChatSelected from "../components/NoChatSelected.jsx";
import ChatContainer from "../components/ChatContainer.jsx";

const Home = () => {
  const { selectedUser } = useChatStore();
  return (
    
    <div className="h-full bg-base-200 ">
      <div className="">
        <div className="bg-base-100 rounded-lg shadow-cl w-full  h-[100vh] pt-16">
          <div className="flex h-[91.5vh] rounded-lg overflow-hidden pt-1">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
