import React from 'react';
import { motion } from 'framer-motion';
import './Team.css';

const teamData = [
  { category: 'Founder', color: '#2563eb', bg: '#eff6ff', members: [
    { name: 'Sivaganesh J', designation: 'Founder', phone: '9342845863', email: 'sivaganesh73acm@gmail.com', description: 'Visionary leader and founder of Sivam Trust Foundation. Responsible for overall operations, strategy, and community outreach.' }
  ]},
  { category: 'Co-Founders', color: '#10b981', bg: '#f0fdf4', members: [
    { name: 'Santhosh S', designation: 'Co-Founder', phone: '79045 71160', email: 'santhoshsuresh513@gmail.com', description: 'Co-leads the foundation with a focus on volunteer coordination and field operations.' },
    { name: 'Hariprasath R', designation: 'Co-Founder', phone: '9600505873', email: 'prasathhari5490@gmail.com', description: 'Co-leads the foundation with expertise in community relations and donor management.' }
  ]},
  { category: 'Media & Editing', color: '#8b5cf6', bg: '#faf5ff', members: [
    { name: 'Elavarasan E', designation: 'Media Support & Editing', phone: '9994858238', email: null, description: 'Handles all media content, social media management, photo/video editing and digital presence.' }
  ]},
  { category: 'Accounts Team', color: '#f59e0b', bg: '#fffbeb', members: [
    { name: 'Agathiyan R', designation: 'Accounts Manager', phone: '8778292631', email: 'agathiyan8778@gmail.com', description: 'Manages all financial records, donation tracking, and ensures complete transparency in fund utilization.' }
  ]},
];

function getInitials(name) { return name.split(' ').map(n => n[0]).join('').toUpperCase(); }

export default function Team() {
  return (
    <div className="tm">
      <section className="tm-hero">
        <div className="tm-hero-bg"><div className="tm-orb-1" /><div className="tm-orb-2" /></div>
        <motion.div className="tm-hero-inner" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="tm-label">Our People</span>
          <h1 className="tm-hero-h1">Meet the <span className="tm-grad">Dedicated Team</span></h1>
          <p className="tm-hero-sub">The passionate people behind Sivam Trust Foundation</p>
        </motion.div>
      </section>

      <section className="tm-main">
        <div className="tm-container">
          {teamData.map((section, idx) => (
            <motion.div key={idx} className="tm-section" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1, duration: 0.6 }}>
              <div className="tm-section-header">
                <div className="tm-section-line" style={{ background: section.color }} />
                <h2 className="tm-section-title" style={{ color: section.color }}>{section.category}</h2>
              </div>
              <div className={`tm-cards-grid ${section.members.length === 1 ? 'single' : ''}`}>
                {section.members.map((member, midx) => (
                  <motion.div key={midx} className="tm-card"
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: midx * 0.1 }}
                    whileHover={{ y: -6, boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
                    <div className="tm-card-top" style={{ background: section.bg }}>
                      <div className="tm-avatar" style={{ background: section.color }}>
                        {getInitials(member.name)}
                      </div>
                      <div className="tm-member-info">
                        <h3>{member.name}</h3>
                        <span className="tm-designation" style={{ color: section.color }}>{member.designation}</span>
                      </div>
                    </div>
                    <div className="tm-card-body">
                      <p className="tm-desc">{member.description}</p>
                      <div className="tm-contacts">
                        <a href={`tel:${member.phone}`} className="tm-contact-btn">
                          📞 {member.phone}
                        </a>
                        {member.email && (
                          <a href={`mailto:${member.email}`} className="tm-contact-btn">
                            ✉️ {member.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}