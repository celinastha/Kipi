import React from "react";
import './Btns.css'
import { useLocation } from "react-router-dom";

const AcceptRejectBtn = ({ currentUserId, token, requesterId, setPeopleList, variant }) => {
  const location = useLocation();
  
  const acceptRequest = async () => {
    try{
      await fetch("http://localhost:3000/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requesterId, receiverId: currentUserId }),
      });
      setPeopleList(prev =>
        prev.map(p =>
          p.id === requesterId ? { ...p, status: "accepted" } : p
        )
      );
    } catch(err){
      console.log('Accept request error', err);
    }
  };

  const rejectRequest = async (requesterId) => {
    try{
      await fetch("http://localhost:3000/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requesterId, receiverId: currentUserId }),
      });
      setPeopleList(prev =>
        prev.map(p =>
          p.id === requesterId ? { ...p, status: null } : p
        )
      );
    } catch(err){
      console.log('Accept request error', err);
    }
  };

  return (
    <div className="accept_reject_btns">
      <button className={`btn acceptBtn ${variant === "userDetail"? "userDetailBtn" : "searchAllSidebarBtn"}`} onClick={acceptRequest}>Accept</button>
      <button className="btn rejectBtn" onClick={rejectRequest}>Reject</button>
    </div>
  );

};

export default AcceptRejectBtn;