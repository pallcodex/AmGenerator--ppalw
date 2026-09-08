// Inisialisasi AOS dengan animasi yang lebih halus
AOS.init({
    duration: 700,
    easing: 'ease-out-cubic',
    once: true,
    offset: 40
});

// Animasi Particle Snow
const canvas = document.getElementById('snow');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

const numFlakes = 45;
const flakes = Array.from({ length: numFlakes }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 3 + 1,
    d: Math.random() * 1 + 0.5
}));

function drawSnow() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    for (let f of flakes) {
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
    }
    ctx.fill();
    for (let f of flakes) {
        f.y += Math.pow(f.r, 0.8) * 0.6;
        f.x += Math.sin(f.y / 30) * 0.5;
        if (f.y > height) {
            f.y = -5;
            f.x = Math.random() * width;
        }
    }
}
setInterval(drawSnow, 30);

// --- MANAJEMEN USER LOGIN, AVATAR & JAM REAL-TIME ---
const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%23000000' viewBox='0 0 24 24'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
let tempAvatarBase64 = DEFAULT_AVATAR_SVG;

function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxSize = 200;
                let w = img.width;
                let h = img.height;

                if (w > h) {
                    if (w > maxSize) {
                        h *= maxSize / w;
                        w = maxSize;
                    }
                } else {
                    if (h > maxSize) {
                        w *= maxSize / h;
                        h = maxSize;
                    }
                }

                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);

                tempAvatarBase64 = canvas.toDataURL('image/jpeg', 0.8);
                document.getElementById('avatarPreviewImg').src = tempAvatarBase64;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleLogin() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
        alert('Silakan masukkan username terlebih dahulu!');
        return;
    }
    try {
        localStorage.setItem('am_username', username);
        localStorage.setItem('am_avatar', tempAvatarBase64);
    } catch (e) {
        console.warn('Gagal menyimpan ke localStorage:', e);
    }
    checkAuth();
}

function handleLogout() {
    localStorage.removeItem('am_username');
    localStorage.removeItem('am_avatar');
    checkAuth();
}

function renderHeaderOnce() {
    const username = localStorage.getItem('am_username');
    if (!username) return;

    const headerContainer = document.getElementById('header-container');
    const avatar = localStorage.getItem('am_avatar') || DEFAULT_AVATAR_SVG;

    headerContainer.innerHTML = `
        <div class="header-info" data-aos="fade-down" data-aos-duration="600">
            <div class="user-profile-display">
                <img src="${avatar}" class="user-avatar-small" alt="">
                <div>
                    <div class="greeting-text" id="greetingText"></div>
                    <button class="btn-logout" onclick="handleLogout()">Keluar</button>
                </div>
            </div>
            <div class="live-clock" id="liveClock"></div>
        </div>
    `;
    setTimeout(() => AOS.refresh(), 50);
}

function updateClockAndGreeting() {
    const username = localStorage.getItem('am_username');
    const clockEl = document.getElementById('liveClock');
    const greetingEl = document.getElementById('greetingText');

    if (!username || !clockEl || !greetingEl) return;

    const now = new Date();
    const hours = now.getHours();
    let timeGreet = 'Pagi';
    if (hours >= 11 && hours < 15) timeGreet = 'Siang';
    else if (hours >= 15 && hours < 18) timeGreet = 'Sore';
    else if (hours >= 18 || hours < 4) timeGreet = 'Malam';

    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    greetingEl.textContent = `Selamat ${timeGreet}, ${username}!`;
    clockEl.textContent = timeString;
}

function checkAuth() {
    const username = localStorage.getItem('am_username');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const headerContainer = document.getElementById('header-container');

    if (!username) {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        headerContainer.innerHTML = '';
    } else {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        renderHeaderOnce();
        updateClockAndGreeting();
    }

    setTimeout(() => AOS.refresh(), 100);
}

setInterval(updateClockAndGreeting, 1000);

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// --- INTEGRASI BACKEND API BARU ---
const API_BASE = 'https://motionapi.justlann.my.id/api';
const statusDiv = document.getElementById('status');

async function sendMagicLink() {
    const email = document.getElementById('email').value.trim();
    if (!email) return statusDiv.innerText = 'Masukkan email terlebih dahulu!';

    statusDiv.innerText = 'Mengirim Magic Link...';
    try {
        const res = await fetch(`${API_BASE}/send?email=${encodeURIComponent(email)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.status === false || data.error) {
            statusDiv.innerText = data.message || data.error || 'Gagal mengirim magic link dari server.';
        } else {
            statusDiv.innerText = data.message || 'Magic link berhasil dikirim ke email!';
        }
    } catch (err) {
        console.error(err);
        statusDiv.innerText = 'Gagal terhubung ke API (Masalah Koneksi/CORS).';
    }
}

async function verifyPremium() {
    const email = document.getElementById('email').value.trim();
    const magicLink = document.getElementById('magicLink').value.trim();
    if (!email || !magicLink) return statusDiv.innerText = 'Isi email dan Magic Link!';

    statusDiv.innerText = 'Memverifikasi Magic Link...';
    try {
        const res = await fetch(`${API_BASE}/verif`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                magicLink: magicLink,
                orderId: 'OnlyyLann'
            })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.status === false || data.error) {
            statusDiv.innerText = data.message || data.error || 'Verifikasi gagal. Periksa kembali link Anda.';
        } else {
            statusDiv.innerText = '';
            document.getElementById('main-forms').classList.add('hidden');
            document.getElementById('success-box').classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        statusDiv.innerText = 'Gagal memverifikasi ke API (Masalah Koneksi/CORS).';
    }
}

function resetForm() {
    document.getElementById('email').value = '';
    document.getElementById('magicLink').value = '';
    statusDiv.innerText = '';
    document.getElementById('main-forms').classList.remove('hidden');
    document.getElementById('success-box').classList.add('hidden');
}
