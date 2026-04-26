import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ElderlyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!stored || !token) {
            navigate('/'); // redirect to login if not authenticated
            return;
        }

        setUser(JSON.parse(stored));
        fetchSchedule(token);
    }, [navigate]);

    const fetchSchedule = async (token) => {
        try {
            const res = await fetch('http://localhost:5000/api/schedule/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSchedule(data);
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) return null;

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.welcome}>สวัสดี, {user.name} 👋</h1>
                    <p style={styles.subtext}>รหัสผู้สูงอายุ: {user.elderlyId}</p>
                </div>
                <button id="logout-btn" onClick={handleLogout} style={styles.logoutBtn}>ออกจากระบบ</button>
            </div>

            {/* Quick Actions */}
            <div style={styles.grid}>
                <div id="book-vehicle-card" style={styles.card} onClick={() => navigate('/booking')}>
                    <span style={styles.cardIcon}>🚐</span>
                    <p style={styles.cardLabel}>จองรถ</p>
                </div>
                <div id="activities-card" style={styles.card} onClick={() => navigate('/activities')}>
                    <span style={styles.cardIcon}>🧘‍♂️</span>
                    <p style={styles.cardLabel}>กิจกรรม</p>
                </div>
                <div id="schedule-card" style={styles.card} onClick={() => navigate('/schedule')}>
                    <span style={styles.cardIcon}>📅</span>
                    <p style={styles.cardLabel}>ตารางเวลา</p>
                </div>
                <div id="emergency-card" style={{ ...styles.card, ...styles.cardDanger }} onClick={() => alert('กำลังแจ้งเหตุฉุกเฉิน...')}>
                    <span style={styles.cardIcon}>🚨</span>
                    <p style={styles.cardLabel}>ฉุกเฉิน</p>
                </div>
            </div>

            {/* Upcoming Schedule */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>กำหนดการที่จะถึง</h2>
                {loading ? (
                    <p style={styles.placeholder}>กำลังโหลด...</p>
                ) : schedule.length === 0 ? (
                    <p style={styles.placeholder}>ไม่มีกำหนดการในขณะนี้</p>
                ) : (
                    schedule.slice(0, 5).map((item, i) => (
                        <div key={i} style={styles.scheduleItem}>
                            <span style={styles.scheduleIcon}>{item.type === 'vehicle' ? '🚐' : '🧘‍♂️'}</span>
                            <div>
                                <p style={styles.scheduleTitle}>{item.title}</p>
                                <p style={styles.scheduleDetail}>{item.detail}</p>
                            </div>
                            <span style={{
                                ...styles.badge,
                                background: item.status === 'pending' ? '#fef3c7' : '#d1fae5',
                                color: item.status === 'pending' ? '#92400e' : '#065f46'
                            }}>{item.status}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f7fafc', fontFamily: "'Sarabun', sans-serif", padding: '20px' },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', color: '#fff'
    },
    welcome: { margin: 0, fontSize: '22px', fontWeight: '700' },
    subtext: { margin: '4px 0 0', fontSize: '13px', opacity: 0.85 },
    logoutBtn: {
        background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
        color: '#fff', borderRadius: '8px', padding: '8px 16px',
        cursor: 'pointer', fontSize: '14px'
    },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
    card: {
        background: '#fff', borderRadius: '14px', padding: '24px 16px',
        textAlign: 'center', cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s ease'
    },
    cardDanger: { background: '#fff5f5' },
    cardIcon: { fontSize: '36px' },
    cardLabel: { margin: '8px 0 0', fontSize: '15px', fontWeight: '600', color: '#2d3748' },
    section: { background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#2d3748', marginTop: 0 },
    placeholder: { color: '#a0aec0', fontSize: '14px', textAlign: 'center', padding: '20px 0' },
    scheduleItem: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 0', borderBottom: '1px solid #f0f0f0'
    },
    scheduleIcon: { fontSize: '24px' },
    scheduleTitle: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#2d3748' },
    scheduleDetail: { margin: '2px 0 0', fontSize: '12px', color: '#718096' },
    badge: { marginLeft: 'auto', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }
};

export default ElderlyPage;
