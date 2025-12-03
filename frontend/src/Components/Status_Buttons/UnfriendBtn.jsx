import React from "react";
import './Btns.css'

const UnfriendBtn = ({ currentUserId, token, friendId, setPeopleList, variant }) => {
    const unfriend = async () => {
        try{
        await fetch("http://localhost:3000/friends/unfriend", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ userId: currentUserId, friendId }),
        });
        setPeopleList(prev =>
            prev.map(p =>
            p.id === friendId ? { ...p, status: null } : p
            )
        );
        } catch(err) {
        console.log('Unfriend error', err);
        }
    };

  return <button className={`btn unfriendBtn ${variant === "userDetail"? "userDetailBtn" : "searchAllSidebarBtn"}`} onClick={unfriend}>Unfriend</button>;
};

export default UnfriendBtn;