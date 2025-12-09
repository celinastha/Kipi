import React from 'react'
import { useMemo, useState, useEffect } from 'react'
import './Messages.css';
import { IoMdSend } from "react-icons/io";
import { useAuth } from '../../Context/AuthContext';
import Search_All from '../../Components/Search_ALL/Search_All';
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

const Messages = () => {
    const { token, currentUserId, logout } = useAuth();
  const [socket, setSocket] = useState(null);

  const [acceptedFriendsList, setAcceptedFriendsList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [conversations, setConversations] = useState([]); 
  const [activeConversation, setActiveConversation] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(new Set());

  console.log("Selected ID: ", selectedId);

  const selectedPerson = acceptedFriendsList.find(u => u.id === selectedId);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:3000/friends/accepted/${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAcceptedFriendsList(data);
        console.log(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    if (token) fetchUser();
  }, [token, currentUserId]);


  // Load conversations (groups + DMs)
  const loadConversations = async () => {
    try {
      const res = await fetch(`http://localhost:3000/conversations/list/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  useEffect(() => {
    if (token) loadConversations();
  }, [token, currentUserId]);

  // Socket connection
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    setSocket(s);

   
    s.on("message", (msg) => {
      if (activeConversation && msg.conversationId === activeConversation.id) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // update sidebar preview
      setConversations((prev) =>
        prev.map(c =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: msg.text, lastUpdatedAt: new Date().toISOString() }
            : c
        )
      );
    });

    s.on("dmReady", ({ conversationId }) => {
      setActiveConversation({ id: conversationId, isGroup: false });
      s.emit("joinRoom", { conversationId });
      loadHistory(conversationId);
      loadConversations();
    });

    s.on("groupReady", ({ conversationId }) => {
      setActiveConversation({ id: conversationId, isGroup: true });
      s.emit("joinRoom", { conversationId });
      loadHistory(conversationId);
      setShowGroupModal(false);
      loadConversations();
    });

    s.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      if (err.message.includes("Unauthorized") || err.message.includes("expired")) {
        alert("Session expired. Please log in again.");
        logout();
      }
    });

    return () => s.disconnect();
  }, [token, logout, activeConversation]);


  useEffect(() => {
    const chatBox = document.querySelector(".chat-messages");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [messages]);

  // Load chat history
  const loadHistory = async (conversationId) => {
    try {
      const res = await fetch(`http://localhost:3000/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  // Start DM
  const startDM = (otherId) => {
    socket?.emit("startDM", { otherId });
  };

  // Send message with optimistic append
  const sendMessage = () => {
    if (!activeConversation?.id || !inputValue.trim()) return;

    const newMsg = {
      text: inputValue,
      senderId: currentUserId,
      conversationId: activeConversation.id,
      id: `temp-${Date.now()}`, // temporary id
    };

    setMessages((prev) => [...prev, newMsg]);

    socket.emit("sendMessage", {
      conversationId: activeConversation.id,
      text: inputValue,
    });

    setInputValue("");
  };

  const toggleMember = (id) => {
    const next = new Set(selectedMembers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedMembers(next);
  };

  const createGroup = () =>
    socket.emit("createGroup", {
      name: groupName,
      memberIds: [...selectedMembers],
    });

  const openConversation = (conv) => {
    setActiveConversation(conv);
    socket?.emit("joinRoom", { conversationId: conv.id });
    loadHistory(conv.id);
  };

  return (
    <div className="MessagesPage">
     {/* Left sidebar */}
     <Search_All 
        peopleList={acceptedFriendsList}
        currentUserId={currentUserId}
        token={token}
        selectedUser={selectedPerson}
        setSelectedUserId={setSelectedId}
        setPeopleList={setAcceptedFriendsList}
        title="Messages"
        onStartDM={startDM}
        onOpenGroupModal={() => setShowGroupModal(true)}
        conversations={conversations} // ✅ pass groups + DMs
        onOpenConversation={openConversation}
        activeConversation={activeConversation}
      />

    {/* Group modal */}
      {showGroupModal && (
        <div className="group-modal">
          <div className="modal-content">
            <h3>Create Group</h3>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
            />
            {acceptedFriendsList.map((f) => (
              <label key={f.id}>
                <input
                  type="checkbox"
                  checked={selectedMembers.has(f.id)}
                  onChange={() => toggleMember(f.id)}
                />
                {f.name}
              </label>
            ))}
            <div className='modal-btns'>
                <button onClick={createGroup}>Create</button>
                <button onClick={() => setShowGroupModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

     {/* Chat area */}
      <div className="chat-area">
        <div className="chat-header">
          {activeConversation ? (
            <div className="chat-person">
              <span>
                {activeConversation.isGroup
                  ? (conversations.find(c => c.id === activeConversation.id)?.name || "Group")
                  : (conversations.find(c => c.id === activeConversation.id)?.dmWith?.name || "Direct Message")}
              </span>
            </div>
          ) : (
            <span>Select a friend or group</span>
          )}
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => {
            const sender = m.senderId ?? m.senderUid;
            const mine = String(sender) === String(currentUserId);
            return (
              <div
                key={m.id || i}
                className={`chat-bubble ${mine ? "me" : ""}`}
              >
                {m.text}
              </div>
            );
          })}
        </div>

        <div className="chat-input">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!activeConversation?.id}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} disabled={!activeConversation?.id}>
            <IoMdSend />
          </button>
        </div>
      </div>

    </div>
  )
}

export default Messages;
