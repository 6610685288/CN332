// --- Initialize Facade ---
const apiService = new APIFacade('http://localhost:5000/api');

// --- Global State ---
let state = {
    currentUser: null,
    bookingWizard: {
        step: 1,
        vehicleId: null,
        vehicleName: '',
        destination: '',
        destinationName: '',
        timeType: 'now',
        scheduledTime: '',
        passengers: 1
    }
};

// --- Initial Setup ---
function initWizard() {
    const container = document.getElementById('wizard-indicators');
    container.innerHTML = `
        <div class="flex flex-col items-center step-indicator" id="step-1-ind"><div class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold mb-1 step-active">1</div><span class="text-sm">ปลายทาง</span></div>
        <div class="h-1 flex-1 bg-gray-200 mx-2 relative top-[-10px]"></div>
        <div class="flex flex-col items-center step-indicator" id="step-2-ind"><div class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold mb-1 step-inactive">2</div><span class="text-sm">รายละเอียด</span></div>
        <div class="h-1 flex-1 bg-gray-200 mx-2 relative top-[-10px]"></div>
        <div class="flex flex-col items-center step-indicator" id="step-3-ind"><div class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold mb-1 step-inactive">3</div><span class="text-sm">ยืนยัน</span></div>
    `;
}
initWizard();

const savedUser = localStorage.getItem("currentUser");
if (savedUser) {
    state.currentUser = JSON.parse(savedUser);
}

// --- Auth & Navigation (ASYNC UPDATE!) ---
async function handleLogin(provider) {
    try {
        // Show loading state
        Swal.fire({
            title: 'กำลังเชื่อมต่อ...',
            text: `กรุณารอสักครู่ กำลังติดต่อ ${provider}`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // 1. เรียก Adapter Factory
        const authAdapter = AuthFactory.getAdapter(provider);

        // 2. สั่ง login (รอผลลัพธ์ด้วย await)
        const user = await authAdapter.login();

        // 3. บันทึกข้อมูล
        state.currentUser = user;
        console.log("Logged in user:", user);
        localStorage.setItem("currentUser", JSON.stringify(user));

        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('userNameDisplay').textContent = `ยินดีต้อนรับ, ${user.name}`;

        // Close loading and show success
        Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ',
            text: `สวัสดีคุณ ${user.name} (${user.provider})`,
            timer: 1500,
            showConfirmButton: false
        });

        showPage('home');

    } catch (error) {
        console.error("Login Error:", error);
        Swal.fire('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถเข้าสู่ระบบได้', 'error');
    }
}

// ... (ส่วนที่เหลือของไฟล์เหมือนเดิม ไม่ต้องแก้) ...

function showPage(pageId) {
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('bg-sky-50', 'text-sky-700', 'font-bold');
        b.classList.add('text-gray-600');
    });
    const activeBtn = document.getElementById(`nav-${pageId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-sky-50', 'text-sky-700', 'font-bold');
        activeBtn.classList.remove('text-gray-600');
    }

    ['home', 'shuttle', 'booking', 'activity', 'schedule'].forEach(p => {
        document.getElementById(`page-${p}`).classList.add('hidden');
    });
    document.getElementById(`page-${pageId}`).classList.remove('hidden');

    if (pageId === 'home') loadHomeData();
    if (pageId === 'shuttle') loadVehicles();
    if (pageId === 'activity') loadActivities();
    if (pageId === 'schedule') loadSchedule();
}

function toggleMobileMenu() { Swal.fire('Menu', 'เมนูซ้ายสำหรับมือถือ', 'info'); }

async function loadHomeData() {
    const bookings = await apiService.getMySchedule(state.currentUser.name) || [];
    const preview = document.getElementById('home-schedule-preview');
    if (bookings.length > 0) {
        const latest = bookings[0];
        const icon = latest.type === 'vehicle' ? '🚍' : '🤸‍♂️';
        preview.innerHTML = `
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 ${latest.type === 'vehicle' ? 'border-sky-500' : 'border-emerald-500'} flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="text-2xl">${icon}</div>
                    <div>
                        <p class="font-bold text-gray-800">${latest.title}</p>
                        <p class="text-sm text-gray-500">${latest.detail}</p>
                    </div>
                </div>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ล่าสุด</span>
            </div>
        `;
        if (latest.type === 'vehicle') {
            document.getElementById('statusCard').innerHTML = `
                <h3 class="text-xl font-bold text-sky-700">รถกำลังมารับ!</h3>
                <p class="text-2xl mt-1 text-gray-800">${latest.title}</p>
                <p class="text-lg text-gray-600">อีก 5 นาทีจะถึงหน้าบ้าน</p>
            `;
            document.getElementById('statusCard').classList.add('bg-sky-50', 'border-sky-500');
        }
    } else {
        preview.innerHTML = '<div class="text-gray-400 text-center py-4 bg-white rounded-xl">ไม่มีข้อมูล</div>';
    }
}

async function loadActivities() {
    const list = document.getElementById('activityList');
    list.innerHTML = '<div class="text-center text-xl text-gray-500">กำลังโหลดกิจกรรม...</div>';
    let acts = await apiService.getActivities(state.currentUser.name);

    if (!acts) acts = [
        { id: 101, name: 'รำไทเก็ก ยามเช้า', time: '07:00 - 08:00', location: 'สวนสาธารณะ', seats: 20, joined: 18, icon: '🧘‍♂️' },
        { id: 102, name: 'แอโรบิค แดนซ์', time: '17:00 - 18:00', location: 'ลานสโมสร', seats: 30, joined: 5, icon: '💃' },
    ];

    acts = acts.map(a => ({
        ...a,
        hasJoined: a.hasJoined === true
    }));

    list.innerHTML = '';
    acts.forEach(a => {
        const isFull = a.joined >= a.seats;
        const hasJoined = a.hasJoined || false;
        list.innerHTML += `
        <div class="bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 card-hover border border-gray-100">

            <div class="flex items-center gap-4 w-full">
                <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl shrink-0">
                    ${a.icon}
                </div>

                <div>
                    <h3 class="text-xl font-bold text-gray-800">${a.name}</h3>

                    <p class="text-gray-600">
                        <i class="far fa-clock mr-1"></i> ${a.time}
                    </p>

                    <p class="text-gray-600">
                        <i class="fas fa-map-marker-alt mr-1 text-red-400"></i> ${a.location}
                    </p>

                    <div class="mt-2 text-sm">
                        <span class="bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                            <i class="fas fa-users"></i> ${a.joined}/${a.seats} คน
                        </span>
                    </div>
                </div>
            </div>

            ${hasJoined
                ? `<button onclick="leaveActivity(${a.id}, '${a.name}')"
                    class="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-lg shadow-md transition-all whitespace-nowrap bg-red-500 hover:bg-red-600 text-white">
                    ออกจากกิจกรรม
                   </button>`

                : `<button onclick="joinActivity(${a.id}, '${a.name}')"
                    ${isFull ? 'disabled' : ''}
                    class="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-lg shadow-md transition-all whitespace-nowrap
                    ${isFull ? 'bg-gray-300 text-gray-500' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}">
                    ${isFull ? 'เต็มแล้ว' : 'ลงชื่อเข้าร่วม'}
                   </button>`
            }

        </div>
    `;
    });
}

async function joinActivity(id, name) {
    const result = await Swal.fire({ title: `เข้าร่วม ${name}?`, text: "ต้องการลงชื่อเข้าร่วมกิจกรรมนี้ใช่ไหมครับ", icon: 'question', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#10b981' });
    if (result.isConfirmed) {
        Swal.showLoading();
        await apiService.joinActivity(id, state.currentUser.name);
        await loadActivities();
        Swal.fire('สำเร็จ', 'ลงชื่อเรียบร้อยแล้วครับ', 'success').then(() => loadActivities());
    }
}

async function leaveActivity(id, name) {
    const result = await Swal.fire({
        title: `ออกจาก ${name}?`,
        text: "ต้องการยกเลิกการเข้าร่วมกิจกรรมนี้ใช่ไหม",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        Swal.showLoading();

        await apiService.leaveActivity(id, state.currentUser.name);
        await loadActivities();

        Swal.fire('สำเร็จ', 'ออกจากกิจกรรมแล้ว', 'success')
            .then(() => loadActivities());
    }
}



async function loadSchedule() {
    const list = document.getElementById('myScheduleList');
    list.innerHTML = '<div class="text-center">โหลดข้อมูล...</div>';

    let items = await apiService.getMySchedule(state.currentUser.name);

    if (!items) {
        list.innerHTML = '<div class="text-center text-gray-400 py-10">ไม่มีข้อมูล</div>';
        return;
    }

    list.innerHTML = '';

    if (items.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-400 py-10">ยังไม่มีรายการ</div>';
        return;
    }

    items.forEach(b => {
        const isVeh = b.type === 'vehicle';
        const colorClass = isVeh ? 'border-sky-500 bg-sky-50' : 'border-emerald-500 bg-emerald-50';
        const icon = isVeh ? 'fas fa-bus text-sky-600' : 'fas fa-walking text-emerald-600';

        list.innerHTML += `
            <div class="bg-white p-5 rounded-xl shadow-sm border-l-8 ${colorClass} flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <i class="${icon} text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-lg text-gray-800">${b.title}</h4>
                        <p class="text-gray-600">${b.detail}</p>
                        <p class="text-xs text-gray-400 mt-1">
                            ${new Date(b.timestamp).toLocaleString('th-TH')}
                        </p>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    ${b.status}
                </span>
            </div>
        `;
    });
}

async function loadVehicles() {
    const list = document.getElementById('vehicleList');
    let data = await apiService.getVehicles();
    if (!data) data = [{ id: 1, type: 'Golf Cart', name: 'รถกอล์ฟ 01 (Demo)', status: 'available', icon: '🛺' }];
    list.innerHTML = '';
    data.forEach(v => {
        const isAvail = v.status === 'available';
        list.innerHTML += `
            <div class="${isAvail ? 'bg-white' : 'bg-gray-200 opacity-75'} p-6 rounded-2xl shadow-sm flex items-center justify-between border border-gray-100">
                <div class="flex items-center gap-4">
                    <div class="text-4xl bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center shadow-inner">${v.icon}</div>
                    <div><h3 class="text-2xl font-bold text-gray-800">${v.name}</h3><p class="text-lg ${isAvail ? 'text-green-600' : 'text-red-500'}">${isAvail ? 'ว่าง' : 'ไม่ว่าง'}</p></div>
                </div>
                <button ${!isAvail ? 'disabled' : ''} onclick="startBooking('${v.id}', '${v.name}')" class="${isAvail ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-gray-400 text-white cursor-not-allowed'} px-6 py-3 rounded-xl font-bold text-lg shadow-md">${isAvail ? 'จอง' : 'เต็ม'}</button>
            </div>
        `;
    });
}

function startBooking(id, name) {
    state.bookingWizard = { step: 1, vehicleId: id, vehicleName: name, destination: '', timeType: 'now', passengers: 1 };
    document.getElementById('booking-vehicle-name').textContent = name;
    updateWizardUI();
    showPage('booking');
}

function updateWizardUI() {
    const step = state.bookingWizard.step;
    [1, 2, 3].forEach(s => {
        document.getElementById(`step-${s}`).classList.add('hidden');
        const ind = document.getElementById(`step-${s}-ind`).querySelector('div');
        if (s === step) ind.className = 'w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold mb-1 step-active';
        else if (s < step) { ind.className = 'w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold mb-1 bg-sky-200 text-sky-800 border-sky-200'; ind.innerHTML = '✓'; }
        else { ind.className = 'w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold mb-1 step-inactive'; ind.innerHTML = s; }
    });
    document.getElementById(`step-${step}`).classList.remove('hidden');
    document.getElementById('btn-back').classList.toggle('hidden', step === 1);
    document.getElementById('btn-next').classList.toggle('hidden', step === 3);
    document.getElementById('btn-confirm').classList.toggle('hidden', step !== 3);
}

function nextStep() {
    if (state.bookingWizard.step === 1 && !state.bookingWizard.destination) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกปลายทาง', 'warning');
    if (state.bookingWizard.step < 3) {
        state.bookingWizard.step++;
        if (state.bookingWizard.step === 3) updateSummary();
        updateWizardUI();
    }
}
function prevStep() { if (state.bookingWizard.step > 1) { state.bookingWizard.step--; updateWizardUI(); } }

function selectDestination(val) {
    state.bookingWizard.destination = val;
    const map = { clubhouse: 'สโมสร', market: 'ตลาดนัด', clinic: 'คลินิก', park: 'สวนสาธารณะ' };
    state.bookingWizard.destinationName = map[val];
    document.querySelectorAll('.dest-card').forEach(el => el.classList.remove('option-selected'));
    document.querySelector(`.dest-card[data-value="${val}"]`).classList.add('option-selected');
}

function selectTimeType(type) {
    state.bookingWizard.timeType = type;
    const btnNow = document.getElementById('btn-time-now');
    const btnLater = document.getElementById('btn-time-later');
    const picker = document.getElementById('time-picker-container');
    if (type === 'now') {
        btnNow.classList.add('bg-sky-50', 'border-sky-500', 'text-sky-700'); btnNow.classList.remove('border-gray-200');
        btnLater.classList.remove('bg-sky-50', 'border-sky-500', 'text-sky-700'); btnLater.classList.add('border-gray-200');
        picker.classList.add('hidden');
    } else {
        btnLater.classList.add('bg-sky-50', 'border-sky-500', 'text-sky-700'); btnLater.classList.remove('border-gray-200');
        btnNow.classList.remove('bg-sky-50', 'border-sky-500', 'text-sky-700'); btnNow.classList.add('border-gray-200');
        picker.classList.remove('hidden');
    }
}

function adjustPassenger(delta) {
    let newVal = state.bookingWizard.passengers + delta;
    if (newVal < 1) newVal = 1; if (newVal > 4) newVal = 4;
    state.bookingWizard.passengers = newVal;
    document.getElementById('passenger-count').textContent = newVal;
}

function updateSummary() {
    document.getElementById('sum-vehicle').textContent = state.bookingWizard.vehicleName;
    document.getElementById('sum-dest').textContent = state.bookingWizard.destinationName;
    document.getElementById('sum-time').textContent = state.bookingWizard.timeType === 'now' ? 'ด่วน (ทันที)' : document.getElementById('scheduled-time').value || 'ไม่ระบุ';
}

async function submitBooking() {
    Swal.showLoading();
    const res = await apiService.bookVehicle({
        elderlyId: state.currentUser.name,
        destination: state.bookingWizard.destinationName,
        scheduledTime: state.bookingWizard.timeType === 'now'
            ? 'now'
            : document.getElementById('scheduled-time').value,
        passengers: state.bookingWizard.passengers,
        wheelchair: false,
        helper: false
    });
    if (res) { Swal.fire('สำเร็จ', 'รถกำลังมารับครับ', 'success').then(() => showPage('home')); } else {
        Swal.fire('ผิดพลาด', 'ไม่สามารถจองได้', 'error');
    }
}

function triggerSOS() {
    Swal.fire({
        title: 'ยืนยันแจ้งเหตุฉุกเฉิน?',
        text: "เจ้าหน้าที่จะรีบมาที่บ้านของคุณทันที",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'ใช่! แจ้งทันที',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) Swal.fire('แจ้งเหตุแล้ว!', 'เจ้าหน้าที่กำลังเดินทางมา', 'success');
    });
}