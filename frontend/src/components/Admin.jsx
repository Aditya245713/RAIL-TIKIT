import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Admin.css'

function Admin() {
  // Mock data for pending verification accounts
  const [pendingAccounts, setPendingAccounts] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      dob: '1990-05-15',
      nidNo: '1234567890123',
      phoneNo: '+1234567890',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      dob: '1985-08-22',
      nidNo: '9876543210987',
      phoneNo: '+0987654321',
      status: 'pending'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      dob: '1992-12-10',
      nidNo: '5555666677778',
      phoneNo: '+1122334455',
      status: 'pending'
    }
  ])

  const handleVerify = (id) => {
    setPendingAccounts(accounts =>
      accounts.map(account =>
        account.id === id ? { ...account, status: 'verified' } : account
      )
    )
    alert('Account verified successfully!')
  }

  const handleReject = (id) => {
    setPendingAccounts(accounts =>
      accounts.map(account =>
        account.id === id ? { ...account, status: 'rejected' } : account
      )
    )
    alert('Account rejected!')
  }

  const pendingList = pendingAccounts.filter(account => account.status === 'pending')

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1>Admin Panel - Account Verification</h1>
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </header>

        <div className="accounts-section">
          <h2>Accounts Pending Verification ({pendingList.length})</h2>
          
          {pendingList.length === 0 ? (
            <div className="no-accounts">
              <p>No accounts pending verification at the moment.</p>
            </div>
          ) : (
            <div className="accounts-grid">
              {pendingList.map(account => (
                <div key={account.id} className="account-card">
                  <div className="account-info">
                    <h3>{account.name}</h3>
                    <div className="account-details">
                      <p><strong>Email:</strong> {account.email}</p>
                      <p><strong>Date of Birth:</strong> {account.dob}</p>
                      <p><strong>NID No.:</strong> {account.nidNo}</p>
                      <p><strong>Phone:</strong> {account.phoneNo}</p>
                      <p><strong>Status:</strong> 
                        <span className={`status ${account.status}`}>
                          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="account-actions">
                    <button 
                      onClick={() => handleVerify(account.id)}
                      className="btn btn-success"
                    >
                      Verify Account
                    </button>
                    <button 
                      onClick={() => handleReject(account.id)}
                      className="btn btn-danger"
                    >
                      Reject Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin
