import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AboutUs.css'

function AboutUs() {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: '',
      email: '',
      photo: null
    },
    {
      id: 2,
      name: '',
      email: '',
      photo: null
    }
  ])

  const handleInputChange = (id, field, value) => {
    setTeamMembers(members =>
      members.map(member =>
        member.id === id ? { ...member, [field]: value } : member
      )
    )
  }

  const handlePhotoUpload = (id, event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setTeamMembers(members =>
          members.map(member =>
            member.id === id ? { ...member, photo: e.target.result } : member
          )
        )
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="about-us-page">
      <div className="about-us-container">
        <header className="about-header">
          <h1>About Rail Tikit</h1>
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </header>

        <section className="company-info">
          <div className="info-content">
            <h2>Our Mission</h2>
            <p>
              At Rail Tikit, we're dedicated to revolutionizing the railway ticket booking experience. 
              Our platform combines cutting-edge technology with user-friendly design to make train 
              travel booking simple, secure, and accessible to everyone.
            </p>
            
            <h2>Our Vision</h2>
            <p>
              To become the leading railway ticket booking platform that connects millions of 
              travelers to their destinations with ease, reliability, and exceptional service.
            </p>
          </div>
        </section>

        <section className="team-section">
          <h2>Our Team</h2>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="team-member-box">
                <h3>Team Member {index + 1}</h3>
                
                <div className="member-form">
                  <div className="form-group">
                    <label>Name:</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleInputChange(member.id, 'name', e.target.value)}
                      placeholder="Enter team member name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => handleInputChange(member.id, 'email', e.target.value)}
                      placeholder="Enter team member email"
                    />
                  </div>

                  <div className="form-group">
                    <label>Photo:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(member.id, e)}
                    />
                  </div>

                  {member.photo && (
                    <div className="photo-preview">
                      <img src={member.photo} alt={member.name} />
                    </div>
                  )}
                </div>

                {member.name && (
                  <div className="member-display">
                    <h4>{member.name}</h4>
                    <p>{member.email}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="company-values">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3>Reliability</h3>
              <p>Ensuring consistent and dependable service for all our users</p>
            </div>
            <div className="value-item">
              <h3>Innovation</h3>
              <p>Continuously improving our platform with the latest technology</p>
            </div>
            <div className="value-item">
              <h3>Customer Focus</h3>
              <p>Putting our customers' needs at the center of everything we do</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutUs
