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

// Calendar state (declared globally to avoid TDZ with hoisted functions)
let calState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    allItems: [],
    selectedDate: null
};

// Grab/shuttle state
let grabState = {
    vehicleType: '',
    destination: '',
    destinationName: '',
    timeType: 'now',
    scheduledTime: '',
    passengers: 1
};
// Admin state
let allAdminUsers = [];
let allAdminBookings = [];

// --- Initial Setup ---
function initWizard() {
    const container = document.getElementById('wizard-indicators');
    if (!container) return;
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
const savedToken = localStorage.getItem("token");

if (savedUser && savedToken) {
    state.currentUser = JSON.parse(savedUser);
    
    // Wait for DOM to be ready, then transition UI
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('userNameDisplay').textContent = `ยินดีต้อนรับ, ${state.currentUser.name || state.currentUser.username}`;
        
        checkAdminAccess();
        loadNotifications();
        showPage('home');
        
        // Setup Notification Admin Tab Target Select
        if (state.currentUser?.role === 'admin' || state.currentUser?.role === 'staff') {
            apiService.getAllUsers().then(users => {
                const targetSelect = document.getElementById('notif-target');
                if (targetSelect) {
                    targetSelect.innerHTML = `
                        <option value="all">ส่งถึงทุกคนในระบบ (ทุก Role)</option>
                        <option value="role:elderly">ส่งเฉพาะลูกบ้าน (Elderly)</option>
                        <option value="role:staff">ส่งเฉพาะพนักงาน (Staff)</option>
                        <option value="role:admin">ส่งเฉพาะแอดมิน (Admin)</option>
                        <optgroup label="ลูกบ้าน (Elderly)">
                    `;
                    users.filter(u => u.role === 'elderly').forEach(u => {
                        const opt = document.createElement('option');
                        opt.value = u.elderlyId;
                        opt.textContent = `[${u.elderlyId}] ${u.name || u.username}`;
                        targetSelect.appendChild(opt);
                    });
                    
                    const groupOthers = document.createElement('optgroup');
                    groupOthers.label = "พนักงาน / แอดมิน";
                    users.filter(u => u.role !== 'elderly').forEach(u => {
                        const opt = document.createElement('option');
                        opt.value = u.elderlyId;
                        opt.textContent = `[${u.elderlyId}] ${u.name || u.username} (${u.role})`;
                        groupOthers.appendChild(opt);
                    });
                    targetSelect.appendChild(groupOthers);
                }
            }).catch(e => console.error("Auto-login admin setup failed:", e));
        }
    });
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
        const socialUser = await authAdapter.login();

        // 2.1 แลก Token จาก Backend (ใหม่!)
        const response = await fetch('http://localhost:5000/api/auth/social-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: socialUser.id,
                name: socialUser.name,
                provider: socialUser.provider
            })
        });

        if (!response.ok) throw new Error('ไม่สามารถรับ Token จากระบบได้');
        const authData = await response.json();

        // 3. บันทึกข้อมูล (เก็บ Token ไว้ด้วย)
        state.currentUser = authData.user;
        localStorage.setItem("currentUser", JSON.stringify(authData.user));
        localStorage.setItem("token", authData.token); // สำคัญมาก!

        checkAdminAccess();
        
        // โหลดข้อมูลแจ้งเตือนทันทีที่ล็อกอินเสร็จ
        loadNotifications();
        
        // Setup Notification Admin Tab Target Select
        if (state.currentUser?.role === 'admin' || state.currentUser?.role === 'staff') {
            try {
                const users = await apiService.getAllUsers();
                const targetSelect = document.getElementById('notif-target');
                if (targetSelect) {
                    targetSelect.innerHTML = `
                        <option value="all">ส่งถึงทุกคนในระบบ (ทุก Role)</option>
                        <option value="role:elderly">ส่งเฉพาะลูกบ้าน (Elderly)</option>
                        <option value="role:staff">ส่งเฉพาะพนักงาน (Staff)</option>
                        <option value="role:admin">ส่งเฉพาะแอดมิน (Admin)</option>
                        <optgroup label="ลูกบ้าน (Elderly)">
                    `;
                    users.filter(u => u.role === 'elderly').forEach(u => {
                        const opt = document.createElement('option');
                        opt.value = u.elderlyId;
                        opt.textContent = `[${u.elderlyId}] ${u.name || u.username}`;
                        targetSelect.appendChild(opt);
                    });
                    
                    const groupOthers = document.createElement('optgroup');
                    groupOthers.label = "พนักงาน / แอดมิน";
                    users.filter(u => u.role !== 'elderly').forEach(u => {
                        const opt = document.createElement('option');
                        opt.value = u.elderlyId;
                        opt.textContent = `[${u.elderlyId}] ${u.name || u.username} (${u.role})`;
                        groupOthers.appendChild(opt);
                    });
                    targetSelect.appendChild(groupOthers);
                }
            } catch(e) {}
        }

        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('userNameDisplay').textContent = `ยินดีต้อนรับ, ${authData.user.name}`;

        // Close loading and show success
        Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ',
            text: `สวัสดีคุณ ${authData.user.name}`,
            timer: 1500,
            showConfirmButton: false
        });

        showPage('home');

    } catch (error) {
        console.error("Login Error:", error);
        Swal.fire('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถเข้าสู่ระบบได้', 'error');
    }
}

// --- Notifications ---
let lastUnreadCount = -1;

async function loadNotifications() {
    try {
        const notifs = await apiService.getMyNotifications();
        
        // Update badge
        const unreadCount = notifs.filter(n => !n.isRead).length;
        
        if (lastUnreadCount !== -1 && unreadCount > lastUnreadCount) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'มีจดหมายแจ้งเตือนใหม่!',
                showConfirmButton: false,
                timer: 4000
            });
        }
        lastUnreadCount = unreadCount;
        const badges = [
            document.getElementById('notif-badge-desktop'),
            document.getElementById('notif-badge-mobile'),
            document.getElementById('notif-badge-home'),
            document.getElementById('notif-badge-admin-desktop'),
            document.getElementById('notif-badge-admin-mobile')
        ];
        
        badges.forEach(b => {
            if (b) {
                if (unreadCount > 0) {
                    b.textContent = unreadCount;
                    b.classList.remove('hidden');
                } else {
                    b.classList.add('hidden');
                }
            }
        });

        const list = document.getElementById('notificationList');
        if (!list) return;

        if (!Array.isArray(notifs)) {
            throw new Error('API return format is invalid');
        }

        if (notifs.length === 0) {
            list.innerHTML = `<div class="text-center text-gray-400 py-10"><i class="fas fa-inbox text-4xl mb-3 block"></i>ไม่มีข้อความแจ้งเตือน</div>`;
            return;
        }

        list.innerHTML = notifs.map(n => `
            <div onclick="readNotification(${n.id}, '${(n.title || '').replace(/'/g, "\\'")}', '${(n.message || '').replace(/\n/g, '<br>').replace(/'/g, "\\'")}', ${n.isRead})" class="bg-white p-5 rounded-2xl shadow-sm border-l-4 ${n.isRead ? 'border-gray-300 opacity-70' : 'border-purple-500'} cursor-pointer hover:bg-gray-50 transition-all flex items-start gap-4">
                <div class="mt-1 ${n.isRead ? 'text-gray-400' : 'text-purple-600'}">
                    <i class="fas ${n.isRead ? 'fa-envelope-open' : 'fa-envelope'} text-2xl"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-lg ${n.isRead ? 'text-gray-600' : 'text-gray-800'}">${n.title || 'ไม่มีหัวข้อ'}</h4>
                        <span class="text-xs text-gray-400">${n.createdAt ? new Date(n.createdAt).toLocaleString('th-TH') : ''}</span>
                    </div>
                    <p class="text-gray-600 mt-1 line-clamp-2">${n.message || ''}</p>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('loadNotifications Error:', err);
        const list = document.getElementById('notificationList');
        if (list) {
            list.innerHTML = `<div class="text-center text-red-500 py-10"><i class="fas fa-exclamation-triangle text-4xl mb-3 block"></i>เกิดข้อผิดพลาดในการโหลดข้อความ (${err.message})</div>`;
        }
    }
}

async function readNotification(id, title, message, isRead) {
    Swal.fire({
        title: title,
        html: `<div class="text-left text-gray-700 mt-4">${message}</div>`,
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#9333ea'
    });

    if (!isRead) {
        try {
            await apiService.markNotificationRead(id);
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    }
}

async function markAllNotificationsAsRead() {
    try {
        Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });
        await apiService.markAllNotificationsRead();
        await loadNotifications();
        Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'อ่านจดหมายทั้งหมดแล้ว',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (err) {
        console.error(err);
        Swal.fire('ผิดพลาด', 'ไม่สามารถดำเนินการได้', 'error');
    }
}

setInterval(() => {
    if (state.currentUser) {
        loadNotifications();
    }
}, 2000); // Poll every 2s

function showPage(pageId) {
    // รายชื่อหน้าทั้งหมดในระบบ (ต้องตรงกับ ID ใน HTML)
    const pages = ['home', 'profile', 'shuttle', 'booking', 'tracking', 'activity', 'schedule', 'admin', 'notifications'];
    
    pages.forEach(p => {
        const el = document.getElementById(`page-${p}`);
        if (el) el.classList.add('hidden');

        const nav = document.getElementById(`nav-${p}`);
        if (nav) nav.classList.remove('bg-sky-100', 'text-sky-700', 'font-bold', 'bg-purple-100', 'text-purple-800');
    });

    const currentEl = document.getElementById(`page-${pageId}`);
    if (currentEl) currentEl.classList.remove('hidden');

    const currentNav = document.getElementById(`nav-${pageId}`);
    if (currentNav) {
        if (pageId === 'admin') {
            currentNav.classList.add('bg-purple-100', 'text-purple-800', 'font-bold');
        } else {
            currentNav.classList.add('bg-sky-100', 'text-sky-700', 'font-bold');
        }
    }

    if (pageId === 'home') loadHomeData();
    if (pageId === 'profile') loadProfile();
    if (pageId === 'shuttle') loadVehicles();
    if (pageId === 'activity') loadActivities();
    if (pageId === 'schedule') loadSchedule();
    if (pageId === 'admin') switchAdminTab('users');
    if (pageId === 'notifications') loadNotifications();
    
    // ปิดเมนูมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
    const nav = document.getElementById('main-nav');
    if (nav) nav.classList.add('-translate-x-full');
}

function loadProfile() {
    if (!state.currentUser) return;
    const u = state.currentUser;

    // Username: ถ้าเป็น default social_XXXXX ให้แสดงเป็นค่าว่างเพื่อให้ user กรอกใหม่
    const defaultSocialPattern = /^social_/;
    document.getElementById('profile-username').value =
        defaultSocialPattern.test(u.username) ? '' : (u.username || '');
    document.getElementById('profile-username').placeholder =
        defaultSocialPattern.test(u.username)
            ? `เช่น ${u.name ? u.name.replace(/\s+/g, '_').toLowerCase() : 'my_username'}`
            : u.username;

    document.getElementById('profile-firstname').value  = u.firstName  || '';
    document.getElementById('profile-lastname').value   = u.lastName   || '';
    document.getElementById('profile-phone').value      = u.phone      || '';
    document.getElementById('profile-birthdate').value  = u.birthDate  || '';
    document.getElementById('profile-elderly-id').textContent = `ID: ${u.elderlyId}`;
}

async function handleUpdateProfile(event) {
    event.preventDefault();
    const newUsername  = document.getElementById('profile-username').value.trim();
    const newFirstName = document.getElementById('profile-firstname').value.trim();
    const newLastName  = document.getElementById('profile-lastname').value.trim();
    const newPhone     = document.getElementById('profile-phone').value.trim();
    const newBirthDate = document.getElementById('profile-birthdate').value;

    if (!newUsername || /\s/.test(newUsername)) {
        return Swal.fire('แจ้งเตือน', 'Username ต้องไม่มีช่องว่าง', 'warning');
    }

    try {
        Swal.showLoading();
        await apiService.updateMyProfile({
            username:  newUsername,
            firstName: newFirstName,
            lastName:  newLastName,
            phone:     newPhone,
            birthDate: newBirthDate
        });

        // อัปเดต state
        state.currentUser.username  = newUsername;
        state.currentUser.firstName = newFirstName;
        state.currentUser.lastName  = newLastName;
        state.currentUser.phone     = newPhone;
        state.currentUser.birthDate = newBirthDate;
        if (newFirstName || newLastName) {
            state.currentUser.name = [newFirstName, newLastName].filter(Boolean).join(' ');
        }
        localStorage.setItem("currentUser", JSON.stringify(state.currentUser));

        const displayName = state.currentUser.name || newUsername;
        document.getElementById('userNameDisplay').textContent = `ยินดีต้อนรับ, ${displayName}`;

        Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message, 'error');
    }
}


// Admin Tab Logic
function switchAdminTab(tab) {
    ['users', 'bookings', 'activities', 'incidents', 'notifications', 'announcements'].forEach(t => {
        const contentEl = document.getElementById(`admin-${t}`);
        const tabEl = document.getElementById(`tab-${t}`);
        if (contentEl) contentEl.classList.add('hidden');
        if (tabEl) {
            tabEl.classList.remove('bg-purple-600', 'text-white');
            tabEl.classList.add('text-gray-500');
        }
    });

    const activeContent = document.getElementById(`admin-${tab}`);
    const activeTab = document.getElementById(`tab-${tab}`);
    if (activeContent) activeContent.classList.remove('hidden');
    if (activeTab) {
        activeTab.classList.add('bg-purple-600', 'text-white');
        activeTab.classList.remove('text-gray-500');
    }

    if (tab === 'users') loadAdminUsers();
    if (tab === 'bookings') loadAdminBookings();
    if (tab === 'activities') loadAdminActivities();
    if (tab === 'incidents') loadAdminIncidents();
    if (tab === 'announcements') loadAdminAnnouncement();
}

function checkAdminAccess() {
    if (state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.role === 'staff')) {
        document.getElementById('nav-admin').classList.remove('hidden');
        const mobileBtn = document.getElementById('mobile-admin-btn');
        if (mobileBtn) mobileBtn.classList.remove('hidden');
    }
}

function toggleMobileMenu() { 
    const nav = document.querySelector('nav');
    nav.classList.toggle('-translate-x-full');
}

function handleLogout() {
    Swal.fire({
        title: 'ยืนยันการออกจากระบบ?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            window.location.reload();
        }
    });
}

function changeFontSize(delta) {
    const html = document.documentElement;
    const currentSize = parseFloat(getComputedStyle(html).fontSize);
    html.style.fontSize = (currentSize + delta) + 'px';
}

async function loadHomeData() {
    const items = await apiService.getMySchedule() || [];
    const preview = document.getElementById('home-schedule-preview');
    const statusCard = document.getElementById('statusCard');

    // --- 0. ข่าวประกาศ (Announcements) ---
    const announcementArea = document.getElementById('announcement-area');
    if (announcementArea) {
        try {
            const announcement = await apiService.getAnnouncement();
            if (announcement && announcement.message && announcement.message.trim() !== "") {
                announcementArea.innerHTML = `
                    <div class="bg-gradient-to-r from-orange-400 to-red-500 p-4 rounded-2xl text-white shadow-md flex justify-between items-center mb-6">
                        <div>
                            <h4 class="font-bold text-lg"><i class="fas fa-bullhorn mr-2"></i> ประกาศวันนี้</h4>
                            <p class="text-sm opacity-90 whitespace-pre-line">${announcement.message}</p>
                        </div>
                        <div class="text-3xl opacity-50"><i class="fas fa-info-circle"></i></div>
                    </div>
                `;
            } else {
                announcementArea.innerHTML = "";
            }
        } catch (e) {
            console.error("Failed to load announcement:", e);
            announcementArea.innerHTML = "";
        }
    }

    // --- NEW: Filter Notes for Today's Reminder ---
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const todayNotes = items.filter(item => {
        if (item.type !== 'note') return false;
        const noteDateStr = new Date(item.timestamp).toLocaleDateString('en-CA');
        return noteDateStr === todayStr;
    });

    const reminderContainer = document.getElementById('home-reminders-container');
    const reminderPreview = document.getElementById('home-reminders-preview');
    if (reminderContainer && reminderPreview) {
        if (todayNotes.length > 0) {
            reminderContainer.classList.remove('hidden');
            reminderPreview.innerHTML = todayNotes.map(note => `
                <div class="bg-amber-50 p-4 rounded-xl shadow-sm border-l-4 border-amber-500 flex justify-between items-center card-hover mb-2">
                    <div class="flex items-center gap-3">
                        <div class="text-2xl text-amber-500"><i class="fas fa-sticky-note"></i></div>
                        <div>
                            <p class="font-bold text-gray-800">${note.title.replace('โน้ต: ', '')}</p>
                            <p class="text-sm text-gray-500">${note.detail} (${new Date(note.timestamp).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.)</p>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            reminderContainer.classList.add('hidden');
        }
    }

    // Filter out notes from the main schedule preview so they don't take over the top spot if not intended
    const scheduleItems = items.filter(item => item.type !== 'note');

    if (scheduleItems.length > 0) {
        // --- 1. แสดงรายการแค่อันล่าสุดใน Preview ---
        preview.innerHTML = scheduleItems.slice(0, 1).map(item => {
            const icon = item.type === 'vehicle' ? '🚍' : '🤸‍♂️';
            const colorClass = item.type === 'vehicle' ? 'border-sky-500' : 'border-emerald-500';
            return `
                <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 ${colorClass} flex justify-between items-center card-hover mb-2">
                    <div class="flex items-center gap-3">
                        <div class="text-2xl">${icon}</div>
                        <div>
                            <p class="font-bold text-gray-800">${item.title}</p>
                            <p class="text-sm text-gray-500">${item.detail}</p>
                        </div>
                    </div>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">${item.type === 'vehicle' ? 'รถรับส่ง' : 'กิจกรรม'}</span>
                </div>
            `;
        }).join('');

        // --- 2. อัปเดตการ์ดสถานะ (แสดงรายการล่าสุด) ---
        const latest = items[0];
        if (latest.type === 'vehicle') {
            statusCard.innerHTML = `
                <h3 class="text-xl font-bold text-sky-700">รถกำลังมารับ!</h3>
                <p class="text-2xl mt-1 text-gray-800">${latest.title}</p>
                <p class="text-lg text-gray-600">นัดหมายเวลา: ${latest.detail.split('|')[0]}</p>
            `;
            statusCard.className = "bg-sky-50 p-6 rounded-2xl shadow-sm border-l-8 border-sky-500";
        } else {
            statusCard.innerHTML = `
                <h3 class="text-xl font-bold text-emerald-700">คุณมีกิจกรรมวันนี้</h3>
                <p class="text-2xl mt-1 text-gray-800">${latest.title}</p>
                <p class="text-lg text-gray-600">เตรียมตัวให้พร้อมนะครับ</p>
            `;
            statusCard.className = "bg-emerald-50 p-6 rounded-2xl shadow-sm border-l-8 border-emerald-500";
        }
    } else {
        if (preview) preview.innerHTML = '<div class="text-gray-400 text-center py-4 bg-white rounded-xl">ไม่มีข้อมูลนัดหมาย</div>';
        statusCard.innerHTML = `
            <h3 class="text-xl font-bold text-gray-500">สถานะปัจจุบัน</h3>
            <p class="text-2xl mt-2 text-gray-400">ยังไม่มีรายการจองขณะนี้</p>
        `;
        statusCard.className = "bg-white p-6 rounded-2xl shadow-sm border-l-8 border-gray-300";
    }
}

async function loadActivities() {
    const list = document.getElementById('activityList');
    list.innerHTML = '<div class="text-center text-xl text-gray-500">กำลังโหลดกิจกรรม...</div>';
    let acts = await apiService.getActivities();

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
                    ${a.description ? `<p class="text-sm text-gray-500 mt-1 mb-2">${a.description}</p>` : ''}

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
        try {
            Swal.showLoading();
            await apiService.joinActivity(id);
            Swal.fire('สำเร็จ', 'ลงชื่อเรียบร้อยแล้วครับ', 'success').then(() => loadActivities());
        } catch (error) {
            Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถลงชื่อได้', 'error');
        }
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
        try {
            Swal.showLoading();
            await apiService.leaveActivity(id);
            Swal.fire('สำเร็จ', 'ออกจากกิจกรรมแล้ว', 'success').then(() => loadActivities());
        } catch (error) {
            Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถยกเลิกได้', 'error');
        }
    }
}



// ======= CALENDAR SCHEDULE SYSTEM =======
// (calState declared at top of file to avoid TDZ)

async function loadSchedule() {
    const list = document.getElementById('myScheduleList');
    list.innerHTML = '<div class="text-center py-6 text-gray-400">โหลดข้อมูล...</div>';

    const items = await apiService.getMySchedule();
    calState.allItems = items || [];
    calState.selectedDate = null;

    document.getElementById('cal-selected-label').classList.add('hidden');
    list.innerHTML = '<div class="text-center text-gray-400 py-4">เลือกวันในปฏิทินเพื่อดูรายการ</div>';

    renderCalendar();
}

function renderCalendar() {
    const { year, month, allItems, selectedDate } = calState;

    // --- Month Label ---
    const monthNames = [
        'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
        'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
    ];
    document.getElementById('cal-month-label').textContent =
        `${monthNames[month]} ${year + 543}`;

    // --- Build event map: "YYYY-MM-DD" -> [items] ---
    const eventMap = {};
    allItems.forEach(item => {
        if (!item.timestamp) return;
        const d = new Date(item.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!eventMap[key]) eventMap[key] = [];
        eventMap[key].push(item);
    });

    // --- Grid ---
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // Empty cells before day 1
    for (let i = 0; i < firstDay; i++) {
        grid.insertAdjacentHTML('beforeend', `<div class="h-14 border-b border-r border-gray-50"></div>`);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const hasEvent  = !!eventMap[dateKey];
        const isToday   = dateKey === todayKey;
        const isSelected = dateKey === selectedDate;
        const dow = (firstDay + d - 1) % 7;
        const isSun = dow === 0;
        const isSat = dow === 6;

        let cellBg = 'hover:bg-sky-50';
        let numColor = isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700';
        if (isToday)    cellBg = 'bg-sky-50';
        if (isSelected) cellBg = 'bg-sky-600';
        if (isSelected) numColor = 'text-white font-bold';

        // Event dots (max 3 types shown)
        const dots = hasEvent ? eventMap[dateKey].slice(0,3).map(ev => {
            if (ev.type === 'vehicle') return `<span class="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span>`;
            if (ev.type === 'note') return `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>`;
            return `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>`;
        }).join('') : '';

        grid.insertAdjacentHTML('beforeend', `
            <div onclick="calSelectDay('${dateKey}')"
                class="${cellBg} border-b border-r border-gray-100 h-14 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors select-none">
                <span class="text-sm ${numColor} ${isToday && !isSelected ? 'underline decoration-2 underline-offset-2' : ''}">${d}</span>
                <div class="flex gap-0.5">${dots}</div>
            </div>
        `);
    }
}

function calNavigate(delta) {
    calState.month += delta;
    if (calState.month > 11) { calState.month = 0; calState.year++; }
    if (calState.month < 0)  { calState.month = 11; calState.year--; }
    calState.selectedDate = null;
    document.getElementById('cal-selected-label').classList.add('hidden');
    document.getElementById('myScheduleList').innerHTML =
        '<div class="text-center text-gray-400 py-4">เลือกวันในปฏิทินเพื่อดูรายการ</div>';
    renderCalendar();
}

function calSelectDay(dateKey) {
    calState.selectedDate = dateKey;
    renderCalendar();

    const list = document.getElementById('myScheduleList');
    const label = document.getElementById('cal-selected-label');
    const labelText = document.getElementById('cal-selected-date-text');

    // Format Thai date
    const [y, m, d] = dateKey.split('-').map(Number);
    const monthNames = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    labelText.textContent = `รายการวันที่ ${d} ${monthNames[m-1]} ${y + 543}`;
    label.classList.remove('hidden');

    // Filter items for this day
    const dayItems = calState.allItems.filter(item => {
        if (!item.timestamp) return false;
        const dt = new Date(item.timestamp);
        const k = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        return k === dateKey;
    });

    if (dayItems.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-400 py-6 bg-white rounded-2xl border">ไม่มีรายการในวันนี้</div>';
        return;
    }

    list.innerHTML = dayItems.map(b => {
        const isVeh = b.type === 'vehicle';
        const isNote = b.type === 'note';
        let colorClass = 'border-emerald-500 bg-emerald-50';
        let icon = 'fas fa-walking text-emerald-600';
        
        if (isVeh) {
            colorClass = 'border-sky-500 bg-sky-50';
            icon = 'fas fa-bus text-sky-600';
        } else if (isNote) {
            colorClass = 'border-amber-500 bg-amber-50';
            icon = 'fas fa-sticky-note text-amber-600';
        }

        let statusBadge = '';
        if (b.status === 'approved' || b.type === 'activity') {
            statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Approve</span>';
        } else if (b.status === 'rejected' || b.status === 'cancelled') {
            statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Reject</span>';
        } else {
            statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">${b.status}</span>`;
        }

        return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border-l-4 ${colorClass} flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <i class="${icon} text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-lg text-gray-800">${b.title}</h4>
                        <p class="text-gray-600">${b.detail}</p>
                        <p class="text-xs text-gray-400 mt-1">${new Date(b.timestamp).toLocaleString('th-TH')}</p>
                    </div>
                </div>
                ${statusBadge}
            </div>
        `;
    }).join('');
}
async function handleCancelBooking(bookingId) {
    const result = await Swal.fire({
        title: 'ยืนยันการยกเลิกการจอง?',
        text: 'ต้องการยกเลิกการจองรถนี้ใช่ไหมครับ',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ยกเลิกการจอง',
        cancelButtonText: 'ไม่ยกเลิก',
        confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;
    try {
        Swal.showLoading();
        await apiService.cancelBooking(bookingId);
        Swal.fire({ icon: 'success', title: 'ยกเลิกการจองแล้ว', timer: 1200, showConfirmButton: false });
        loadSchedule(); // refresh calendar
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message, 'error');
    }
}

// --- ADD NOTE LOGIC ---
function openAddNoteModal() {
    document.getElementById('addNoteModal').classList.remove('hidden');
    document.getElementById('note-title').value = '';
    document.getElementById('note-time').value = '';
    document.getElementById('note-detail').value = '';
}

function closeAddNoteModal() {
    document.getElementById('addNoteModal').classList.add('hidden');
}

async function handleAddNoteSubmit(event) {
    event.preventDefault();
    const title = document.getElementById('note-title').value.trim();
    const time = document.getElementById('note-time').value;
    const detail = document.getElementById('note-detail').value.trim();

    if (!title || !time) return Swal.fire('แจ้งเตือน', 'กรุณากรอกหัวข้อและเวลา', 'warning');

    try {
        Swal.showLoading();
        await apiService.createNote({
            title: title,
            scheduledTime: time,
            detail: detail
        });
        
        Swal.fire({ icon: 'success', title: 'เพิ่มโน้ตเรียบร้อย', timer: 1500, showConfirmButton: false });
        closeAddNoteModal();
        
        // Refresh schedule and home data
        await loadSchedule();
        if (document.getElementById('page-home').classList.contains('hidden') === false) {
            loadHomeData();
        }
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message || 'ไม่สามารถเพิ่มโน้ตได้', 'error');
    }
}

// --- ADMIN ANNOUNCEMENT LOGIC ---
async function loadAdminAnnouncement() {
    try {
        const announcement = await apiService.getAnnouncement();
        document.getElementById('admin-announcement-message').value = announcement && announcement.message ? announcement.message : '';
    } catch (e) {
        console.error("Failed to load admin announcement:", e);
    }
}

async function handleSaveAnnouncement(event) {
    event.preventDefault();
    const message = document.getElementById('admin-announcement-message').value.trim();

    try {
        Swal.showLoading();
        await apiService.updateAnnouncement(message);
        Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ',
            text: 'อัปเดตประกาศเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message || 'ไม่สามารถบันทึกประกาศได้', 'error');
    }
}

// (grabState declared at top of file to avoid TDZ)

function loadVehicles() {
    // ใน Grab-style ไม่ต้องโหลด vehicle list แล้ว
    // reset state ทุกครั้งที่เปิดหน้า
    grabState = { vehicleType: '', destination: '', destinationName: '', timeType: 'now', scheduledTime: '', passengers: 1 };

    // reset UI
    document.querySelectorAll('.grab-veh-card').forEach(c => {
        c.classList.remove('border-sky-500', 'bg-sky-50');
        c.classList.add('border-gray-100');
    });
    document.querySelectorAll('.grab-dest-card').forEach(c => {
        c.classList.remove('border-sky-500', 'bg-sky-50');
        c.classList.add('border-gray-100');
    });
    document.getElementById('grab-passenger-count').textContent = '1';
    document.getElementById('grab-confirm-btn').disabled = true;
    document.getElementById('grab-confirm-btn').className =
        'w-full bg-gray-300 text-gray-500 p-5 rounded-2xl font-bold text-xl shadow-sm cursor-not-allowed transition-all';
    document.getElementById('grab-dest-hint').textContent = 'กรุณาเลือกรถและปลายทางก่อน';
    grabSelectTime('now');

    const now = new Date();
    const offset = now.getTimezoneOffset();
    const minDate = new Date(now.getTime() - (offset*60*1000)).toISOString().slice(0,16);
    document.getElementById('grab-scheduled-time').min = minDate;
}

function grabSelectVehicle(val) {
    grabState.vehicleType = val;
    document.querySelectorAll('.grab-veh-card').forEach(c => {
        c.classList.remove('border-sky-500', 'bg-sky-50');
        c.classList.add('border-gray-100');
    });
    const selected = document.querySelector(`.grab-veh-card[data-val="${val}"]`);
    if (selected) {
        selected.classList.remove('border-gray-100');
        selected.classList.add('border-sky-500', 'bg-sky-50');
    }
    checkGrabConfirmReady();
}

function checkGrabConfirmReady() {
    if (grabState.vehicleType && grabState.destination) {
        const btn = document.getElementById('grab-confirm-btn');
        btn.disabled = false;
        btn.className = 'w-full bg-sky-600 text-white p-5 rounded-2xl font-bold text-xl shadow-lg hover:bg-sky-700 transition-all';
        document.getElementById('grab-dest-hint').textContent = `รถ: ${grabState.vehicleType} | ปลายทาง: ${grabState.destinationName} ✅`;
    }
}

function grabSelectDest(val, name) {
    grabState.destination = val;
    grabState.destinationName = name;

    // highlight selected card
    document.querySelectorAll('.grab-dest-card').forEach(c => {
        c.classList.remove('border-sky-500', 'bg-sky-50');
        c.classList.add('border-gray-100');
    });
    const selected = document.querySelector(`.grab-dest-card[data-val="${val}"]`);
    if (selected) {
        selected.classList.remove('border-gray-100');
        selected.classList.add('border-sky-500', 'bg-sky-50');
    }

    checkGrabConfirmReady();
}

function grabSelectTime(type) {
    grabState.timeType = type;
    const btnNow   = document.getElementById('grab-btn-now');
    const btnLater = document.getElementById('grab-btn-later');
    const picker   = document.getElementById('grab-time-picker');

    if (type === 'now') {
        btnNow.className   = 'flex-1 py-3 rounded-xl border-2 border-sky-500 bg-sky-50 text-sky-700 font-bold text-sm transition-all';
        btnLater.className = 'flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm transition-all';
        picker.classList.add('hidden');
    } else {
        btnLater.className = 'flex-1 py-3 rounded-xl border-2 border-sky-500 bg-sky-50 text-sky-700 font-bold text-sm transition-all';
        btnNow.className   = 'flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm transition-all';
        picker.classList.remove('hidden');
    }
}

function grabAdjustPassenger(delta) {
    let val = grabState.passengers + delta;
    if (val < 1) val = 1;
    if (val > 8) val = 8;
    grabState.passengers = val;
    document.getElementById('grab-passenger-count').textContent = val;
}

async function grabSubmitBooking() {
    if (!grabState.vehicleType) {
        return Swal.fire('แจ้งเตือน', 'กรุณาเลือกรถที่ต้องการ', 'warning');
    }
    if (!grabState.destination) {
        return Swal.fire('แจ้งเตือน', 'กรุณาเลือกปลายทาง', 'warning');
    }

    const scheduledTime = grabState.timeType === 'now'
        ? 'now'
        : document.getElementById('grab-scheduled-time').value;

    if (grabState.timeType === 'later' && !scheduledTime) {
        return Swal.fire('แจ้งเตือน', 'กรุณาเลือกเวลาที่ต้องการ', 'warning');
    }
    
    // Check if time is in the past
    if (grabState.timeType === 'later') {
        const selectedDate = new Date(scheduledTime);
        const now = new Date();
        if (selectedDate < now) {
            return Swal.fire('แจ้งเตือน', 'ไม่สามารถเลือกเวลาในอดีตได้', 'warning');
        }
    }

    const result = await Swal.fire({
        title: `เรียกรถไป ${grabState.destinationName}?`,
        html: `
            <div class="text-left space-y-2 text-base">
                <div>🚐 <b>ประเภทรถ:</b> ${grabState.vehicleType}</div>
                <div>📍 <b>ปลายทาง:</b> ${grabState.destinationName}</div>
                <div>⏰ <b>เวลา:</b> ${scheduledTime === 'now' ? 'ด่วน (ทันที)' : new Date(scheduledTime).toLocaleString('th-TH')}</div>
                <div>👥 <b>ผู้โดยสาร:</b> ${grabState.passengers} คน</div>
            </div>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '🚗 เรียกรถเลย!',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#0284c7'
    });

    if (!result.isConfirmed) return;

    try {
        Swal.fire({ title: 'กำลังหารถให้...', text: 'รอสักครู่นะครับ', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        await apiService.bookVehicle({
            elderlyId:     state.currentUser.elderlyId,
            vehicleType:   grabState.vehicleType,
            destination:   grabState.destinationName,
            scheduledTime: scheduledTime,
            passengers:    grabState.passengers,
            wheelchair:    false,
            helper:        false
        });

        Swal.fire({
            icon: 'success',
            title: 'เรียกรถสำเร็จ! 🎉',
            text: `รถกำลังมารับที่บ้านของคุณ ปลายทาง: ${grabState.destinationName}`,
            confirmButtonText: 'กลับหน้าหลัก',
            confirmButtonColor: '#0284c7'
        }).then(() => showPage('home'));

    } catch (error) {
        Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถจองได้', 'error');
    }
}

function startBooking(id, name) {
    // legacy — ไม่ใช้แล้วใน Grab-style
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
    try {
        Swal.showLoading();
        const res = await apiService.bookVehicle({
            elderlyId: state.currentUser.elderlyId,
            destination: state.bookingWizard.destinationName,
            scheduledTime: state.bookingWizard.timeType === 'now'
                ? 'now'
                : document.getElementById('scheduled-time').value,
            passengers: state.bookingWizard.passengers,
            wheelchair: false,
            helper: false
        });
        Swal.fire('สำเร็จ', 'รถกำลังมารับครับ', 'success').then(() => showPage('home'));
    } catch (error) {
        Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถจองได้', 'error');
    }
}

async function triggerSOS() {
    Swal.fire({
        title: 'ยืนยันแจ้งเหตุฉุกเฉิน?',
        text: "เจ้าหน้าที่จะรีบมาที่บ้านของคุณทันที",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'ใช่! แจ้งทันที',
        cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                Swal.fire({ title: 'กำลังส่งสัญญาณ SOS...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await apiService.triggerSOSIncident('บ้านพัก');
                Swal.fire({
                    icon: 'success',
                    title: 'แจ้งเหตุแล้ว! 🆘',
                    text: 'เจ้าหน้าที่กำลังเดินทางมา กรุณารออยู่ในที่ปลอดภัย',
                    confirmButtonColor: '#d33'
                });
            } catch (e) {
                // แม้ส่ง API ไม่ได้ก็แจ้ง popup ให้ก่อน
                Swal.fire('แจ้งเหตุแล้ว!', 'เจ้าหน้าที่กำลังเดินทางมา', 'success');
            }
        }
    });
}

// --- NEW ADMIN FUNCTIONS ---

async function loadAdminUsers() {
    const list = document.getElementById('adminUserList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" class="p-8 text-center">กำลังโหลด...</td></tr>';
    try {
        allAdminUsers = await apiService.getAllUsers();
        renderAdminUsers(allAdminUsers);
    } catch (e) {
        list.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500">Error: ${e.message}</td></tr>`;
    }
}

function renderAdminUsers(users) {
    const list = document.getElementById('adminUserList');
    if (users.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400">ไม่พบผู้ใช้</td></tr>';
        return;
    }
    list.innerHTML = users.map(u => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">
                <div class="font-bold">${u.name}</div>
                <div class="text-xs text-gray-400">ID: ${u.elderlyId}</div>
            </td>
            <td class="p-4 text-gray-600">${u.username}</td>
            <td class="p-4">
                <select onchange="handleRoleChange('${u.id}', this.value)" 
                    class="p-1 rounded border text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-sky-100 text-sky-700 border-sky-300'}">
                    <option value="elderly" ${u.role === 'elderly' ? 'selected' : ''}>ELDERLY</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ADMIN</option>
                    <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>STAFF</option>
                </select>
            </td>
            <td class="p-4 text-sm text-gray-500">${new Date(u.createdAt).toLocaleDateString('th-TH')}</td>
        </tr>
    `).join('');
}

function filterAdminUsers() {
    const searchTerm = document.getElementById('search-users').value.toLowerCase();
    if (!searchTerm) {
        renderAdminUsers(allAdminUsers);
        return;
    }
    const filtered = allAdminUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(searchTerm)) || 
        (u.elderlyId && String(u.elderlyId).toLowerCase().includes(searchTerm)) ||
        (u.username && u.username.toLowerCase().includes(searchTerm))
    );
    renderAdminUsers(filtered);
}

async function handleRoleChange(userId, newRole) {
    try {
        Swal.showLoading();
        await apiService.updateUserRole(userId, newRole);
        Swal.fire({
            icon: 'success',
            title: 'อัปเดตสิทธิ์สำเร็จ',
            text: `เปลี่ยนสิทธิ์เป็น ${newRole} เรียบร้อยแล้ว`,
            timer: 1000,
            showConfirmButton: false
        });
        loadAdminUsers();
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message, 'error');
    }
}

async function loadAdminBookings() {
    const list = document.getElementById('adminBookingList');
    if (!list) return;
    list.innerHTML = '<div class="p-8 text-center">กำลังโหลด...</div>';
    try {
        allAdminBookings = await apiService.getAllBookings();
        renderAdminBookings(allAdminBookings);
    } catch (e) {
        list.innerHTML = `<div class="p-8 text-center text-red-500 bg-white rounded-xl">Error: ${e.message}</div>`;
    }
}

function filterAdminBookings() {
    const statusFilter = document.getElementById('filter-booking-status').value;
    if (statusFilter === 'all') {
        renderAdminBookings(allAdminBookings);
    } else {
        const filtered = allAdminBookings.filter(b => b.status === statusFilter);
        renderAdminBookings(filtered);
    }
}

function renderAdminBookings(bookings) {
    const list = document.getElementById('adminBookingList');
    if (bookings.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-gray-400 bg-white rounded-xl">ไม่พบข้อมูลการจองตามเงื่อนไขที่เลือก</div>';
        return;
    }
        list.innerHTML = bookings.map(b => {
            const statusColors = {
                pending:   'bg-yellow-100 text-yellow-700',
                approved:  'bg-green-100 text-green-700',
                rejected:  'bg-red-100 text-red-700',
                cancelled: 'bg-gray-100 text-gray-500',
                completed: 'bg-blue-100 text-blue-700'
            };
            const statusLabel = {
                pending:   '⏳ รอดำเนินการ',
                approved:  '✅ อนุมัติแล้ว',
                rejected:  '❌ ปฏิเสธแล้ว',
                cancelled: '🚫 ยกเลิกแล้ว',
                completed: '🏁 เสร็จสิ้น'
            };
            const sc = statusColors[b.status] || 'bg-gray-100 text-gray-500';
            const sl = statusLabel[b.status] || b.status;
            const isPending = b.status === 'pending';
            return `
            <div class="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-3">
                <div class="flex items-center gap-4">
                    <div class="text-2xl">🚍</div>
                    <div>
                        <p class="font-bold text-gray-800">${b.destination}</p>
                        <p class="text-sm text-gray-500">รถ: ${b.vehicleType || 'สี่ล้อปกติ'} | ผู้โดยสาร: ${b.passengers} คน | เวลา: ${b.scheduledTime === 'now' ? 'ด่วน (ทันที)' : new Date(b.scheduledTime).toLocaleString('th-TH')}</p>
                        <p class="text-xs text-purple-600 font-bold">ผู้จอง: ${b.displayName || b.elderlyId}</p>
                        <p class="text-[10px] text-gray-300">${new Date(b.createdAt).toLocaleString('th-TH')}</p>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${sc}">${sl}</span>
                    ${isPending ? `
                    <div class="flex gap-2">
                        <button onclick="handleBookingStatus(${b.id}, 'approved')" class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg font-bold transition-all">
                            ✅ อนุมัติ
                        </button>
                        <button onclick="handleBookingStatus(${b.id}, 'rejected')" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-bold transition-all">
                            ❌ ปฏิเสธ
                        </button>
                    </div>` : ''}
                </div>
            </div>
        `;
        }).join('');
}

async function handleBookingStatus(bookingId, status) {
    const label = status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    const color = status === 'approved' ? '#10b981' : '#ef4444';
    const result = await Swal.fire({
        title: `ยืนยันการ${label}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `ใช่, ${label}`,
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: color
    });
    if (!result.isConfirmed) return;
    try {
        Swal.showLoading();
        await apiService.updateBookingStatus(bookingId, status);
        Swal.fire({ icon: 'success', title: `${label}แล้ว!`, timer: 1000, showConfirmButton: false });
        loadAdminBookings();
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message, 'error');
    }
}

async function handleCreateActivity(event) {
    event.preventDefault();
    const data = {
        name: document.getElementById('act-name').value,
        description: document.getElementById('act-description').value,
        date: document.getElementById('act-date').value,
        maxSeats: parseInt(document.getElementById('act-seats').value),
        location: document.getElementById('act-location').value,
        icon: document.getElementById('act-icon').value
    };

    try {
        Swal.showLoading();
        await apiService.createActivity(data);
        Swal.fire('สำเร็จ', 'สร้างกิจกรรมเรียบร้อยแล้ว', 'success');
        document.getElementById('createActivityForm').reset();
        loadAdminActivities(); // refresh list
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message, 'error');
    }
}

async function loadAdminActivities() {
    const list = document.getElementById('adminActivityList');
    if (!list) return;
    list.innerHTML = '<div class="text-center text-gray-400 py-4">กำลังโหลด...</div>';
    try {
        const acts = await apiService.getActivities();
        if (!acts || acts.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">ยังไม่มีกิจกรรม</div>';
            return;
        }
        list.innerHTML = acts.map(a => `
            <div class="bg-white p-4 rounded-xl border flex justify-between items-center mb-2">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${a.icon}</span>
                    <div>
                        <p class="font-bold text-gray-800">${a.name}</p>
                        <p class="text-sm text-gray-500">${a.date} | ${a.location} | ${a.joined}/${a.seats} คน</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="handleViewParticipants(${a.id}, '${a.name.replace(/'/g, "\\'")}')"
                        class="px-3 py-1 bg-sky-100 hover:bg-sky-200 text-sky-600 text-sm rounded-lg font-bold transition-all">
                        👥 ดูรายชื่อ
                    </button>
                    <button onclick="handleDeleteActivity(${a.id}, '${a.name.replace(/'/g, "\\'")}')"
                        class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-sm rounded-lg font-bold transition-all">
                        🗑 ลบ
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = `<div class="text-center text-red-500 py-4">Error: ${e.message}</div>`;
    }
}

async function handleViewParticipants(id, name) {
    try {
        Swal.fire({ title: 'กำลังโหลด...', didOpen: () => Swal.showLoading() });
        const users = await apiService.getActivityParticipants(id);
        
        if (!users || users.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'รายชื่อผู้เข้าร่วม',
                html: `<b>${name}</b><br><br><span class="text-gray-500">ยังไม่มีผู้เข้าร่วมกิจกรรมนี้</span>`
            });
            return;
        }

        const userHtml = users.map(u => `
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2 text-left">
                <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                    ${(u.name || u.username).charAt(0)}
                </div>
                <div>
                    <p class="font-bold text-gray-800">${u.name || u.username} ${u.role === 'admin' ? '<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Admin</span>' : ''}</p>
                    <p class="text-xs text-gray-500">ID: ${u.elderlyId}</p>
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: 'ผู้เข้าร่วมกิจกรรม',
            html: `<div class="text-sm text-gray-500 mb-4">${name} (รวม ${users.length} คน)</div><div class="max-h-64 overflow-y-auto">${userHtml}</div>`,
            showConfirmButton: true,
            confirmButtonText: 'ปิดหน้าต่าง',
            confirmButtonColor: '#9333ea',
            width: '400px'
        });

    } catch (err) {
        Swal.fire('ผิดพลาด', err.message || 'ไม่สามารถโหลดรายชื่อได้', 'error');
    }
}

async function handleDeleteActivity(id, name) {
    const result = await Swal.fire({
        title: `ลบกิจกรรม "${name}"?`,
        text: 'การกระทำนี้ไม่สามารถย้อนกลับได้ และจะลบข้อมูลผู้เข้าร่วมทั้งหมด',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ลบเลย',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;
    try {
        Swal.showLoading();
        await apiService.deleteActivity(id);
        Swal.fire({ icon: 'success', title: 'ลบกิจกรรมแล้ว', timer: 1000, showConfirmButton: false });
        loadAdminActivities();
        loadActivities(); // refresh user view too
    } catch (e) {
        Swal.fire('ผิดพลาด', e.message, 'error');
    }
}

async function loadAdminIncidents() {
    const list = document.getElementById('adminIncidentList');
    if (!list) return;
    list.innerHTML = '<div class="p-8 text-center">กำลังโหลด...</div>';
    try {
        const incidents = await apiService.getAllIncidents();
        if (!incidents || incidents.length === 0) {
            list.innerHTML = '<div class="p-8 text-center text-gray-400 bg-white rounded-xl">ไม่มีเหตุการณ์ฉุกเฉิน</div>';
            return;
        }
        const typeColors = {
            fall: 'bg-red-100 text-red-700',
            sos:  'bg-orange-100 text-orange-700'
        };
        const typeLabels = {
            fall: '🚨 ล้มหกล้ม',
            sos:  '🆘 กดปุ่ม SOS'
        };
        list.innerHTML = incidents.map(inc => `
            <div class="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center mb-2">
                <div class="flex items-center gap-4">
                    <div class="text-3xl">${inc.type === 'sos' ? '🆘' : '🚨'}</div>
                    <div>
                        <p class="font-bold text-gray-800">${typeLabels[inc.type] || inc.type}</p>
                        <p class="text-sm text-gray-500">ผู้ใช้: ${inc.elderlyId} | สถานที่: ${inc.location}</p>
                        <p class="text-xs text-gray-400">${new Date(inc.createdAt).toLocaleString('th-TH')}</p>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold ${typeColors[inc.type] || 'bg-gray-100 text-gray-600'}">
                    ${typeLabels[inc.type] || inc.type}
                </span>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = `<div class="p-8 text-center text-red-500 bg-white rounded-xl">Error: ${e.message}</div>`;
    }
}


async function handleSendNotification(e) {
    e.preventDefault();
    const elderlyId = document.getElementById('notif-target').value;
    const title = document.getElementById('notif-title').value;
    const message = document.getElementById('notif-message').value;

    try {
        Swal.fire({ title: 'กำลังส่ง...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await apiService.sendNotification({ elderlyId, title, message });
        
        Swal.fire('สำเร็จ', 'ส่งจดหมายแจ้งเตือนเรียบร้อยแล้ว', 'success');
        document.getElementById('notif-title').value = '';
        document.getElementById('notif-message').value = '';
    } catch (err) {
        Swal.fire('ผิดพลาด', err.message || 'ไม่สามารถส่งได้', 'error');
    }
}

// Run admin check on startup if user is already logged in
if (state.currentUser) {
    checkAdminAccess();
}