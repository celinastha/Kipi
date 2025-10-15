import React, { useMemo, useState } from 'react';
import './Messages.css';
import { FaPlus } from 'react-icons/fa';


const people = [
 { id: 1, name: 'Person 1', avatar: 'https://cdn.jsdelivr.net/gh/alohe/memojis/png/vibrent_9.png' },
 { id: 2, name: 'Person 2', avatar: 'https://cdn.jsdelivr.net/gh/alohe/memojis/png/vibrent_2.png' },
 { id: 3, name: 'Person 3', avatar: 'https://cdn.jsdelivr.net/gh/alohe/memojis/png/vibrent_3.png' },
];


export default function Messages() {
 const [selectedId, setSelectedId] = useState(people[0].id);


 // Store conversations by person id: { [id]: Message[] }
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


 const selectedPerson = useMemo(
   () => people.find(p => p.id === selectedId),
   [selectedId]
 );


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
 };


 return (
   <div className="MessagesPage">
     {/* Left sidebar */}
     <div className="sidebar">
       <h2>Messages</h2>
       <ul className="person-list">
         {people.map((p) => (
           <li
             key={p.id}
             className={`person ${p.id === selectedId ? 'selected' : ''}`}
             onClick={() => handleSelect(p.id)}
           >
             <img src={p.avatar} alt={p.name} />
             <span>{p.name}</span>
           </li>
         ))}
       </ul>
     </div>


     {/* Chat section */}
     <div className="chat-area">
       <div className="chat-header">
         <div className="chat-person">
           <img src={selectedPerson.avatar} alt={selectedPerson.name} />
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
     </div>
   </div>
 );
}
