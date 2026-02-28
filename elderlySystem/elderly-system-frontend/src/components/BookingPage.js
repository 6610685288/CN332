import React, { useState } from 'react';

const BookingPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        vehicleId: null,
        vehicleName: '',
        destination: '',
        scheduledTime: '',
        passengers: 1,
        options: { wheelchair: false, helper: false },
    });

    // Handler functions for step navigation
    const nextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!bookingData.destination || !bookingData.scheduledTime) {
            alert("กรุณาเลือกปลายทางและเวลา");
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/booking/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    elderlyId: "E001",
                    destination: bookingData.destination,
                    scheduledTime: bookingData.scheduledTime,
                    passengers: bookingData.passengers,
                    wheelchair: bookingData.options.wheelchair,
                    helper: bookingData.options.helper
                })
            });

            if (!response.ok) {
                throw new Error("Server error");
            }

            const data = await response.json();
            console.log("Booking saved:", data);

            alert("จองรถสำเร็จแล้ว!");

            // Reset form
            setCurrentStep(1);
            setBookingData({
                vehicleId: null,
                vehicleName: '',
                destination: '',
                scheduledTime: '',
                passengers: 1,
                options: { wheelchair: false, helper: false },
            });

        } catch (error) {
            console.error("Error:", error);
            alert("เกิดข้อผิดพลาดในการจอง");
        }
    };

    return (
        <div className="container mt-5">
            <div className="wizard">
                <div className="wizard-steps">
                    {/* Step 1 */}
                    {currentStep === 1 && (
                        <div id="step-1">
                            <h3 className="text-center">เลือกสถานที่ปลายทาง</h3>
                            {/* Destination Selection */}
                            <div>
                                <button onClick={() => setBookingData({ ...bookingData, destination: 'clubhouse' })} className="btn btn-outline-primary">
                                    สโมสร
                                </button>
                                {/* More destination buttons */}
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {currentStep === 2 && (
                        <div id="step-2">
                            <h3 className="text-center">กรุณาระบุเวลาที่ต้องการ</h3>
                            {/* Time and passenger selection */}
                            <div>
                                <button onClick={() => setBookingData({ ...bookingData, scheduledTime: 'now' })} className="btn btn-outline-secondary">
                                    ตอนนี้
                                </button>
                                {/* More time buttons */}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Summary */}
                    {currentStep === 3 && (
                        <div id="step-3">
                            <h3 className="text-center">ตรวจสอบข้อมูล</h3>
                            <div>
                                <p>ยานพาหนะ: {bookingData.vehicleName}</p>
                                <p>ปลายทาง: {bookingData.destination}</p>
                                <p>เวลาที่จอง: {bookingData.scheduledTime}</p>
                                <p>ผู้โดยสาร: {bookingData.passengers}</p>
                            </div>
                            <button onClick={handleSubmit} className="btn btn-success">
                                ยืนยัน
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="mt-4">
                    <button onClick={prevStep} className={`btn btn-light ${currentStep === 1 ? 'd-none' : ''}`}>ย้อนกลับ</button>
                    <button onClick={nextStep} className={`btn btn-primary ${currentStep === 3 ? 'd-none' : ''}`}>ต่อไป</button>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
