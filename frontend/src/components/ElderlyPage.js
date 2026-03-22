import React from 'react';
import { Link } from 'react-router-dom';
import { MAIN_APP_URL, ADMIN_URL } from '../config';

function ElderlyPage() {
  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            หมู่บ้านแสนสุข
          </Link>
          <div className="navbar-nav ms-auto">
            <Link className="nav-link text-white" to="/">
              หน้าแรก
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <h1 className="h2 mb-4">แดชบอร์ดผู้สูงอายุ</h1>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="h5 card-title">แอปหลัก</h2>
                <p className="card-text text-muted">
                  เข้าสู่ระบบด้วย Google/Facebook จองรถ กิจกรรม และดูตารางของคุณ
                </p>
                <a
                  href={MAIN_APP_URL}
                  className="btn btn-primary"
                  rel="noreferrer"
                >
                  เปิดแอปหลัก
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="h5 card-title">จองรถ (หน้า React)</h2>
                <p className="card-text text-muted">
                  ตัวอย่างฟอร์มจองแบบสั้น เชื่อม API เดียวกับแบ็กเอนด์
                </p>
                <Link to="/booking" className="btn btn-outline-primary">
                  ไปจองรถ
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100 border-secondary">
              <div className="card-body">
                <h2 className="h5 card-title">ผู้ดูแลระบบ</h2>
                <p className="card-text text-muted">
                  จัดการยานพาหนะและกิจกรรม (มีรหัสผ่านในแอดมิน)
                </p>
                <a
                  href={ADMIN_URL}
                  className="btn btn-outline-secondary"
                  rel="noreferrer"
                >
                  เปิดแอดมิน
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElderlyPage;
