import { useState } from 'react';
import { useChatStore } from '../stores/chatStore';

function CreateGroupModal({ onClose }) {
    // Local state for the dynamic group name input
    const [groupChatName, setGroupChatName] = useState('');
    // Local state for the search query input
    const [searchQuery, setSearchQuery] = useState('');
    
    // Select state and actions from the Zustand store
    const { 
        selectedUsers, 
        searchResult, 
        loading, 
        addSelectedUser, 
        removeSelectedUser, 
        fetchUsersForGroup, 
        createGroupChat,
        resetGroupCreationState,
    } = useChatStore();

    // Debounced search for better performance (recommended, but simple version shown here)
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        fetchUsersForGroup(query); // Call the async thunk from the store
    };

    const handleCreateGroup = async () => {
        const newChat = await createGroupChat(groupChatName);

        if (newChat) {
            // Handle success (e.g., close modal, show success message)
            resetGroupCreationState(); // Clean up state after success
            onClose();
        } 
        // Error handling is managed inside the store and should be relayed to the user
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Create New Group Chat</h3>
                
                {/* 1. Group Name Input */}
                <input 
                    type="text" 
                    placeholder="Group Name" 
                    className="input input-bordered w-full my-2"
                    onChange={(e) => setGroupChatName(e.target.value)}
                />
                
                {/* 2. User Search Input */}
                <input 
                    type="text" 
                    placeholder="Search Users (min 2 required)" 
                    className="input input-bordered w-full my-2"
                    onChange={handleSearchChange}
                />

                {/* 3. Selected Members Display (DaisyUI Badge) */}
                <div className="flex flex-wrap gap-2 py-2">
                    {selectedUsers.map((u) => (
                        <div 
                            key={u._id} 
                            className="badge badge-lg badge-primary cursor-pointer"
                            onClick={() => removeSelectedUser(u._id)} 
                        >
                            {u.name} <span className='ml-1 font-bold'>x</span>
                        </div>
                    ))}
                </div>

                {/* 4. Search Results */}
                {loading && searchQuery ? (
                    <span className="loading loading-spinner loading-md"></span>
                ) : (
                    searchResult?.slice(0, 4).map((user) => (
                        <div 
                            key={user._id} 
                            className="p-3 card bg-base-200 cursor-pointer hover:bg-base-300 transition my-1"
                            onClick={() => addSelectedUser(user)} // Use the store action
                        >
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-base-content/80">{user.email}</p>
                        </div>
                    ))
                )}

                <div className="modal-action">
                    <button 
                        className="btn" 
                        onClick={() => { resetGroupCreationState(); onClose(); }} // Cleanup on close
                    >
                        Cancel
                    </button>
                    <button 
                        className={`btn btn-primary ${loading ? 'loading' : ''}`} 
                        onClick={handleCreateGroup}
                        disabled={loading || selectedUsers.length < 2 || !groupChatName}
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateGroupModal;