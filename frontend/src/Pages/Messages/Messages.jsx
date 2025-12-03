import React, { useMemo, useState, useEffect } from 'react';
import './Messages.css';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from '../../Context/AuthContext';
import Search_All from '../../Components/Search_ALL/Search_All';


const Messages = () => {
  const { token, currentUserId } = useAuth();
  const [acceptedFriendsList, setAcceptedFriendsList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
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


 /*// Store conversations by person id: { [id]: Message[] }
 const [conversations, setConversations] = useState(() => ({
   1: [
     { id: 1, text: 'Hello!', sender: 'them' },
     { id: 2, text: 'Hi! How are you?', sender: 'me' },
     { id: 3, text: 'Doing great, thanks!', sender: 'them' },
   ],
   // 2 and 3 start empty — “new conversation”
   2: [],
   3: [],
 }));


 const [inputValue, setInputValue] = useState('');


 


 const messages = conversations[selectedId] || [];


 const handleSelect = (id) => {
   setSelectedId(id);
   // Ensure a thread exists
   setConversations(prev => (prev[id] ? prev : { ...prev, [id]: [] }));
 };


 const handleSend = () => {
   const text = inputValue.trim();
   if (!text) return;
   const msg = { id: Date.now(), text, sender: 'me' };
   setConversations(prev => ({
     ...prev,
     [selectedId]: [...(prev[selectedId] || []), msg],
   }));
   setInputValue('');
 };*/


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
      />

    {/*
     Comment -- line Chat section 
     <div className="chat-area">
       <div className="chat-header">
         <div className="chat-person">
           <img src={selectedPerson.pfp} alt={selectedPerson.name} />
           <span>{selectedPerson.name}</span>
         </div>
       </div>


       <div className="chat-messages">
         {messages.length === 0 ? (
           <div className="empty-thread" style={{opacity:.8}}>
             <div style={{fontWeight:700, marginBottom:8}}>Start a conversation</div>
             <div>Say hi to {selectedPerson.name} 👋</div>
           </div>
         ) : (
           messages.map((msg) => (
             <div
               key={msg.id}
               className={`chat-bubble ${msg.sender === 'me' ? 'me' : 'them'}`}
             >
               {msg.text}
             </div>
           ))
         )}
       </div>


       <div className="chat-input">
         <input
           type="text"
           placeholder="Type Here!"
           value={inputValue}
           onChange={(e) => setInputValue(e.target.value)}
           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
         />
         <button onClick={handleSend} aria-label="Send">
           <FaPlus />
         </button>
       </div>
     </div> */}
   </div>
 );
}

export default Messages
