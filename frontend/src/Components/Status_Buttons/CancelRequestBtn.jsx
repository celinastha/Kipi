import React from "react";
import './Btns.css'

const CancelRequestBtn = ({ currentUserId, token, receiverId, setPeopleList, variant }) => {
  const cancelRequest = async () => {
    try{
      await fetch("http://localhost:3000/friends/cancelReq", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requesterId : currentUserId, receiverId }),
      });
      setPeopleList(prev =>
        prev.map(p =>
          p.id === receiverId ? { ...p, status: null } : p
        )
      );

    } catch(err){
      console.log('Cancel request error', err);
    }
  };

  return <button className={`btn cancelRequestBtn ${variant === "userDetail"? "userDetailBtn" : "searchAllSidebarBtn"}`} onClick={cancelRequest}>Requesting</button>;
};

export default CancelRequestBtn;