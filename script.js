const CONFIG = {
    routeLength: 1000,
    stops: [
        { id: 'mulu', name: 'Kolej Seri Mulu', x: 80, y: 80, p: 0 },
        { id: 'gading', name: 'Kolej Seri Gading', x: 320, y: 80, p: 240 },
        { id: 'UiTM', name: 'UiTM KS2', x: 320, y: 220, p: 380 },
        { id: 'Mall', name: 'The SummerMall', x: 80, y: 220, p: 620 }
    ]
};

const app = {
    // State
    balance: 5.00,
    busPos: 0,
    speed: 3,
    isTraffic: false,
    announcements: [],
    isDark: false,

    init: function () {
        this.loadData();
        this.renderBalance();
        this.renderAnnouncements();
        this.startSimulation();
        this.loadTheme();
    },

    // --- THEMING ---
    toggleTheme: function (isDark) {
        this.isDark = isDark;
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('themeLabel').innerText = "ON";
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.getElementById('themeLabel').innerText = "OFF";
        }
        localStorage.setItem('shuttle_theme', isDark ? 'dark' : 'light');
    },

    loadTheme: function () {
        const savedTheme = localStorage.getItem('shuttle_theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Default to saved preference, or system preference if not saved
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.getElementById('themeToggle').checked = true;
            this.toggleTheme(true);
        }
    },

    // --- NAVIGATION ---
    navTo: function (viewId) {
        // 1. Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        // 2. Show target
        document.getElementById(`view-${viewId}`).classList.add('active');
        // 3. Update Bottom Nav Icons
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-${viewId}`).classList.add('active');
    },

    // --- WALLET & PAYMENT ---
    renderBalance: function () {
        const val = this.balance.toFixed(2);
        document.getElementById('headerBalance').innerText = val;
        document.getElementById('walletBalance').innerText = val;
        localStorage.setItem('shuttle_balance', this.balance);
    },

    openTopUpModal: function () {
        document.getElementById('topUpModal').classList.add('open');
    },

    closeModal: function () {
        document.getElementById('topUpModal').classList.remove('open');
    },

    processTopUp: function (amount) {
        // Simulate banking delay
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "Processing...";

        setTimeout(() => {
            this.balance += amount;
            this.addTransaction(`Top Up via Online Banking`, `+ RM ${amount.toFixed(2)}`);
            this.renderBalance();
            this.closeModal();
            btn.innerText = originalText;
            alert(`Top up of RM ${amount} successful!`);
        }, 800);
    },

    simulateScan: function () {
        if (this.balance < 2.00) {
            alert("Insufficient Balance! Please top up.");
            return;
        }

        const feedback = document.getElementById('paymentFeedback');
        feedback.innerText = "Processing Payment...";

        setTimeout(() => {
            this.balance -= 2.00;
            this.renderBalance();
            this.addTransaction("Shuttle Ride (Line A)", "- RM 2.00");
            feedback.innerText = "✅ Payment Successful!";
            setTimeout(() => feedback.innerText = "", 3000);
        }, 1000);
    },

    addTransaction: function (desc, amountStr) {
        const list = document.getElementById('transactionList');
        const li = document.createElement('li');
        li.style.cssText = "padding:8px 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between; animation:fadeIn 0.5s;";
        li.innerHTML = `<span>${desc}</span> <span style="${amountStr.includes('+') ? 'color:green' : 'color:red'}">${amountStr}</span>`;
        list.prepend(li);
    },

    // --- SIMULATION ENGINE ---
    startSimulation: function () {
        setInterval(() => {
            // Move bus
            const currentSpeed = this.isTraffic ? 1 : this.speed;
            this.busPos += currentSpeed;
            if (this.busPos > CONFIG.routeLength) this.busPos = 0;

            this.drawBus();

            // Update ETA every second (~20 ticks)
            if (Math.floor(this.busPos) % 20 === 0) this.updateETA();

        }, 50); // 20 updates per second
    },

    drawBus: function () {
        // Rectangular Logic: Top(0-240) -> Right(240-380) -> Bottom(380-620) -> Left(620-860)
        // Coordinates: TopL(80,80), TopR(320,80), BotR(320,220), BotL(80,220)

        let x, y;
        const p = this.busPos;

        if (p < 240) { // Top
            x = 80 + p; y = 80;
        } else if (p < 380) { // Right
            x = 320; y = 80 + (p - 240);
        } else if (p < 620) { // Bottom
            x = 320 - (p - 380); y = 220;
        } else { // Left (Returning)
            x = 80; y = 220 - (p - 620);
            // Cap at start point
            if (y < 80) y = 80;
        }

        const bus = document.getElementById('busMarker');
        bus.setAttribute('transform', `translate(${x}, ${y})`);
    },

    updateETA: function () {
        const container = document.getElementById('etaContainer');
        let html = '';

        CONFIG.stops.forEach(stop => {
            let dist = stop.p - this.busPos;
            if (dist < 0) dist += CONFIG.routeLength;

            // Speed factor: 100 units = ~1 minute
            const factor = this.isTraffic ? 20 : 10;
            let mins = Math.ceil(dist / (this.speed * factor));

            if (mins <= 0) mins = "Arriving";
            else mins += " min";

            html += `
                <div class="eta-card">
                    <div style="font-size:1.5rem; font-weight:bold; color:var(--text-dark);">${mins}</div>
                    <div style="font-size:0.8rem; color:var(--text-sub);">${stop.name}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    // --- ADMIN & DATA ---
    toggleAdminMode: function (isActive) {
        const consoleDiv = document.getElementById('adminConsole');
        const label = document.getElementById('adminLabel');

        if (isActive) {
            consoleDiv.classList.remove('hidden');
            label.innerText = "ON";
            label.style.color = "red";
        } else {
            consoleDiv.classList.add('hidden');
            label.innerText = "OFF";
            label.style.color = "var(--uitm-purple)";
        }
    },

    setTraffic: function (isTraffic) {
        this.isTraffic = isTraffic;
        const indicator = document.getElementById('speedIndicator');
        if (isTraffic) {
            indicator.innerText = "Traffic Jam (Slow)";
            indicator.style.color = "red";
        } else {
            indicator.innerText = "Normal Traffic";
            indicator.style.color = "#333";
        }
    },

    postAnnouncement: function () {
        const input = document.getElementById('adminMsg');
        if (!input.value) return;

        this.announcements.unshift({ text: input.value, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        this.renderAnnouncements();
        input.value = "";
        alert("Announcement Posted");
    },

    renderAnnouncements: function () {
        const container = document.getElementById('announcementFeed');
        if (this.announcements.length === 0) {
            container.innerHTML = `<div class="card" style="color:var(--text-sub); text-align:center;">No recent announcements.</div>`;
            return;
        }
        let html = '';
        this.announcements.forEach(a => {
            html += `
            <div class="card" style="margin-top:10px; border-left:4px solid #FFD100;">
                <div style="font-size:0.75rem; color:var(--text-sub);">Admin • ${a.time}</div>
                <div style="color:var(--text-dark);">${a.text}</div>
            </div>`;
        });
        container.innerHTML = html;
    },

    loadData: function () {
        const bal = localStorage.getItem('shuttle_balance');
        if (bal) this.balance = parseFloat(bal);
    }
};

// Init
window.addEventListener('DOMContentLoaded', () => app.init());