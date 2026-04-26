import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
                return;
            }

            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            navigate('/elderly-dashboard');

        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>🏥</div>
                <h1 style={styles.title}>ระบบดูแลผู้สูงอายุ</h1>
                <p style={styles.subtitle}>กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>

                {error && <p style={styles.error}>{error}</p>}

                <form onSubmit={handleLogin} style={styles.form}>
                    <label style={styles.label}>ชื่อผู้ใช้</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={form.username}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="กรอกชื่อผู้ใช้"
                        required
                        autoComplete="username"
                    />

                    <label style={styles.label}>รหัสผ่าน</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="กรอกรหัสผ่าน"
                        required
                        autoComplete="current-password"
                    />

                    <button
                        id="login-btn"
                        type="submit"
                        style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
                        disabled={loading}
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Sarabun', sans-serif"
    },
    card: {
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        textAlign: 'center'
    },
    logo: { fontSize: '56px', marginBottom: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#2d3748', margin: '0 0 6px' },
    subtitle: { fontSize: '14px', color: '#718096', marginBottom: '28px' },
    error: {
        background: '#fff5f5', color: '#c53030',
        border: '1px solid #feb2b2', borderRadius: '8px',
        padding: '10px 14px', fontSize: '14px', marginBottom: '16px'
    },
    form: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
    label: { fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '6px', marginTop: '12px' },
    input: {
        padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
        fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box'
    },
    button: {
        marginTop: '24px', padding: '13px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontSize: '16px', fontWeight: '700', cursor: 'pointer'
    },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' }
};

export default LandingPage;
