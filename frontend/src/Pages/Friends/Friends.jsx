import React, { useEffect, useState } from 'react'
import './Friends.css'
import Search_All from '../../Components/Search_ALL/Search_All'
import UserDetail from '../../Components/User_Detail/UserDetail'
import { useAuth } from '../../Context/AuthContext'


const Friends = () => {
    const { token, currentUserId } = useAuth();
    const [friendsList, setFriendsList] = useState([]);
    const [selectedFriendId, setSelectedFriendId] = useState(null);

    const selectedFriend = friendsList.find(u => u.id === selectedFriendId);

    useEffect(() => {
        const fetchUser = async () => {
        try {
            const res = await fetch(`http://localhost:3000/friends/${currentUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                const pending = data.filter((u) => u.status === "pending");
                const accepted = data.filter((u) => u.status === "accepted");
                setFriendsList([...pending, ...accepted]);
            } else {
                console.error("Unexpected response:", data);
            }
            console.log(data);
        } catch (err) {
            console.error("Failed to fetch user:", err);
        }
        };
        if (token) fetchUser();
    }, [token, currentUserId]);

    
    return (
        <div className='Friends'>
            <div className='searchAllSidebar'>
                <Search_All 
                peopleList={friendsList}
                currentUserId={currentUserId}
                token={token}
                selectedUser={selectedFriend}
                setSelectedUserId={setSelectedFriendId}
                setPeopleList={setFriendsList}
                title="Friends"
            />
            </div>
            
            {!selectedFriendId? (
                <div className="UserDetail">Select a user!</div>
            ):(
                <div className='friendDetails'>
                    {selectedFriend && (
                        <UserDetail
                            user={selectedFriend}
                            currentUserId={currentUserId}
                            token={token}
                            setPeopleList={setFriendsList}
                        />
                    )}
                </div>
            )}
            
           
        </div>  
    )
}

export default Friends;