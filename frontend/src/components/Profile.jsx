import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateMessage, setUpdateMessage] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user info from backend
    fetch('http://localhost:8000/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        return response.json();
      })
      .then(data => {
        setUser(data);
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setUpdateMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
        setUpdateMessage('Profile updated successfully! ✅');

        setTimeout(() => {
          setUpdateMessage('');
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateMessage(`Error: ${error.message} ❌`);

      setTimeout(() => {
        setUpdateMessage('');
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
    setEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setUpdateMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Account deleted successfully
        localStorage.removeItem('token');
        setUpdateMessage('Account deleted successfully! Redirecting...');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setUpdateMessage(`Error: ${error.message} ❌`);
      setShowDeleteConfirmation(false);

      setTimeout(() => {
        setUpdateMessage('');
      }, 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-left-section">
          {/* Background image will be applied via CSS */}
        </div>
        <div className="profile-right-section">
          <div className="profile-form-wrapper">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-left-section">
        {/* Background image will be applied via CSS */}
      </div>
      
      <div className="profile-right-section">
        <div className="profile-form-wrapper">
          <header className="profile-header">
            <h1>👤 My Profile</h1>
            <p>Manage your account information and preferences</p>
          </header>

          <div className="profile-content">
            <div className="profile-card">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="profile-info">
                <h2>{user?.name}</h2>
                <p className="user-role">{user?.role || 'Customer'}</p>
              </div>
            </div>

            <div className="account-details">
              <div className="section-header">
                <h3>Account Information</h3>
                {editing && (
                  <div className="edit-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? '⏳ Saving...' : '💾 Save'}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>

              {updateMessage && (
                <div
                  className={`update-message ${
                    updateMessage.includes('❌') ? 'error' : 'success'
                  }`}
                >
                  {updateMessage}
                </div>
              )}

              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <p>{user?.name}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Email Address</label>
                  {editing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <p>{user?.email}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Phone Number</label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <p>{user?.phone}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Account Type</label>
                  <p className="account-type">{user?.role || 'Customer'}</p>
                </div>

                <div className="info-item">
                  <label>Member Since</label>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="account-actions">
              <h3>Account Actions</h3>
              <div className="actions-grid">
                <button 
                  className="action-btn back-home"
                  onClick={() => navigate('/home')}
                >
                  ← Back to Home
                </button>
                <button 
                  className="action-btn edit-profile"
                  onClick={() => setEditing(true)}
                  disabled={editing}
                >
                  ✏️ Edit Profile
                </button>
                <button className="action-btn logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
                <button 
                  className="action-btn danger" 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="delete-modal-backdrop" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h2>⚠️ Delete Account</h2>
            </div>
            
            <div className="delete-modal-content">
              <p>Are you sure you want to delete your account?</p>
              <p className="delete-warning">
                This action cannot be undone. All your data, including bookings and tickets, will be permanently removed.
              </p>
              
              <div className="delete-modal-actions">
                <button 
                  className="btn-delete-confirm"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
                <button 
                  className="btn-delete-cancel"
                  onClick={handleCancelDelete}
                  disabled={deleting}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
