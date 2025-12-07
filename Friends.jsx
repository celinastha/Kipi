// src/pages/FriendsPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Friends.css";

const initialFriends = [
  { id: 1, name: "Linda", role: "Digital Marketing" },
  { id: 2, name: "Vic Steward", role: "Accounting" },
  { id: 3, name: "Alexandra", role: "CS Online" },
  { id: 4, name: "Lee", role: "Head of Finance" },
  { id: 5, name: "Steward", role: "HR Specialist" },
  { id: 6, name: "Ann Black", role: "Programmer" },
];

const initialMatches = [
  { id: 7, name: "Black Ming", role: "Digital Marketing" },
  { id: 8, name: "Sadou Mokaté", role: "Programmer" },
  { id: 9, name: "Jason", role: "Data Science" },
  { id: 10, name: "Arianna", role: "Product Design" },
  { id: 11, name: "Samir", role: "Backend Engineer" },
  { id: 12, name: "Lena", role: "UX Researcher" },
];

const FriendsPage = () => {
  const navigate = useNavigate();

  const [friends, setFriends] = useState(initialFriends);
  const [matches, setMatches] = useState(initialMatches);
  const [search, setSearch] = useState("");

  const handleAddFriend = (match) => {
    // Add to friends (avoid duplicates)
    setFriends((prev) => {
      if (prev.some((f) => f.id === match.id)) return prev;
      return [...prev, match];
    });

    // Remove from matches
    setMatches((prev) => prev.filter((m) => m.id !== match.id));
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="FriendsPage">
      {/* LEFT – CURRENT FRIENDS */}
      <div className="friends-sidebar">
        <div className="friends-sidebar-header">
          <h2 className="friends-title">Friends</h2>

          <div className="friends-search-wrapper">
            <input
              type="text"
              className="friends-search-input"
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="friends-list">
          {filteredFriends.map((friend) => (
            <div key={friend.id} className="friend-row">
              <div className="friend-avatar">
                {friend.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="friend-info">
                <div className="friend-name">{friend.name}</div>
                <div className="friend-role">{friend.role}</div>
              </div>
            </div>
          ))}

          {filteredFriends.length === 0 && (
            <div
              style={{
                fontSize: 12,
                color: "#9b96b6",
                marginTop: 8,
              }}
            >
              No friends found.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT – POSSIBLE MATCHES */}
      <div className="friends-main">
        <div className="friends-main-header">
          <h2 className="friends-main-title">Discover matches</h2>
          <p className="friends-main-subtitle">
            People you might know based on your interests.
          </p>
        </div>

        <div className="matches-list">
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-header">
                <div className="match-avatar">
                  {match.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="match-info">
                  <div className="match-name">{match.name}</div>
                  <div className="match-role">{match.role}</div>
                </div>
              </div>

              <div className="match-footer">
                <button
                  className="match-add-btn"
                  onClick={() => handleAddFriend(match)}
                >
                  Add friend
                </button>

                <button
                  className="match-message-btn"
                  onClick={() => navigate(`/messages/${match.id}`)}
                >
                  Message
                </button>
              </div>
            </div>
          ))}

          {matches.length === 0 && (
            <div
              style={{
                fontSize: 13,
                color: "#9b96b6",
                marginTop: 10,
              }}
            >
              You’re all caught up — no more suggested matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
