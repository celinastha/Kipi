import React from 'react'
import './Search_All.css'
import FriendActions from '../Status_Buttons/FriendActions';
import SearchBar from '../Search_Bar/Search_Bar';
import { useState } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MdGroupAdd } from "react-icons/md";
import groupPic from '../../assets/grouppf.jpg'

const Search_All = ({
  peopleList=[], 
  currentUserId,
  token,
  selectedUser,
  setSelectedUserId,
  setPeopleList,
  title,
  onStartDM,
  onOpenGroupModal,
  conversations=[],
  onOpenConversation,
  activeConversation
}) => {

  const [filtered, setFiltered] = useState(peopleList);
  const [queryActive, setQueryActive] = useState(false);
  const location = useLocation();

  //Filter and return users list with ranks (clost to query on top)
  const handleSearch = (query) => {
    const q = query.toLowerCase();

    if (!q) {
      setFiltered(peopleList);
      setQueryActive(false);
      return;
    }
    setQueryActive(true);

    const ranked = peopleList
      .map((p) => {
        const name = p?.name?.toLowerCase() || '';
        const email = p?.email?.toLowerCase() || '';
        let score = 0;
        if (name === q || email === q) score = 3;
        else if (name.startsWith(q) || email.startsWith(q)) score = 2;
        else if (name.includes(q) || email.includes(q)) score = 1;
        return { ...p, score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    setFiltered(ranked);
  };

  return (
    <div className='Search_All'>
      <h2>{title}</h2>

      {location.pathname === "/messages" && (
        <button className="group-btn" onClick={onOpenGroupModal}>
          <MdGroupAdd /> Add New Group
        </button>
      )}

      <SearchBar placeholder="Search" onSearch={handleSearch} />

      {/* Users list: all users in search, friends in friends and accepted friends in messages */}
      {location.pathname === "/messages" && (<h3>Friends</h3>)}
      <ul className="person-list">
        {queryActive && filtered.length === 0 ? (
          <p className="no-results">No person found</p>
        ) : (
          <ul className="person-list">
            {(queryActive ? filtered : peopleList).map((p) => (
              <li
                key={p.id}
                className={`person ${p.id === selectedUser?.id && !activeConversation?.isGroup? 'selected' : ''}`}
                onClick={() => {
                  setSelectedUserId(p.id);
                  onStartDM(p.id); 
                }}
              >
                <div className='person_name_pfp'>
                  <img className='person_pfp' src={p.pfp} alt={p.name} />
                  <span className='person_name'>{p.name}</span>
                </div>

                {(location.pathname === "/friends" || location.pathname === "/search") && (
                  <FriendActions
                    user={p}
                    currentUserId={currentUserId}
                    token={token}
                    setPeopleList={setPeopleList}
                    variant="searchAllSidebar"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </ul>

      {/* Groups list: separate section */}
      {location.pathname === "/messages" && (
        <div className="group-list">
          <h3>Groups</h3>

          
        
          <ul>
            {conversations
              .filter(c => c.isGroup) 
              .map((c) => (
                <li
                  key={c.id}
                  className={`group ${activeConversation?.id === c.id ? 'selected' : ''}`}
                  onClick={() => onOpenConversation(c)} // ✅ open group conversation
                >
                  <div className="group_pic_name">
                    <img className='group_pic' src={groupPic} alt="c.name" />
                    <span className='group_name'>{c.name}</span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>

  )
}

export default Search_All;