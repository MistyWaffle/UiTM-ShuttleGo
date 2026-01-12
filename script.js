const CONFIG = {
    routeLength: 1000,
    stops: [
        { id: 'mulu', name: 'Kolej Seri Mulu', x: 80, y: 80, p: 0 },
        { id: 'gading', name: 'Kolej Seri Gading', x: 320, y: 80, p: 240 },
        { id: 'UiTM', name: 'UiTM KS2', x: 320, y: 220, p: 380 },
        { id: 'Mall', name: 'The SummerMall', x: 80, y: 220, p: 620 }
    ],
    avatars: ['👤', '👩‍🎓', '👨‍🎓', '😸', '👽', '🦊']
};

const app = {
    // State
    balance: 5.00,
    busPos: 0,
    speed: 3,
    isTraffic: false,
    announcements: [],
    transactions: [
        { id: 1, desc: 'Initial Bonus', amount: 5.00, type: 'in', date: new Date() }
    ],
    avatarIndex: 0,

    init: function () {
        this.loadData();
        this.renderBalance();
        this.renderAnnouncements();
        this.renderTransactions('all');
        this.startSimulation();
        this.handleLoadingScreen();
    },

    // --- UTILS: TOAST ---
    showToast: function(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';

        toast.innerHTML = `<span style="font-size:1.2rem;">${icon}</span> <span>${msg}</span>`;
        container.appendChild(toast);

        // Remove after 3s
        setTimeout(() => {
            toast.style.animation = 'fadeOutUp 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- LOADING SCREEN ---
    handleLoadingScreen: function() {
        setTimeout(() => {
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.classList.add('fade-out');
                setTimeout(() => {
                    loader.remove(); // Remove from DOM to cleanup
                }, 500); // Wait for transition to finish
            }
        }, 2000); // Show logo for 2 seconds
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
        // Get source
        const sourceSelect = document.getElementById('topUpSource');
        const sourceName = sourceSelect ? sourceSelect.value : 'Online Banking';

        // Simulate banking delay
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "Processing...";

        setTimeout(() => {
            this.balance += amount;
            this.addTransaction(`Top Up via ${sourceName}`, amount, 'in');
            this.renderBalance();
            this.closeModal();
            btn.innerText = originalText;
            this.showToast(`Top up of RM ${amount} successful!`, 'success');
        }, 800);
    },

    processCustomTopUp: function() {
        const input = prompt("Enter amount to Top Up (RM):", "10");
        if (input) {
            const amount = parseFloat(input);
            if (!isNaN(amount) && amount > 0) {
                this.processTopUp(amount);
            } else {
                this.showToast("Invalid amount entered.", 'error');
            }
        }
    },

    handleStopClick: function(stopName) {
        // Show info in toast instead of alert
        this.showToast(`Stop: ${stopName} is Active`, 'info');
    },

    refreshQR: function() {
        const qr = document.querySelector('.qr-container svg');
        if(qr) {
            qr.style.opacity = '0.5';
            setTimeout(() => {
                qr.style.opacity = '1';
                this.showToast("QR Code Refreshed!", 'success');
            }, 500);
        }
    },

    // --- PROFILE ---
    editProfile: function(field = 'name') {
        const currentText = field === 'name' ? 
            document.querySelector('#view-profile .card-title').innerText : 
            document.getElementById('profileFaculty').innerText.replace(' ✎', '');

        const input = prompt(`Edit ${field === 'name' ? 'Name' : 'Faculty'}:`, currentText);
        
        if(input) {
            if(field === 'name') {
                document.querySelector('#view-profile .card-title').innerText = input;
            } else {
                document.getElementById('profileFaculty').innerText = input + ' ✎';
            }
            this.showToast("Profile Updated!", 'success');
        }
    },

    changeAvatar: function() {
        this.avatarIndex = (this.avatarIndex + 1) % CONFIG.avatars.length;
        document.getElementById('profileAvatar').innerText = CONFIG.avatars[this.avatarIndex];
    },

    // --- SCHEDULE ---
    toggleReminder: function(row, stopName) {
        row.classList.toggle('reminder-active');
        const isActive = row.classList.contains('reminder-active');
        
        if(isActive) {
            this.showToast(`Reminder set for ${stopName}`, 'success');
        } else {
            this.showToast(`Reminder removed for ${stopName}`, 'info');
        }
    },

    simulateScan: function () {
        if (this.balance < 2.00) {
            this.showToast("Insufficient Balance! Please top up.", 'error');
            return;
        }

        const feedback = document.getElementById('paymentFeedback');
        feedback.innerText = "Processing Payment...";

        setTimeout(() => {
            this.balance -= 2.00;
            this.renderBalance();
            this.addTransaction("Shuttle Ride (Line A)", 2.00, 'out');
            feedback.innerText = "✅ Payment Successful!";
            this.showToast("Payment Successful - RM 2.00", 'success');
            setTimeout(() => feedback.innerText = "", 3000);
        }, 1000);
    },

    addTransaction: function (desc, amount, type) {
        this.transactions.unshift({
            id: Date.now(),
            desc: desc,
            amount: amount,
            type: type, // 'in' or 'out'
            date: new Date()
        });
        this.renderTransactions('all');
    },

    filterTransactions: function(filterType, tabElement) {
        // Update tabs
        if(tabElement) {
            document.querySelectorAll('.filter-tab').forEach(el => el.classList.remove('active'));
            tabElement.classList.add('active');
        }
        this.renderTransactions(filterType);
    },

    renderTransactions: function(filterType) {
        const list = document.getElementById('transactionList');
        list.innerHTML = '';

        const filtered = this.transactions.filter(t => filterType === 'all' || t.type === filterType);

        if(filtered.length === 0) {
            list.innerHTML = `<li style="padding:15px; text-align:center; color:#ccc;">No transactions found.</li>`;
            return;
        }

        filtered.forEach(t => {
            const li = document.createElement('li');
            li.style.cssText = "padding:8px 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between; animation:fadeIn 0.5s;";
            const color = t.type === 'in' ? 'green' : 'red';
            const sign = t.type === 'in' ? '+' : '-';
            li.innerHTML = `<span>${t.desc}</span> <span style="color:${color}; font-weight:bold;">${sign} RM ${t.amount.toFixed(2)}</span>`;
            list.appendChild(li);
        });
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

        CONFIG.stops.forEach((stop, index) => {
            let dist = stop.p - this.busPos;
            if (dist < 0) dist += CONFIG.routeLength;

            // Speed factor: 100 units = ~1 minute
            const factor = this.isTraffic ? 20 : 10;
            let mins = Math.ceil(dist / (this.speed * factor));

            if (mins <= 0) mins = "Arriving";
            else mins += " min";

            const isLast = index === CONFIG.stops.length - 1;
            const borderStyle = isLast ? '' : 'border-bottom:1px solid #eee;';

            html += `
                <li style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; ${borderStyle}">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:10px; height:10px; background:var(--uitm-green); border-radius:50%;"></div>
                        <span style="color:var(--text-dark); font-weight:500;">${stop.name}</span>
                    </div>
                    <div style="font-weight:bold; color:var(--uitm-purple); font-size:1.1rem;">${mins}</div>
                </li>
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
            this.showToast("Admin Mode Activated", 'error');
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
            this.showToast("Traffic status set to: JAM", 'error');
        } else {
            indicator.innerText = "Normal Traffic";
            indicator.style.color = "#333";
            this.showToast("Traffic status set to: NORMAL", 'success');
        }
    },

    postAnnouncement: function () {
        const input = document.getElementById('adminMsg');
        if (!input.value) return;

        this.announcements.unshift({ text: input.value, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        this.renderAnnouncements();
        input.value = "";
        this.showToast("Announcement Posted", 'success');
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

    // --- CHAT LOGIC ---
    fillChat: function(msg) {
        const input = document.getElementById('chatInput');
        input.value = msg;
        this.sendChat();
    },

    sendChat: function() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        // User Message
        this.addChatBubble(text, false);
        input.value = "";

        // Auto Response
        this.showTyping();
        setTimeout(() => {
            this.removeTyping();
            const response = this.generateResponse(text);
            this.addChatBubble(response, true);
        }, 1000 + Math.random() * 1000);
    },

    addChatBubble: function(text, isBot) {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = `chat-bubble ${isBot ? 'bot' : ''}`;
        div.innerText = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    showTyping: function() {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.id = 'typingIndicator';
        div.className = 'chat-bubble bot';
        div.style.fontStyle = 'italic';
        div.style.opacity = '0.7';
        div.innerText = "Uncle Bus is typing...";
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    removeTyping: function() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    },

    generateResponse: function(msg) {
        msg = msg.toLowerCase();

        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            return "Hello! Hop on, the aircond is cold today! ❄️";
        }
        if (msg.includes('where') || msg.includes('location') || msg.includes('arrive')) {
            // Find nearest stop
            const nearest = CONFIG.stops.reduce((prev, curr) => {
                return (Math.abs(curr.p - this.busPos) < Math.abs(prev.p - this.busPos) ? curr : prev);
            });
            return `I'm currently near ${nearest.name}. Driving safely! 🚌`;
        }
        if (msg.includes('schedule') || msg.includes('time') || msg.includes('when') || msg.includes('next')) {
            return "I loop every 20-30 minutes. Check the 'Schedule' tab for exact times!";
        }
        if (msg.includes('traffic') || msg.includes('jam')) {
            return this.isTraffic ? "Aiyoo, very jam today! 🚦" : "Smooth roads ahead! No jam.";
        }
        if (msg.includes('balance') || msg.includes('money') || msg.includes('pay')) {
            return `Your balance is RM ${this.balance.toFixed(2)}. Don't forget to scan!`;
        }
        if (msg.includes('bye')) {
            return "Bye bye! Study hard!";
        }

        const defaults = [
            "I'm just driving, ask me about the schedule.",
            "Please stand behind the yellow line.",
            "Don't forget your student ID card!",
            "Did you scan your QR code?"
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
    },

    previousView: 'tracker',

    generateStudentReport: function() {
        if (this.transactions.length === 0) {
            this.showToast("No transactions to report.", 'error');
            return;
        }

        this.previousView = 'pay'; // Logic assumes we come from pay view
        document.getElementById('reportTitle').innerText = "Student Financial Report";
        
        let html = `
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                <thead style="background:var(--bg-neutral); text-align:left;">
                    <tr>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Date</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Description</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Type</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc; text-align:right;">Amount (RM)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.transactions.forEach(t => {
            const date = new Date(t.date).toLocaleString();
            const color = t.type === 'in' ? 'green' : 'red';
            html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">${date}</td>
                    <td style="padding:10px;">${t.desc}</td>
                    <td style="padding:10px;"><span class="badge ${t.type === 'in' ? 'badge-student' : 'badge-admin'}">${t.type.toUpperCase()}</span></td>
                    <td style="padding:10px; text-align:right; font-weight:bold; color:${color};">${t.amount.toFixed(2)}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        
        document.getElementById('reportContent').innerHTML = html;
        this.navTo('report');
    },

    generateRevenueReport: function() {
        this.previousView = 'profile'; // Logic assumes we come from profile/admin view
        document.getElementById('reportTitle').innerText = "Admin Revenue Report (7 Days)";

        let html = `
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                <thead style="background:var(--bg-neutral); text-align:left;">
                    <tr>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Date</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc; text-align:center;">Total Riders</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc; text-align:right;">Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        const today = new Date();
        let totalRev = 0;
        let totalRiders = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString();
            
            // Random mock values
            const riders = Math.floor(Math.random() * (500 - 100) + 100);
            const revenue = riders * 2.00;
            
            totalRiders += riders;
            totalRev += revenue;

            html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">${dateStr}</td>
                    <td style="padding:10px; text-align:center;">${riders}</td>
                    <td style="padding:10px; text-align:right;">RM ${revenue.toFixed(2)}</td>
                </tr>
            `;
        }

        // Footer Total
        html += `
            <tr style="background:var(--bg-neutral); font-weight:bold;">
                <td style="padding:10px;">TOTAL</td>
                <td style="padding:10px; text-align:center;">${totalRiders}</td>
                <td style="padding:10px; text-align:right;">RM ${totalRev.toFixed(2)}</td>
            </tr>
        `;

        html += `</tbody></table>`;

        document.getElementById('reportContent').innerHTML = html;
        this.navTo('report');
    },

    closeReport: function() {
        this.navTo(this.previousView);
    },

    loadData: function () {
        const bal = localStorage.getItem('shuttle_balance');
        if (bal) this.balance = parseFloat(bal);
    }
};

// Init
window.addEventListener('DOMContentLoaded', () => app.init());