import React from "react";
import './Btns.css'

const AddFriendBtn = ({ currentUserId, token, receiverId, setPeopleList, variant }) => {
  const addFriend = async () => {
    try{
      await fetch("http://localhost:3000/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requesterId: currentUserId, receiverId }),
      });
      setPeopleList(prev =>
        prev.map(p =>
          p.id === receiverId ? { ...p, status: "pending", requester_id: currentUserId } : p
        )
      );
    } catch(err){
      console.log('Add friend error', err);
    }
  };

  return <button className={`btn addFriendsBtn ${variant === "userDetail"? "userDetailBtn" : "searchAllSidebarBtn"}`} onClick={addFriend}>Add Friend</button>;
};

export default AddFriendBtn;