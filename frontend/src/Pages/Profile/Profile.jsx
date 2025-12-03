import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../Context/AuthContext';
import { toast } from 'react-toastify';
import './Profile.css';
import { MdEdit, MdSave, MdCancel } from "react-icons/md";

const Profile = () => {
  const { token, name, authService } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: name || '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (token === null) return;
    if (!token) navigate("/auth");
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords match if changing password
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        toast.error("New passwords don't match!", { autoClose: 1800, closeButton: false });
        setLoading(false);
        return;
      }

      const updateData = {
        displayName: formData.displayName,
        email: formData.email || undefined,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined
      };

      const response = await fetch('http://localhost:3000/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update local auth context with new name if changed
      if (formData.displayName !== name) {
        authService(token, formData.displayName);
      }

      toast.success('Profile updated successfully!',{ autoClose: 1800, closeButton: false });
      setIsEditing(false);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      toast.error(error.message || 'Failed to update profile',{ autoClose: 1800, closeButton: false });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      displayName: name || '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (!token) return null;

  return (
    <div className='Profile'>
      {!isEditing ? (
        <div className="profile-display">
          <h2 className='logo'>Welcome, {name}!</h2>
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            <MdEdit /> Edit Profile
          </button>
        </div>
      ) : (
        <div className="profile-edit-container">
          <h2 className="edit-title">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="profile-form">
            
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Enter new display name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter new email"
              />
              <small>Leave blank to keep current email</small>
            </div>

            <div className="form-divider">
              <span>Change Password</span>
            </div>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                placeholder="Required to change password or email"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm new password"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                <MdSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancel}
                disabled={loading}
              >
                <MdCancel /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Profile;
