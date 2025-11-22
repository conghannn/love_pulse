// LDR情绪表达仪表板 - JavaScript功能实现

class LDRMoodDashboard {
    constructor() {
        this.currentMood = null;
        this.partnerMood = null;
        this.moodHistory = JSON.parse(localStorage.getItem('moodHistory')) || [];
        this.settings = JSON.parse(localStorage.getItem('dashboardSettings')) || {
            partnerName: 'Ta',
            notifications: true,
            theme: 'light',
            autoSave: true,
            roomId: localStorage.getItem('roomId') || 'default-room',
            userId: localStorage.getItem('userId') || (Math.random() > 0.5 ? 'user1' : 'user2')
        };
        this.stats = JSON.parse(localStorage.getItem('moodStats')) || {
            messages: 0,
            hugs: 0,
            kisses: 0,
            moodCounts: {}
        };
        
        // API configuration
        this.apiBaseUrl = window.location.origin;
        this.syncInterval = null;
        this.lastSyncTime = null;
        
        // Debounce timestamps for preventing rapid clicks
        this.lastClickTime = {};
        this.clickDebounceMs = 2000; // 2 second debounce
        this.isProcessing = false; // Global processing lock
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.loadDataFromServer();
        this.updateStats();
        this.renderHistory();
        this.initChart();
        this.startTimeUpdates();
        this.startSyncInterval();
        
        // 显示欢迎通知
        this.showNotification('💕', '欢迎使用LDR情绪表达仪表板！', 'success');
    }

    setupEventListeners() {
        // 情绪选择按钮 - use event delegation to prevent multiple listeners
        const moodOptionsContainer = document.getElementById('moodOptions');
        if (moodOptionsContainer && !moodOptionsContainer.dataset.listenerAttached) {
            moodOptionsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.mood-btn');
                if (btn && btn.dataset.processing !== 'true') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectMood(btn);
                }
            });
            moodOptionsContainer.dataset.listenerAttached = 'true';
        }

        // 发送情绪按钮 - prevent multiple clicks with robust debouncing
        const sendMoodBtn = document.getElementById('sendMoodBtn');
        if (sendMoodBtn && !sendMoodBtn.dataset.listenerAttached) {
            const handleClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const now = Date.now();
                const lastClick = this.lastClickTime['sendMood'] || 0;
                const timeSinceLastClick = now - lastClick;
                
                // Strict debounce check - must wait full debounce period
                if (timeSinceLastClick < this.clickDebounceMs) {
                    console.log(`Debounced: ${timeSinceLastClick}ms since last click`);
                    return false;
                }
                
                // Check global processing lock
                if (this.isProcessing || this.sendingMood) {
                    console.log('Already processing, ignoring click');
                    return false;
                }
                
                // Check button state
                if (sendMoodBtn.disabled) {
                    return false;
                }
                
                // Lock everything immediately
                this.isProcessing = true;
                this.sendingMood = true;
                this.lastClickTime['sendMood'] = now;
                
                // Disable button immediately
                sendMoodBtn.disabled = true;
                sendMoodBtn.style.opacity = '0.6';
                sendMoodBtn.style.cursor = 'not-allowed';
                sendMoodBtn.style.pointerEvents = 'none';
                
                // Execute the action
                this.sendMood().finally(() => {
                    // Re-enable after a delay
                    setTimeout(() => {
                        this.isProcessing = false;
                        sendMoodBtn.disabled = false;
                        sendMoodBtn.style.opacity = '1';
                        sendMoodBtn.style.cursor = 'pointer';
                        sendMoodBtn.style.pointerEvents = 'auto';
                    }, 500);
                });
                
                return false;
            };
            
            sendMoodBtn.addEventListener('click', handleClick, { passive: false });
            sendMoodBtn.dataset.listenerAttached = 'true';
        }

        // 响应按钮 - prevent multiple clicks with robust debouncing
        const sendHugBtn = document.getElementById('sendHugBtn');
        if (sendHugBtn && !sendHugBtn.dataset.listenerAttached) {
            const handleHugClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const now = Date.now();
                const lastClick = this.lastClickTime['sendHug'] || 0;
                const timeSinceLastClick = now - lastClick;
                
                // Strict debounce check
                if (timeSinceLastClick < this.clickDebounceMs) {
                    return false;
                }
                
                // Check global processing lock
                if (this.isProcessing || this.sendingResponse) {
                    return false;
                }
                
                // Check button state
                if (sendHugBtn.disabled) {
                    return false;
                }
                
                // Lock everything immediately
                this.isProcessing = true;
                this.sendingResponse = true;
                this.lastClickTime['sendHug'] = now;
                
                // Disable button immediately
                sendHugBtn.disabled = true;
                sendHugBtn.style.opacity = '0.6';
                sendHugBtn.style.cursor = 'not-allowed';
                sendHugBtn.style.pointerEvents = 'none';
                
                // Execute the action
                this.sendResponse('hug', '🤗', '发送了一个温暖的拥抱').finally(() => {
                    setTimeout(() => {
                        this.isProcessing = false;
                        sendHugBtn.disabled = false;
                        sendHugBtn.style.opacity = '1';
                        sendHugBtn.style.cursor = 'pointer';
                        sendHugBtn.style.pointerEvents = 'auto';
                    }, 500);
                });
                
                return false;
            };
            
            sendHugBtn.addEventListener('click', handleHugClick, { passive: false });
            sendHugBtn.dataset.listenerAttached = 'true';
        }

        const sendKissBtn = document.getElementById('sendKissBtn');
        if (sendKissBtn && !sendKissBtn.dataset.listenerAttached) {
            const handleKissClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const now = Date.now();
                const lastClick = this.lastClickTime['sendKiss'] || 0;
                const timeSinceLastClick = now - lastClick;
                
                // Strict debounce check
                if (timeSinceLastClick < this.clickDebounceMs) {
                    return false;
                }
                
                // Check global processing lock
                if (this.isProcessing || this.sendingResponse) {
                    return false;
                }
                
                // Check button state
                if (sendKissBtn.disabled) {
                    return false;
                }
                
                // Lock everything immediately
                this.isProcessing = true;
                this.sendingResponse = true;
                this.lastClickTime['sendKiss'] = now;
                
                // Disable button immediately
                sendKissBtn.disabled = true;
                sendKissBtn.style.opacity = '0.6';
                sendKissBtn.style.cursor = 'not-allowed';
                sendKissBtn.style.pointerEvents = 'none';
                
                // Execute the action
                this.sendResponse('kiss', '💋', '发送了一个甜蜜的亲亲').finally(() => {
                    setTimeout(() => {
                        this.isProcessing = false;
                        sendKissBtn.disabled = false;
                        sendKissBtn.style.opacity = '1';
                        sendKissBtn.style.cursor = 'pointer';
                        sendKissBtn.style.pointerEvents = 'auto';
                    }, 500);
                });
                
                return false;
            };
            
            sendKissBtn.addEventListener('click', handleKissClick, { passive: false });
            sendKissBtn.dataset.listenerAttached = 'true';
        }

        // 时间筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterStats(e.target.dataset.period);
            });
        });

        // 清空历史按钮
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // 设置相关
        const roomIdInput = document.getElementById('roomIdInput');
        if (roomIdInput) {
            roomIdInput.addEventListener('change', (e) => {
                this.updateSetting('roomId', e.target.value);
                // Reload data when room ID changes
                this.loadDataFromServer();
            });
        }

        const userIdInput = document.getElementById('userIdInput');
        if (userIdInput) {
            // User ID is read-only, but we can show it
        }

        document.getElementById('partnerNameInput').addEventListener('change', (e) => {
            this.updateSetting('partnerName', e.target.value);
        });

        document.getElementById('notificationToggle').addEventListener('change', (e) => {
            this.updateSetting('notifications', e.target.checked);
        });

        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.updateSetting('theme', e.target.value);
        });

        document.getElementById('autoSaveToggle').addEventListener('change', (e) => {
            this.updateSetting('autoSave', e.target.checked);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.sendMood();
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                        e.preventDefault();
                        const moodBtns = document.querySelectorAll('.mood-btn');
                        const index = parseInt(e.key) - 1;
                        if (moodBtns[index]) {
                            this.selectMood(moodBtns[index]);
                        }
                        break;
                }
            }
        });
    }

    selectMood(button) {
        // Prevent multiple rapid clicks
        if (button.dataset.processing === 'true') {
            return;
        }
        button.dataset.processing = 'true';
        
        // 移除其他按钮的激活状态
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.dataset.processing = 'false';
        });

        // 激活当前按钮
        button.classList.add('active');

        // 更新情绪显示
        const mood = button.dataset.mood;
        const emoji = button.dataset.emoji;
        const label = button.dataset.label;

        this.currentMood = { mood, emoji, label, timestamp: new Date() };

        document.getElementById('myMoodEmoji').textContent = emoji;
        document.getElementById('myMoodLabel').textContent = label;
        function updateDualTime() {
            const now = new Date();
        
            // 北京（或用户本地）时间
            const lanyiOptions = {
                hour: '2-digit',
                minute: '2-digit',
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            };
            const lanyiTime = now.toLocaleString('en-US', lanyiOptions);
        
            // 美国西海岸 PST/PDT
            const congOptions = {
                hour: '2-digit',
                minute: '2-digit',
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: 'America/Los_Angeles'
            };
            const congTime = now.toLocaleString('en-US', congOptions);
        
            // 写入 DOM - 我的情绪
            const myLanyi = document.getElementById("myLanyiTime");
            const myCong = document.getElementById("myCongTime");
        
            if (myLanyi) myLanyi.textContent = `👩🏻‍🦰 Lanyi time — ${lanyiTime}`;
            if (myCong)  myCong.textContent  = `👨🏻‍🦱 Cong time — ${congTime}`;
        
            // 写入 DOM - Ta 的情绪
            const taLanyi = document.getElementById("taLanyiTime");
            const taCong = document.getElementById("taCongTime");
        
            if (taLanyi) taLanyi.textContent = `👩🏻‍🦰 Lanyi time — ${lanyiTime}`;
            if (taCong)  taCong.textContent  = `👨🏻‍🦱 Cong time — ${congTime}`;
        }
        
        // 初次运行
        updateDualTime();
        
        // 每分钟自动更新
        setInterval(updateDualTime, 60000);        

        // 添加动画效果
        this.animateMoodChange();
        
        // Reset processing flag after a short delay
        setTimeout(() => {
            button.dataset.processing = 'false';
        }, 300);
    }

    async sendMood() {
        // Prevent multiple simultaneous sends
        if (this.sendingMood) {
            return;
        }
        this.sendingMood = true;

        try {
        if (!this.currentMood) {
            this.showNotification('⚠️', '请先选择一个情绪！', 'warning');
            return;
        }

        const message = document.getElementById('myMoodMessage').value.trim();
        
        const moodData = {
            ...this.currentMood,
            message: message,
            timestamp: new Date(),
            type: 'mood',
                sender: this.settings.userId
        };

            // Save to localStorage first (for offline support)
        this.moodHistory.unshift(moodData);
        this.saveData();

        // 清空消息输入框
        document.getElementById('myMoodMessage').value = '';

            // Recalculate stats from history (more accurate)
            this.recalculateStats();

        // 更新显示
        this.updateStats();
        this.renderHistory();
        this.updateChart();

            // Sync to server
            try {
                await this.syncMoodToServer(moodData);
        this.showNotification('💕', '情绪已发送给Ta！', 'success');
            } catch (error) {
                console.error('Failed to sync mood:', error);
                this.showNotification('⚠️', '情绪已保存，但同步失败。请检查网络连接。', 'warning');
            }

        // 播放发送动画
        this.playMoodAnimation();
        } finally {
            // Always reset sending flag, even if there was an error
            this.sendingMood = false;
        }
    }

    async sendResponse(type, emoji, message) {
        // Prevent multiple simultaneous sends
        if (this.sendingResponse) {
            return;
        }
        this.sendingResponse = true;

        try {
        const responseData = {
            type: 'response',
            responseType: type,
            emoji: emoji,
            message: message,
            timestamp: new Date(),
                sender: this.settings.userId
        };

        this.moodHistory.unshift(responseData);
        
            // Recalculate stats from history (more accurate)
            this.recalculateStats();

        this.saveData();
        this.updateStats();
        this.renderHistory();

            // Sync to server
            try {
                await this.syncMoodToServer(responseData);
            } catch (error) {
                console.error('Failed to sync response:', error);
            }

        this.showNotification(emoji, message, 'success');
        this.playMoodAnimation();
        } finally {
            // Always reset sending flag, even if there was an error
            this.sendingResponse = false;
        }
    }

    // API Methods
    async syncMoodToServer(moodData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/mood?roomId=${this.settings.roomId}&userId=${this.settings.userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mood: moodData.mood,
                    message: moodData.message,
                    type: moodData.type,
                    responseType: moodData.responseType,
                    emoji: moodData.emoji,
                    label: moodData.label,
                    sender: moodData.sender
                })
            });

            if (!response.ok) {
                throw new Error('Failed to sync mood');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error syncing mood:', error);
            throw error;
        }
    }

    async loadDataFromServer() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/mood?roomId=${this.settings.roomId}&userId=${this.settings.userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load data');
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                // Merge server data with local data
                const serverHistory = result.data.moodHistory || [];
                
                // Combine and deduplicate by timestamp and sender
                const combinedHistory = [...this.moodHistory];
                serverHistory.forEach(serverItem => {
                    const exists = combinedHistory.some(localItem => 
                        localItem.timestamp === serverItem.timestamp && 
                        localItem.sender === serverItem.sender
                    );
                    if (!exists) {
                        combinedHistory.push(serverItem);
                    }
                });
                
                // Sort by timestamp (newest first)
                combinedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                this.moodHistory = combinedHistory;
                
                // Recalculate stats from the actual history (more accurate)
                this.recalculateStats();
                
                // Update partner mood
                if (result.data.partnerMood) {
                    this.updatePartnerMoodDisplay(result.data.partnerMood);
                }
                
                // Save merged data
        this.saveData();
        this.renderHistory();
                this.updateStats();
                this.updateChart();
                
                this.lastSyncTime = new Date();
            }
        } catch (error) {
            console.error('Error loading data from server:', error);
            // Continue with local data if server fails
        }
    }

    updatePartnerMoodDisplay(partnerMood) {
        if (!partnerMood) return;
        
        this.partnerMood = partnerMood;
        
        document.getElementById('partnerMoodEmoji').textContent = partnerMood.emoji || '❓';
        document.getElementById('partnerMoodLabel').textContent = partnerMood.label || '等待Ta分享情绪';
        
        if (partnerMood.timestamp) {
            const timeStr = this.formatTime(new Date(partnerMood.timestamp));
            const taMoodTime = document.getElementById('taMoodTime');
            if (taMoodTime) {
                taMoodTime.innerHTML = `
                    <div>🩷 Lanyi time — ${timeStr}</div>
                    <div>💙 Cong time — ${timeStr}</div>
                `;
            }
        }
        
        if (partnerMood.message) {
            document.getElementById('partnerMessage').innerHTML = `<p>${partnerMood.message}</p>`;
        }
    }

    startSyncInterval() {
        // Poll for updates every 5 seconds
        this.syncInterval = setInterval(() => {
            this.loadDataFromServer();
        }, 5000);
    }

    filterStats(period) {
        // 更新筛选按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // 根据时间段筛选数据
        let filteredHistory = this.moodHistory;
        const now = new Date();
        
        switch(period) {
            case 'today':
                filteredHistory = this.moodHistory.filter(item => {
                    const itemDate = new Date(item.timestamp);
                    return itemDate.toDateString() === now.toDateString();
                });
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredHistory = this.moodHistory.filter(item => {
                    return new Date(item.timestamp) >= weekAgo;
                });
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredHistory = this.moodHistory.filter(item => {
                    return new Date(item.timestamp) >= monthAgo;
                });
                break;
        }

        // 更新统计显示
        this.updateStatsForPeriod(filteredHistory);
        this.updateChartForPeriod(filteredHistory);
    }

    updateStatsForPeriod(filteredHistory) {
        const messages = filteredHistory.filter(item => item.type === 'mood').length;
        const hugs = filteredHistory.filter(item => item.responseType === 'hug').length;
        const kisses = filteredHistory.filter(item => item.responseType === 'kiss').length;

        document.getElementById('messagesCount').textContent = messages;
        document.getElementById('hugsCount').textContent = hugs;
        document.getElementById('kissesCount').textContent = kisses;
    }

    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？此操作无法撤销。')) {
            this.moodHistory = [];
            
            // Recalculate stats (will be all zeros now)
            this.recalculateStats();
            
            this.saveData();
            this.updateStats();
            this.renderHistory();
            this.updateChart();
            
            this.showNotification('🗑️', '历史记录已清空', 'success');
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveData();

        // 应用设置
        switch(key) {
            case 'partnerName':
                document.getElementById('partnerName').textContent = value || 'Ta';
                break;
            case 'theme':
                document.body.setAttribute('data-theme', value);
                break;
        }

        this.showNotification('⚙️', '设置已保存', 'success');
    }

    loadSettings() {
        // 加载房间ID和用户ID
        const roomIdInput = document.getElementById('roomIdInput');
        if (roomIdInput) {
            roomIdInput.value = this.settings.roomId;
        }
        
        const userIdInput = document.getElementById('userIdInput');
        if (userIdInput) {
            userIdInput.value = this.settings.userId;
        }

        // 加载伴侣昵称
        document.getElementById('partnerNameInput').value = this.settings.partnerName;
        const partnerNameEl = document.getElementById('partnerName');
        if (partnerNameEl) {
            partnerNameEl.textContent = this.settings.partnerName;
        }

        // 加载通知设置
        document.getElementById('notificationToggle').checked = this.settings.notifications;

        // 加载主题设置
        document.getElementById('themeSelect').value = this.settings.theme;
        document.body.setAttribute('data-theme', this.settings.theme);

        // 加载自动保存设置
        document.getElementById('autoSaveToggle').checked = this.settings.autoSave;
    }

    recalculateStats() {
        // Recalculate stats from the actual mood history
        const stats = {
            messages: 0,
            hugs: 0,
            kisses: 0,
            moodCounts: {}
        };

        this.moodHistory.forEach(item => {
            if (item.type === 'mood' && item.mood) {
                stats.messages++;
                if (stats.moodCounts[item.mood]) {
                    stats.moodCounts[item.mood]++;
                } else {
                    stats.moodCounts[item.mood] = 1;
                }
            } else if (item.type === 'response') {
                if (item.responseType === 'hug') {
                    stats.hugs++;
                } else if (item.responseType === 'kiss') {
                    stats.kisses++;
                }
            }
        });

        this.stats = stats;
    }

    updateStats() {
        // Make sure stats are up to date before displaying
        this.recalculateStats();
        
        document.getElementById('messagesCount').textContent = this.stats.messages;
        document.getElementById('hugsCount').textContent = this.stats.hugs;
        document.getElementById('kissesCount').textContent = this.stats.kisses;
    }

    renderHistory() {
        const timeline = document.getElementById('historyTimeline');
        
        if (this.moodHistory.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary); text-align: center;">还没有情绪记录，开始分享你的心情吧！</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = this.moodHistory.slice(0, 20).map(item => {
            // Check if sender is current user
            const isMe = item.sender === 'me' || item.sender === this.settings.userId;
            const avatarClass = isMe ? 'me' : 'partner';
            const name = isMe ? '我' : this.settings.partnerName;
            
            let content = '';
            if (item.type === 'mood') {
                content = `
                    <div class="history-mood">
                        <span class="history-emoji">${item.emoji}</span>
                        <span class="history-label">${item.label}</span>
                    </div>
                    ${item.message ? `<div class="history-message">${item.message}</div>` : ''}
                `;
            } else if (item.type === 'response') {
                content = `
                    <div class="history-mood">
                        <span class="history-emoji">${item.emoji}</span>
                        <span class="history-label">${item.message}</span>
                    </div>
                `;
            }

            return `
                <div class="history-item">
                    <div class="history-avatar ${avatarClass}">
                        ${isMe ? '👤' : '💕'}
                    </div>
                    <div class="history-content">
                        <div class="history-header">
                            <span class="history-name">${name}</span>
                            <span class="history-time">${this.formatTime(new Date(item.timestamp))}</span>
                        </div>
                        ${content}
                    </div>
                </div>
            `;
        }).join('');
    }

    initChart() {
        const ctx = document.getElementById('moodChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ff6b9d',
                        '#4ecdc4',
                        '#45b7d1',
                        '#96ceb4',
                        '#feca57',
                        '#ff9ff3',
                        '#54a0ff',
                        '#5f27cd'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        this.updateChart();
    }

    updateChart() {
        const moodCounts = {};
        this.moodHistory.forEach(item => {
            if (item.type === 'mood' && item.mood) {
                moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
            }
        });

        const labels = Object.keys(moodCounts);
        const data = Object.values(moodCounts);

        this.chart.data.labels = labels.map(mood => {
            const moodLabels = {
                'happy': '开心',
                'love': '爱意',
                'excited': '兴奋',
                'calm': '平静',
                'sad': '难过',
                'miss': '想念',
                'tired': '疲惫',
                'anxious': '焦虑'
            };
            return moodLabels[mood] || mood;
        });
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    updateChartForPeriod(filteredHistory) {
        const moodCounts = {};
        filteredHistory.forEach(item => {
            if (item.type === 'mood' && item.mood) {
                moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
            }
        });

        const labels = Object.keys(moodCounts);
        const data = Object.values(moodCounts);

        this.chart.data.labels = labels.map(mood => {
            const moodLabels = {
                'happy': '开心',
                'love': '爱意',
                'excited': '兴奋',
                'calm': '平静',
                'sad': '难过',
                'miss': '想念',
                'tired': '疲惫',
                'anxious': '焦虑'
            };
            return moodLabels[mood] || mood;
        });
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    startTimeUpdates() {
        // 每分钟更新时间显示
        setInterval(() => {
            document.getElementById('lastUpdated').textContent = `最后更新: ${this.formatTime(new Date())}`;
        }, 60000);
    }

    animateMoodChange() {
        const moodDisplay = document.getElementById('myMoodDisplay');
        moodDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            moodDisplay.style.transform = 'scale(1)';
        }, 200);
    }

    playMoodAnimation() {
        const animation = document.getElementById('moodAnimation');
        animation.classList.add('show');
        setTimeout(() => {
            animation.classList.remove('show');
        }, 3000);
    }

    showNotification(icon, message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) {
            // Fallback to console if notification element doesn't exist
            console.log(`${icon} ${message}`);
            return;
        }

        const iconElement = notification.querySelector('.notification-icon');
        const textElement = notification.querySelector('.notification-text');

        if (iconElement) iconElement.textContent = icon;
        if (textElement) textElement.textContent = message;

        // 设置通知样式
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        // 3秒后隐藏通知
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    saveData() {
        if (this.settings.autoSave) {
            localStorage.setItem('moodHistory', JSON.stringify(this.moodHistory));
            localStorage.setItem('dashboardSettings', JSON.stringify(this.settings));
            localStorage.setItem('moodStats', JSON.stringify(this.stats));
            localStorage.setItem('roomId', this.settings.roomId);
            localStorage.setItem('userId', this.settings.userId);
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.ldrDashboard = new LDRMoodDashboard();
});

// 添加一些实用的全局函数
window.exportData = function() {
    const data = {
        history: window.ldrDashboard.moodHistory,
        settings: window.ldrDashboard.settings,
        stats: window.ldrDashboard.stats,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ldr-mood-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    window.ldrDashboard.showNotification('📥', '数据已导出', 'success');
};

window.importData = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('导入数据将覆盖当前所有数据，确定继续吗？')) {
                window.ldrDashboard.moodHistory = data.history || [];
                window.ldrDashboard.settings = { ...window.ldrDashboard.settings, ...data.settings };
                window.ldrDashboard.stats = { ...window.ldrDashboard.stats, ...data.stats };
                
                window.ldrDashboard.saveData();
                window.ldrDashboard.loadSettings();
                window.ldrDashboard.updateStats();
                window.ldrDashboard.renderHistory();
                window.ldrDashboard.updateChart();
                
                window.ldrDashboard.showNotification('📤', '数据导入成功', 'success');
            }
        } catch (error) {
            window.ldrDashboard.showNotification('❌', '数据格式错误', 'error');
        }
    };
    reader.readAsText(file);
};

// 添加键盘快捷键提示
document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
        e.preventDefault();
        alert(`
LDR情绪表达仪表板 - 快捷键说明

Ctrl/Cmd + Enter: 发送情绪
Ctrl/Cmd + 1-8: 快速选择情绪
F1: 显示帮助信息

功能说明：
• 选择情绪并添加消息后点击发送
• 可以对伴侣的情绪进行回应
• 查看情绪统计和历史记录
• 在设置中自定义伴侣昵称和主题
• 支持数据导入导出功能
        `);
    }
});
