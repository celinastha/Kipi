import React from "react";
import AddFriendBtn from "./AddFriendBtn";
import CancelRequestBtn from "./CancelRequestBtn";
import AcceptRejectBtn from "./AcceptRejectBtn";
import UnfriendBtn from "./UnfriendBtn";

//Buttons based on friend status
const FriendActions = ({ user, currentUserId, token, setPeopleList, variant }) => {
  if (!user.status) {
    return (
      <AddFriendBtn
        currentUserId={currentUserId}
        token={token}
        receiverId={user.id}
        setPeopleList={setPeopleList}
        variant={variant}
      />
    );
  }

  //cancel btn shown if requested
  if (user.status === "pending" && user.requester_id === currentUserId) {
    return (
      <CancelRequestBtn
        currentUserId={currentUserId}
        token={token}
        receiverId={user.id}
        setPeopleList={setPeopleList}
        variant={variant}
      />
    );
  }

   //accept reject btn shown if got request
  if (user.status === "pending" && user.receiver_id === currentUserId) {
    return (
      <AcceptRejectBtn
        currentUserId={currentUserId}
        token={token}
        requesterId={user.requester_id}
        setPeopleList={setPeopleList}
        variant={variant}
      />
    );
  }

   //unfriend btn shown if accepted
  if (user.status === "accepted") {
    return (
      <UnfriendBtn
        currentUserId={currentUserId}
        token={token}
        friendId={user.id}
        setPeopleList={setPeopleList}
        variant={variant}
      />
    );
  }

  return null;
};

export default FriendActions;