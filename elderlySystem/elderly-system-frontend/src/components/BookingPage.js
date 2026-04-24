import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        destination: '',
        scheduledTime: '',
        passengers: 1,
        options: { wheelchair: false, helper: false },
    });
    const [loading, setLoading] = useState(false);

    const nextStep = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
    const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    const handleSubmit = async () => {
        if (!bookingData.destination || !bookingData.scheduledTime) {
            alert("กรุณาเลือกปลายทางและเวลา");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert("กรุณาเข้าสู่ระบบก่อน");
            navigate('/');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/booking/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`   // elderlyId comes from token
                },
                body: JSON.stringify({
                    destination: bookingData.destination,
                    scheduledTime: bookingData.scheduledTime,
                    passengers: bookingData.passengers,
                    wheelchair: bookingData.options.wheelchair,
                    helper: bookingData.options.helper
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Server error');
            }

            alert("จองรถสำเร็จแล้ว! ✅");

            setCurrentStep(1);
            setBookingData({
                destination: '',
                scheduledTime: '',
                passengers: 1,
                options: { wheelchair: false, helper: false },
            });

        } catch (error) {
            console.error("Booking error:", error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const destinations = ['สโมสร', 'โรงพยาบาล', 'ตลาด', 'วัด', 'ศูนย์การค้า'];
    const times = ['ตอนนี้', '09:00', '10:00', '13:00', '15:00', '17:00'];

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <button id="back-btn" onClick={() => navigate('/elderly-dashboard')} style={styles.backBtn}>← กลับ</button>
                    <h2 style={styles.title}>จองรถรับส่ง</h2>
                </div>

                {/* Progress bar */}
                <div style={styles.progressBar}>
                    {[1, 2, 3].map(step => (
                        <div key={step} style={{ ...styles.step, background: currentStep >= step ? '#667eea' : '#e2e8f0' }}>
                            {step}
                        </div>
                    ))}
                </div>

                {/* Step 1 – Destination */}
                {currentStep === 1 && (
                    <div id="step-1">
                        <h3 style={styles.stepTitle}>เลือกสถานที่ปลายทาง</h3>
                        <div style={styles.optionGrid}>
                            {destinations.map(d => (
                                <button
                                    key={d}
                                    id={`dest-${d}`}
                                    onClick={() => setBookingData({ ...bookingData, destination: d })}
                                    style={{
                                        ...styles.optionBtn,
                                        ...(bookingData.destination === d ? styles.optionBtnActive : {})
                                    }}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2 – Time & Options */}
                {currentStep === 2 && (
                    <div id="step-2">
                        <h3 style={styles.stepTitle}>เลือกเวลา</h3>
                        <div style={styles.optionGrid}>
                            {times.map(t => (
                                <button
                                    key={t}
                                    id={`time-${t}`}
                                    onClick={() => setBookingData({ ...bookingData, scheduledTime: t })}
                                    style={{
                                        ...styles.optionBtn,
                                        ...(bookingData.scheduledTime === t ? styles.optionBtnActive : {})
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <h3 style={styles.stepTitle}>จำนวนผู้โดยสาร</h3>
                        <div style={styles.counter}>
                            <button id="dec-passengers" onClick={() => setBookingData({ ...bookingData, passengers: Math.max(1, bookingData.passengers - 1) })} style={styles.counterBtn}>−</button>
                            <span style={styles.counterVal}>{bookingData.passengers}</span>
                            <button id="inc-passengers" onClick={() => setBookingData({ ...bookingData, passengers: Math.min(8, bookingData.passengers + 1) })} style={styles.counterBtn}>+</button>
                        </div>

                        <div style={styles.checkboxGroup}>
                            <label style={styles.checkboxLabel}>
                                <input type="checkbox" checked={bookingData.options.wheelchair}
                                    onChange={e => setBookingData({ ...bookingData, options: { ...bookingData.options, wheelchair: e.target.checked } })} />
                                &nbsp;♿ ต้องการรถเข็น
                            </label>
                            <label style={styles.checkboxLabel}>
                                <input type="checkbox" checked={bookingData.options.helper}
                                    onChange={e => setBookingData({ ...bookingData, options: { ...bookingData.options, helper: e.target.checked } })} />
                                &nbsp;👤 ต้องการผู้ช่วย
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 3 – Summary */}
                {currentStep === 3 && (
                    <div id="step-3">
                        <h3 style={styles.stepTitle}>ตรวจสอบข้อมูล</h3>
                        <div style={styles.summary}>
                            <div style={styles.summaryRow}><span>🏁 ปลายทาง</span><strong>{bookingData.destination}</strong></div>
                            <div style={styles.summaryRow}><span>🕐 เวลา</span><strong>{bookingData.scheduledTime}</strong></div>
                            <div style={styles.summaryRow}><span>👥 ผู้โดยสาร</span><strong>{bookingData.passengers} คน</strong></div>
                            <div style={styles.summaryRow}><span>♿ รถเข็น</span><strong>{bookingData.options.wheelchair ? 'ต้องการ' : 'ไม่ต้องการ'}</strong></div>
                            <div style={styles.summaryRow}><span>👤 ผู้ช่วย</span><strong>{bookingData.options.helper ? 'ต้องการ' : 'ไม่ต้องการ'}</strong></div>
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <div style={styles.footer}>
                    {currentStep > 1 && (
                        <button id="prev-btn" onClick={prevStep} style={styles.prevBtn}>ย้อนกลับ</button>
                    )}
                    {currentStep < 3 ? (
                        <button id="next-btn" onClick={nextStep} style={styles.nextBtn}>ต่อไป →</button>
                    ) : (
                        <button
                            id="confirm-btn"
                            onClick={handleSubmit}
                            disabled={loading}
                            style={loading ? { ...styles.confirmBtn, opacity: 0.6 } : styles.confirmBtn}
                        >
                            {loading ? 'กำลังจอง...' : '✅ ยืนยันการจอง'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sarabun', sans-serif", padding: '20px' },
    card: { background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
    header: { display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' },
    backBtn: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    title: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#2d3748' },
    progressBar: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' },
    step: { width: '32px', height: '32px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', transition: 'background 0.3s' },
    stepTitle: { fontSize: '16px', fontWeight: '700', color: '#2d3748', marginBottom: '14px' },
    optionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
    optionBtn: { padding: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#4a5568', transition: 'all 0.2s' },
    optionBtnActive: { border: '2px solid #667eea', background: '#ebf4ff', color: '#667eea' },
    counter: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', justifyContent: 'center' },
    counterBtn: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #667eea', background: '#fff', color: '#667eea', fontSize: '22px', cursor: 'pointer', fontWeight: '700' },
    counterVal: { fontSize: '24px', fontWeight: '700', color: '#2d3748', minWidth: '30px', textAlign: 'center' },
    checkboxGroup: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' },
    checkboxLabel: { fontSize: '15px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
    summary: { background: '#f7fafc', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#4a5568' },
    footer: { display: 'flex', justifyContent: 'space-between', marginTop: '24px' },
    prevBtn: { padding: '12px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '15px' },
    nextBtn: { marginLeft: 'auto', padding: '12px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '700' },
    confirmBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #48bb78, #38a169)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '700' }
};

export default BookingPage;
