import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';

const DEST_LABEL = {
  clubhouse: 'สโมสร',
  market: 'ตลาดนัด',
  clinic: 'คลินิก',
  park: 'สวนสาธารณะ',
};

const BookingPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    destination: '',
    timeType: 'now',
    scheduledTime: '',
    passengers: 1,
    options: { wheelchair: false, helper: false },
  });
  const [submitting, setSubmitting] = useState(false);

  const destLabel =
    DEST_LABEL[bookingData.destination] || bookingData.destination || '—';

  const timeLabel =
    bookingData.timeType === 'now'
      ? 'ทันที'
      : bookingData.scheduledTime || 'ไม่ระบุ';

  const nextStep = () => {
    if (currentStep === 1 && !bookingData.destination) {
      alert('กรุณาเลือกปลายทาง');
      return;
    }
    if (
      currentStep === 2 &&
      bookingData.timeType === 'later' &&
      !bookingData.scheduledTime
    ) {
      alert('กรุณาเลือกวันเวลา');
      return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!bookingData.destination) {
      alert('กรุณาเลือกปลายทาง');
      return;
    }
    if (bookingData.timeType === 'later' && !bookingData.scheduledTime) {
      alert('กรุณาเลือกวันเวลา');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/book-vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'E001',
          destination: destLabel,
          time: timeLabel,
          passengers: bookingData.passengers,
          wheelchair: bookingData.options.wheelchair,
          helper: bookingData.options.helper,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!data.success) {
        throw new Error('จองไม่สำเร็จ');
      }
      alert('จองรถสำเร็จแล้ว!');
      setCurrentStep(1);
      setBookingData({
        destination: '',
        timeType: 'now',
        scheduledTime: '',
        passengers: 1,
        options: { wheelchair: false, helper: false },
      });
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            หมู่บ้านแสนสุข
          </Link>
          <Link className="nav-link text-white" to="/elderly-dashboard">
            แดชบอร์ด
          </Link>
        </div>
      </nav>

      <div className="container pb-5">
        <div className="mx-auto bg-white rounded shadow-sm p-4" style={{ maxWidth: 560 }}>
          <h1 className="h4 text-center mb-4">จองรถรับ-ส่ง</h1>

          {currentStep === 1 && (
            <div>
              <h2 className="h6 text-muted mb-3">ขั้นที่ 1 — เลือกปลายทาง</h2>
              <div className="d-grid gap-2">
                {Object.entries(DEST_LABEL).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn ${
                      bookingData.destination === key
                        ? 'btn-primary'
                        : 'btn-outline-primary'
                    }`}
                    onClick={() =>
                      setBookingData({ ...bookingData, destination: key })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="h6 text-muted mb-3">ขั้นที่ 2 — เวลาและผู้โดยสาร</h2>
              <div className="d-flex gap-2 mb-3">
                <button
                  type="button"
                  className={`btn flex-fill ${
                    bookingData.timeType === 'now'
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() =>
                    setBookingData({ ...bookingData, timeType: 'now' })
                  }
                >
                  ทันที
                </button>
                <button
                  type="button"
                  className={`btn flex-fill ${
                    bookingData.timeType === 'later'
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() =>
                    setBookingData({ ...bookingData, timeType: 'later' })
                  }
                >
                  เลือกเวลา
                </button>
              </div>
              {bookingData.timeType === 'later' && (
                <div className="mb-3">
                  <label className="form-label">วันเวลานัดรับ</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={bookingData.scheduledTime}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        scheduledTime: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              <div className="mb-2">
                <label className="form-label">จำนวนผู้โดยสาร</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  className="form-control"
                  value={bookingData.passengers}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      passengers: Math.max(
                        1,
                        Math.min(8, Number(e.target.value) || 1)
                      ),
                    })
                  }
                />
              </div>
              <div className="form-check mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="wc"
                  checked={bookingData.options.wheelchair}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      options: {
                        ...bookingData.options,
                        wheelchair: e.target.checked,
                      },
                    })
                  }
                />
                <label className="form-check-label" htmlFor="wc">
                  ต้องการรถเข็น
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hp"
                  checked={bookingData.options.helper}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      options: {
                        ...bookingData.options,
                        helper: e.target.checked,
                      },
                    })
                  }
                />
                <label className="form-check-label" htmlFor="hp">
                  ต้องการผู้ช่วย
                </label>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="h6 text-muted mb-3">ขั้นที่ 3 — ยืนยัน</h2>
              <ul className="list-group mb-3">
                <li className="list-group-item">ปลายทาง: {destLabel}</li>
                <li className="list-group-item">เวลา: {timeLabel}</li>
                <li className="list-group-item">
                  ผู้โดยสาร: {bookingData.passengers} คน
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-success w-100"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'กำลังส่ง...' : 'ยืนยันการจอง'}
              </button>
            </div>
          )}

          {currentStep < 3 && (
            <div className="d-flex gap-2 mt-4">
              <button
                type="button"
                className={`btn btn-light ${currentStep === 1 ? 'd-none' : ''}`}
                onClick={prevStep}
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                className="btn btn-primary ms-auto"
                onClick={nextStep}
              >
                ต่อไป
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
