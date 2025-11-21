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
            autoSave: true
        };
        this.stats = JSON.parse(localStorage.getItem('moodStats')) || {
            messages: 0,
            hugs: 0,
            kisses: 0,
            moodCounts: {}
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateStats();
        this.renderHistory();
        this.initChart();
        this.startTimeUpdates();
        this.simulatePartnerActivity();
        
        // 显示欢迎通知
        this.showNotification('💕', '欢迎使用LDR情绪表达仪表板！', 'success');
    }

    setupEventListeners() {
        // 情绪选择按钮
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectMood(e.target);
            });
        });

        // 发送情绪按钮
        document.getElementById('sendMoodBtn').addEventListener('click', () => {
            this.sendMood();
        });

        // 响应按钮
        document.getElementById('sendHugBtn').addEventListener('click', () => {
            this.sendResponse('hug', '🤗', '发送了一个温暖的拥抱');
        });

        document.getElementById('sendKissBtn').addEventListener('click', () => {
            this.sendResponse('kiss', '💋', '发送了一个甜蜜的亲亲');
        });

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
        // 移除其他按钮的激活状态
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('active');
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
    }

    sendMood() {
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
            sender: 'me'
        };

        // 添加到历史记录
        this.moodHistory.unshift(moodData);
        this.saveData();

        // 更新统计
        this.stats.messages++;
        if (this.stats.moodCounts[this.currentMood.mood]) {
            this.stats.moodCounts[this.currentMood.mood]++;
        } else {
            this.stats.moodCounts[this.currentMood.mood] = 1;
        }

        // 清空消息输入框
        document.getElementById('myMoodMessage').value = '';

        // 更新显示
        this.updateStats();
        this.renderHistory();
        this.updateChart();

        // 显示成功通知
        this.showNotification('💕', '情绪已发送给Ta！', 'success');

        // 播放发送动画
        this.playMoodAnimation();

        // 模拟伴侣回应（延迟2-5秒）
        setTimeout(() => {
            this.simulatePartnerResponse();
        }, Math.random() * 3000 + 2000);
    }

    sendResponse(type, emoji, message) {
        const responseData = {
            type: 'response',
            responseType: type,
            emoji: emoji,
            message: message,
            timestamp: new Date(),
            sender: 'me'
        };

        this.moodHistory.unshift(responseData);
        
        if (type === 'hug') {
            this.stats.hugs++;
        } else if (type === 'kiss') {
            this.stats.kisses++;
        }

        this.saveData();
        this.updateStats();
        this.renderHistory();

        this.showNotification(emoji, message, 'success');
        this.playMoodAnimation();
    }

    simulatePartnerActivity() {
        // 模拟伴侣的情绪更新
        const partnerMoods = [
            { mood: 'happy', emoji: '😊', label: '开心' },
            { mood: 'love', emoji: '🥰', label: '爱意满满' },
            { mood: 'miss', emoji: '🥺', label: '想念你' },
            { mood: 'excited', emoji: '🤗', label: '兴奋' },
            { mood: 'calm', emoji: '😌', label: '平静' }
        ];

        const partnerMessages = [
            '想你了 💕',
            '今天过得怎么样？',
            '爱你哦 ❤️',
            '晚安，做个好梦',
            '想和你一起看电影',
            '你在做什么呢？',
            '想抱抱你',
            '今天天气真好',
            '想念你的笑容'
        ];

        // 随机更新伴侣情绪（每10-30分钟）
        const updatePartnerMood = () => {
            const randomMood = partnerMoods[Math.floor(Math.random() * partnerMoods.length)];
            const randomMessage = partnerMessages[Math.floor(Math.random() * partnerMessages.length)];
            
            this.partnerMood = {
                ...randomMood,
                message: randomMessage,
                timestamp: new Date()
            };

            // 更新显示
            document.getElementById('partnerMoodEmoji').textContent = randomMood.emoji;
            document.getElementById('partnerMoodLabel').textContent = randomMood.label;
            document.getElementById('partnerMoodTime').textContent = this.formatTime(new Date());
            document.getElementById('partnerMessage').innerHTML = `<p>${randomMessage}</p>`;

            // 添加到历史记录
            const partnerData = {
                ...this.partnerMood,
                type: 'mood',
                sender: 'partner'
            };
            
            this.moodHistory.unshift(partnerData);
            this.saveData();
            this.renderHistory();

            // 显示通知
            if (this.settings.notifications) {
                this.showNotification(randomMood.emoji, `${this.settings.partnerName}: ${randomMessage}`, 'info');
            }

            // 设置下次更新时间
            setTimeout(updatePartnerMood, Math.random() * 1200000 + 600000); // 10-30分钟
        };

        // 初始延迟5-10秒后开始
        setTimeout(updatePartnerMood, Math.random() * 5000 + 5000);
    }

    simulatePartnerResponse() {
        const responses = [
            { emoji: '🥰', message: '收到了你的情绪，爱你！' },
            { emoji: '💕', message: '谢谢你和我分享心情' },
            { emoji: '🤗', message: '给你一个大大的拥抱' },
            { emoji: '😘', message: '想你了，亲亲' },
            { emoji: '❤️', message: '我也有同样的感受' }
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseData = {
            type: 'response',
            responseType: 'message',
            emoji: randomResponse.emoji,
            message: randomResponse.message,
            timestamp: new Date(),
            sender: 'partner'
        };

        this.moodHistory.unshift(responseData);
        this.saveData();
        this.renderHistory();

        if (this.settings.notifications) {
            this.showNotification(randomResponse.emoji, `${this.settings.partnerName}: ${randomResponse.message}`, 'info');
        }
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
            this.stats = {
                messages: 0,
                hugs: 0,
                kisses: 0,
                moodCounts: {}
            };
            
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
        // 加载伴侣昵称
        document.getElementById('partnerNameInput').value = this.settings.partnerName;
        document.getElementById('partnerName').textContent = this.settings.partnerName;

        // 加载通知设置
        document.getElementById('notificationToggle').checked = this.settings.notifications;

        // 加载主题设置
        document.getElementById('themeSelect').value = this.settings.theme;
        document.body.setAttribute('data-theme', this.settings.theme);

        // 加载自动保存设置
        document.getElementById('autoSaveToggle').checked = this.settings.autoSave;
    }

    updateStats() {
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
            const isMe = item.sender === 'me';
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
        const iconElement = notification.querySelector('.notification-icon');
        const textElement = notification.querySelector('.notification-text');

        iconElement.textContent = icon;
        textElement.textContent = message;

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
