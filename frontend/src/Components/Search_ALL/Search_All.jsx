import React from 'react'
import './Search_All.css'
import FriendActions from '../Status_Buttons/FriendActions';
import SearchBar from '../Search_Bar/Search_Bar';
import { useState } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Search_All = ({peopleList=[], currentUserId, token, selectedUser, setSelectedUserId, setPeopleList, title}) => {

  const [filtered, setFiltered] = useState(peopleList);
  const [queryActive, setQueryActive] = useState(false);
  const location = useLocation();

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

      <SearchBar placeholder="Search" onSearch={handleSearch} />

      {queryActive && filtered.length === 0 ? (
        <p className="no-results">No person found</p>
      ) : (
        <ul className="person-list">
          {(queryActive ? filtered : peopleList).map((p) => (
            <li
              key={p.id}
              className={`person ${p.id === selectedUser?.id ? 'selected' : ''}`}
              onClick={() => setSelectedUserId(p.id)}
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


    </div>
  )
}

export default Search_All;