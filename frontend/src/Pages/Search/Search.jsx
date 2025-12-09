import React, { useState } from 'react'
import './Search.css'
import Search_All from '../../Components/Search_ALL/Search_All'
import UserDetail from '../../Components/User_Detail/UserDetail'
import { useAuth } from '../../Context/AuthContext'
import { useEffect } from 'react'

const Search = () => {
    const { token, currentUserId } = useAuth();
    const [peopleList, setPeopleList] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const selectedUser = peopleList.find(u => u.id === selectedUserId);

    useEffect(() => {
        const fetchUser = async () => {
        try {
            const res = await fetch(`http://localhost:3000/users/all/${currentUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPeopleList(data);
            console.log(data);
        } catch (err) {
            console.error("Failed to fetch user:", err);
        }
        };
        if (token) fetchUser();
    }, [token, currentUserId]);
    

    return (
        <div className='Search'>
            <div className='searchAllSidebar'>
                <Search_All 
                peopleList={peopleList}
                currentUserId={currentUserId}
                token={token}
                selectedUser={selectedUser}
                setSelectedUserId={setSelectedUserId}
                setPeopleList={setPeopleList}
                title="Search"
            />
            </div>
            
            {!selectedUserId? (
                <div className="UserDetail">Select a user!</div>
            ):(
                <div className='userDetails'>
                    {selectedUser && (
                    <UserDetail
                        user={selectedUser}
                        currentUserId={currentUserId}
                        token={token}
                        setPeopleList={setPeopleList}
                    />
                )}
                </div>
            )}
            
            
        </div>  
    )
} 
export default Search;    