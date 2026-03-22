import React from 'react';
import { Link } from 'react-router-dom';
import { MAIN_APP_URL } from '../config';

function LandingPage() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand fw-bold">หมู่บ้านแสนสุข</span>
        </div>
      </nav>

      <main className="flex-grow-1 d-flex align-items-center">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h1 className="display-5 fw-bold mb-3">
                ระบบช่วยเหลือผู้สูงอายุในชุมชน
              </h1>
              <p className="lead text-muted mb-4">
                เรียกรถรับ-ส่ง กิจกรรมชมรม และตารางของคุณ — ใช้งานผ่านแอปเว็บ
                หลักที่รันคู่กับเซิร์ฟเวอร์ (พอร์ต 3001)
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Link to="/elderly-dashboard" className="btn btn-primary btn-lg">
                  เข้าสู่แดชบอร์ด
                </Link>
                <Link to="/booking" className="btn btn-outline-primary btn-lg">
                  จองรถ (React)
                </Link>
                <a
                  href={MAIN_APP_URL}
                  className="btn btn-outline-secondary btn-lg"
                  rel="noreferrer"
                >
                  แอปเต็มรูปแบบ (ล็อกอิน / กิจกรรม)
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
