/**
 * --- ADAPTER PATTERN (Real World Implementation) ---
 * * ความท้าทายของระบบจริง:
 * 1. เป็น Asynchronous (ต้องรอ Network) -> เราต้องเปลี่ยน Interface เป็น Promise (async/await)
 * 2. ต้องโหลด SDK จากภายนอก -> เราจะทำ Dynamic Script Loading
 * 3. ข้อมูลที่ได้ต้อง Decode -> เราต้องมีตัวแกะข้อมูล
 */

// ==========================================
// PART 1: UTILS & MOCK SERVICES
// ==========================================

// Helper function: โหลด Script ของ Google/Facebook แบบ Dynamic
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Mock Services (จำลองความหน่วง Network)
const MockGoogleSDK = {
    signIn: () => new Promise(resolve => {
        setTimeout(() => {
            console.log("Calling Mock Google API...");
            resolve({ 
                sub: "mock_google_123", 
                given_name: "สมชาย (Mock)", 
                picture: "https://via.placeholder.com/150" 
            });
        }, 1000); // รอ 1 วินาที
    })
};

const MockLineSDK = {
    login: () => new Promise(resolve => {
        setTimeout(() => {
            console.log("Calling Mock Line API...");
            resolve({ 
                userId: "mock_line_456", 
                displayName: "คุณตาสมชาย รักสุขภาพ", 
            });
        }, 1000);
    })
};

const MockFacebookSDK = {
    login: () => new Promise(resolve => {
        setTimeout(() => {
            console.log("Calling Mock Facebook API...");
            resolve({ id: "mock_fb_789", name: "Somchai Happy" });
        }, 1000);
    })
};

// ==========================================
// PART 2: ADAPTERS (The Real Deal)
// ==========================================

// --- 2.1 Google Adapter (Real Implementation) ---
class RealGoogleAuthAdapter {
    constructor() {
        this.clientId = '414923537312-9p4pq130r1qua8irb23q70naca2od21t.apps.googleusercontent.com'; // <--- เอา Client ID จาก Google Cloud มาใส่ตรงนี้!!!
        this.scriptUrl = 'https://accounts.google.com/gsi/client';
    }

    async login() {
        // 1. โหลด Google Identity Services SDK
        await loadScript(this.scriptUrl);

        return new Promise((resolve, reject) => {
            // 2. ตั้งค่า Client
            const client = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: 'https://www.googleapis.com/auth/userinfo.profile',
                callback: async (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        // 3. เอา Token ไปขอข้อมูล User (UserInfo Endpoint)
                        try {
                            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                            }).then(res => res.json());

                            // 4. แปลงร่างข้อมูล (Adapt)
                            resolve({
                                id: userInfo.sub,
                                name: userInfo.given_name || userInfo.name,
                                role: 'user',
                                provider: 'Google (Real)'
                            });
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        reject("Google Login Failed");
                    }
                },
            });

            // 3. สั่งให้เด้ง Popup
            client.requestAccessToken();
        });
    }
}

class RealFacebookAuthAdapter {
    constructor() {
        // *** ใส่ App ID ของ Facebook ตรงนี้ ***
        this.appId = '2376106599539939'; 
        this.scriptUrl = 'https://connect.facebook.net/en_US/sdk.js';
    }

    async login() {
        // 1. โหลด Facebook SDK
        if (!window.FB) {
            await loadScript(this.scriptUrl);
        }

        return new Promise((resolve, reject) => {
            // 2. Init SDK
            window.FB.init({
                appId: this.appId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });

            // 3. เรียก Login Popup
            window.FB.login((response) => {
                if (response.authResponse) {
                    // 4. ถ้า Login สำเร็จ ให้ขอข้อมูล User (Graph API)
                    window.FB.api('/me', { fields: 'id,name,email' }, (userInfo) => {
                        resolve({
                            id: userInfo.id,
                            name: userInfo.name,
                            role: 'user',
                            provider: 'Facebook (Real)'
                        });
                    });
                } else {
                    reject("ยกเลิกการเชื่อมต่อ Facebook หรือเกิดข้อผิดพลาด");
                }
            }, { scope: 'public_profile,email' });
        });
    }
}

// --- 2.2 Mock Adapters (สำหรับคนที่ยังไม่มี Key) ---
class MockGoogleAuthAdapter {
    async login() {
        const data = await MockGoogleSDK.signIn();
        return {
            id: data.sub,
            name: data.given_name,
            role: 'user',
            provider: 'Google (Mock)'
        };
    }
}

class MockLineAuthAdapter {
    async login() {
        const data = await MockLineSDK.login();
        return {
            id: data.userId,
            name: data.displayName,
            role: 'user',
            provider: 'Line (Mock)'
        };
    }
}

class MockFacebookAuthAdapter {
    async login() {
        const data = await MockFacebookSDK.login();
        return {
            id: data.id,
            name: data.name,
            role: 'user',
            provider: 'Facebook (Mock)'
        };
    }
}

// ==========================================
// PART 3: FACTORY
// ==========================================
class AuthFactory {
    static getAdapter(providerName) {
        switch(providerName) {
            case 'google':
                // *** ถ้าคุณเอา Client ID มาใส่แล้ว ให้เปลี่ยนบรรทัดล่างเป็น: return new RealGoogleAuthAdapter();
                return new RealGoogleAuthAdapter(); 
                // return new RealGoogleAuthAdapter(); // <--- เปิดบรรทัดนี้เพื่อใช้ของจริง!
            
            case 'line': 
                return new MockLineAuthAdapter(); // Line ของจริงต้องทำ LIFF หรือ Redirect ยุ่งยาก ใช้ Mock ไปก่อน
            
            case 'facebook': 
                return new RealFacebookAuthAdapter();
            
            default: 
                throw new Error("Unknown provider");
        }
    }
}