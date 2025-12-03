import React from "react";
import FriendActions from "../Status_Buttons/FriendActions";
import './UserDetail.css'
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";

const UserDetail = ({ user, currentUserId, token, setPeopleList }) => {
  if (!user) return <div className="UserDetail">Select a user</div>;
  
  const location = useLocation();

  const [friendsList, setFriendsList] = useState([]);

  useEffect(() => {
          const fetchfriends = async () => {
          try {
              const res = await fetch(`http://localhost:3000/friends/accepted/10`, {
              headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              setFriendsList(data);
              console.log(friendsList);
          } catch (err) {
              console.error("Failed to fetch user:", err);
          }
          };
          if (token) fetchfriends();
      }, [token, currentUserId, friendsList]);

  return (
    <div className="UserDetail">

      <div className="detailTop">
        <div className="floating">
          <h2>{user.name}</h2>
          <img src={user.pfp} alt={user.name} width={100} height={100}/>
          <p>{user.bio}</p>
        </div>
      </div>
      
      <div className="detailBottom">

        <div className="detailButtons">
          <div className="friendActionBtn">
            <FriendActions
            user={user}
            currentUserId={currentUserId}
            token={token}
            setPeopleList={setPeopleList}
            variant="userDetail"
          />
          </div>

            {friendsList?.some(friend => friend.id === user.id) && (
                <div className="messageActionBtn">
                  <button className="userDetailBtn messageFriendBtn">Message</button>
                </div>
            )}
        </div>

        <div className="detailInfo">
          <h5>{user.name}'s Details</h5>
          <p className="userInfoDetails">No information yet!</p>
        </div>
        
      </div>
      
    </div>
   
  );
};

export default UserDetail;