import { X } from "lucide-react";
import { useAuthStore } from "../Store/userAuth.js";
import { useChatStore } from "../Store/useChatStore.js";
import {formateTime} from "../lib/formateTime.js"
const ChatHeader = () => {
  const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  return (
    <div className="p-2 border-b border-base-300 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/src/assets/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className={typingUsers && typingUsers[selectedUser._id]?"text-xs text-green-500":"text-xs text-gray-500"}>
              {typingUsers[selectedUser._id] ? (
                <div className="flex gap-1 items-baseline">
                  <span className="animate-typingpulse">Typing</span>
                  <div className="flex gap-1 ">
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-typingpulse  "></span>
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-typingpulse [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-typingpulse [animation-delay:0.4s]"></span>
                  </div>
                </div>
              ) : onlineUsers?.includes(selectedUser._id) ? (
                "Online"
              ) : (selectedUser.lastSeen?`Last Seen ${formateTime(selectedUser.lastSeen)}`
                :"Offline"
              )}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
