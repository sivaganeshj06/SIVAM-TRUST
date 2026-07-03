import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import { API } from '../utils/api';

function Admin() {
  const [donations, setDonations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('donations');
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', event_date: '', end_date: '', location: ''
  });
  const [selectedEventId, setSelectedEventId] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [eventPhotos, setEventPhotos] = useState([]);
  const navigate = useNavigate();

  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token || !trustUser) {
      navigate('/admin/login');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const role = trustUser?.role;
      const promises = [axios.get(`${API}/api/events`, { headers })]

      if (['founder', 'co-founder', 'accountant'].includes(role)) {
        promises.push(axios.get(`${API}/api/donations`, { headers }))
      }
      if (['founder'].includes(role)) {
        promises.push(axios.get(`${API}/api/contact`, { headers }))
        promises.push(axios.get(`${API}/api/members`, { headers }))
      }

      const results = await Promise.allSettled(promises)
      setEvents(results[0]?.value?.data || [])
      if (results[1]) setDonations(results[1]?.value?.data || [])
      if (results[2]) setContacts(results[2]?.value?.data || [])
      if (results[3]) setMembers(results[3]?.value?.data || [])
    } catch (err) {
      console.error('fetchAll error:', err);
      if (err.response?.status === 401) navigate('/admin/login');
    }
  };

  const fetchEventPhotos = async (eventId) => {
    try {
      const res = await axios.get(`${API}/api/photos/${eventId}`);
      setEventPhotos(res.data);
    } catch {
      setEventPhotos([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('trust_user');
    navigate('/admin/login');
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/events`, newEvent, { headers });
      setNewEvent({ title: '', description: '', event_date: '', end_date: '', location: '' });
      fetchAll();
      alert('Event added successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding event!');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API}/api/events/${id}`, { headers });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting event!');
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFiles.length || !selectedEventId) {
      alert('Please select an event and at least one photo!');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      photoFiles.forEach(f => formData.append('photos', f));
      formData.append('event_id', selectedEventId);
      formData.append('caption', photoCaption);
      formData.append('title', photoTitle);
      await axios.post(`${API}/api/photos/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setPhotoFiles([]);
      setPhotoCaption('');
      setPhotoTitle('');
      fetchEventPhotos(selectedEventId);
      alert('Photos uploaded successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Error uploading photos!');
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await axios.delete(`${API}/api/photos/${id}`, { headers });
      fetchEventPhotos(selectedEventId);
    } catch {
      alert('Error deleting photo!');
    }
  };

  const canSeeTab = (tab) => {
    const role = trustUser?.role;
    if (tab === 'donations') return ['founder', 'co-founder', 'accountant'].includes(role);
    if (tab === 'events') return ['founder', 'co-founder'].includes(role);
    if (tab === 'photos') return ['founder', 'co-founder', 'media'].includes(role);
    if (tab === 'contacts') return role === 'founder';
    if (tab === 'members') return role === 'founder';
    return false;
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          {trustUser && (
            <p style={{ fontSize: '13px', color: '#888', margin: '2px 0 0' }}>
              {trustUser.name} — {trustUser.role}
            </p>
          )}
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="admin-tabs">
        {canSeeTab('donations') && (
          <button className={activeTab === 'donations' ? 'tab active' : 'tab'} onClick={() => setActiveTab('donations')}>
            Donations ({donations.length})
          </button>
        )}
        {canSeeTab('events') && (
          <button className={activeTab === 'events' ? 'tab active' : 'tab'} onClick={() => setActiveTab('events')}>
            Events ({events.length})
          </button>
        )}
        {canSeeTab('photos') && (
          <button className={activeTab === 'photos' ? 'tab active' : 'tab'} onClick={() => setActiveTab('photos')}>
            Photos
          </button>
        )}
        {canSeeTab('contacts') && (
          <button className={activeTab === 'contacts' ? 'tab active' : 'tab'} onClick={() => setActiveTab('contacts')}>
            Messages ({contacts.length})
          </button>
        )}
        {canSeeTab('members') && (
          <button className={activeTab === 'members' ? 'tab active' : 'tab'} onClick={() => setActiveTab('members')}>
            Members ({members.length})
          </button>
        )}
      </div>

      <div className="admin-content">

        {/* DONATIONS TAB */}
        {activeTab === 'donations' && canSeeTab('donations') && (
          <div className="table-container">
            <h2>All Donations</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id}>
                    <td>{d.donor_name}</td>
                    <td>{d.email}</td>
                    <td>{d.phone || '-'}</td>
                    <td>₹{d.amount}</td>
                    <td>{d.transaction_id || '-'}</td>
                    <td><span className={`status ${d.payment_status}`}>{d.payment_status || 'pending'}</span></td>
                    <td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && canSeeTab('events') && (
          <div className="events-admin">
            <div className="add-event">
              <h2>Add New Event</h2>
              <form onSubmit={handleEventSubmit}>
                <input
                  type="text"
                  placeholder="Event Title *"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Description"
                  rows="3"
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                />
                <label style={{fontSize:'13px',color:'#555'}}>Event Start Date</label>
                <input
                  type="datetime-local"
                  value={newEvent.event_date}
                  onChange={e => setNewEvent({...newEvent, event_date: e.target.value})}
                />
                <label style={{fontSize:'13px',color:'#555'}}>Event End Date (for auto-completion)</label>
                <input
                  type="datetime-local"
                  value={newEvent.end_date}
                  onChange={e => setNewEvent({...newEvent, end_date: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                />
                <button type="submit" className="btn-primary">Add Event</button>
              </form>
            </div>
            <div className="events-list">
              <h2>All Events</h2>
              {events.map(evt => (
                <div className="event-item" key={evt.id}>
                  <div>
                    <h3>{evt.title}</h3>
                    <p>{evt.description}</p>
                    <p>📅 {evt.event_date} | 📍 {evt.location}</p>
                    <span className={`status ${evt.status}`}>{evt.status || 'upcoming'}</span>
                  </div>
                  {trustUser?.role === 'founder' && (
                    <button onClick={() => handleDeleteEvent(evt.id)} className="delete-btn">Delete</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'photos' && canSeeTab('photos') && (
          <div className="photos-admin">
            <div className="upload-section">
              <h2>Upload Event Photos</h2>
              <form onSubmit={handlePhotoUpload}>
                <select
                  value={selectedEventId}
                  onChange={e => {
                    setSelectedEventId(e.target.value);
                    if (e.target.value) fetchEventPhotos(e.target.value);
                  }}
                  required
                >
                  <option value="">-- Select Event --</option>
                  {events.map(evt => (
                    <option key={evt.id} value={evt.id}>{evt.title}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Photo Title (optional)"
                  value={photoTitle}
                  onChange={e => setPhotoTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={e => setPhotoFiles(Array.from(e.target.files))}
                  required
                />
                <p style={{fontSize:'12px',color:'#888'}}>You can select multiple photos at once</p>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </button>
              </form>
            </div>
            {selectedEventId && (
              <div className="photos-list">
                <h2>Event Photos ({eventPhotos.length})</h2>
                <div className="admin-photo-grid">
                  {eventPhotos.map(photo => (
                    <div className="admin-photo-item" key={photo.id}>
                      <img src={photo.photo_url} alt={photo.caption || 'Event'} />
                      {photo.title && <p><b>{photo.title}</b></p>}
                      {photo.caption && <p>{photo.caption}</p>}
                      <button onClick={() => handleDeletePhoto(photo.id)} className="delete-btn">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeTab === 'contacts' && canSeeTab('contacts') && (
          <div className="table-container">
            <h2>All Messages</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.message}</td>
                    <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && canSeeTab('members') && (
          <div className="table-container">
            <h2>Member Profiles</h2>
            <div className="members-grid">
              {members.map(m => (
                <div className="member-card" key={m.id}>
                  <div className="member-photo">
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} />
                      : <div className="member-avatar">{m.name.charAt(0)}</div>
                    }
                  </div>
                  <div className="member-info">
                    <h3>{m.name}</h3>
                    <p className="member-role">{m.role}</p>
                    <p>📧 {m.email || '-'}</p>
                    <p>📞 {m.phone || '-'}</p>
                    <p>🔖 {m.reference_number}</p>
                    <span className={`status ${m.status}`}>{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;