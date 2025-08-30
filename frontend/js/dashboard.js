// 仪表盘管理
const Dashboard = {
    // 初始化仪表盘
    init() {
        this.loadDashboardData();
        this.bindEvents();
        this.initCharts();
    },

    // 绑定事件
    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // 时间范围选择
        const timeRangeSelect = document.querySelector('#timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', () => {
                this.loadDashboardData();
            });
        }
    },

    // 加载仪表盘数据
    async loadDashboardData() {
        try {
            UI.showLoading(document.querySelector('.dashboard-content'), '加载仪表盘数据...');
            
            // 模拟数据，实际应该从API获取
            const data = {
                stats: {
                    totalCustomers: 156,
                    totalQuotes: 89,
                    totalContracts: 45,
                    totalOrders: 67,
                    monthlyRevenue: 125000,
                    monthlyGrowth: 12.5
                },
                recentActivities: [
                    { type: 'customer', action: '新增客户', name: '张三公司', time: '2小时前' },
                    { type: 'quote', action: '创建报价', name: 'Q2024-001', time: '4小时前' },
                    { type: 'contract', action: '签署合同', name: 'C2024-001', time: '1天前' },
                    { type: 'order', action: '新订单', name: 'O2024-001', time: '2天前' }
                ],
                topCustomers: [
                    { name: '张三公司', value: 25000, growth: 15.2 },
                    { name: '李四集团', value: 18000, growth: -5.1 },
                    { name: '王五企业', value: 12000, growth: 8.7 }
                ]
            };
            
            this.updateStats(data.stats);
            this.updateRecentActivities(data.recentActivities);
            this.updateTopCustomers(data.topCustomers);
            
        } catch (error) {
            console.error('加载仪表盘数据失败:', error);
            UI.showNotification('error', '加载失败', '无法加载仪表盘数据');
        } finally {
            UI.hideLoading(document.querySelector('.dashboard-content'));
        }
    },

    // 更新统计数据
    updateStats(stats) {
        const elements = {
            totalCustomers: document.querySelector('#totalCustomers'),
            totalQuotes: document.querySelector('#totalQuotes'),
            totalContracts: document.querySelector('#totalContracts'),
            totalOrders: document.querySelector('#totalOrders'),
            monthlyRevenue: document.querySelector('#monthlyRevenue'),
            monthlyGrowth: document.querySelector('#monthlyGrowth')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                if (key === 'monthlyRevenue') {
                    elements[key].textContent = `¥${stats[key].toLocaleString()}`;
                } else if (key === 'monthlyGrowth') {
                    elements[key].textContent = `${stats[key] > 0 ? '+' : ''}${stats[key]}%`;
                    elements[key].className = stats[key] > 0 ? 'text-success' : 'text-danger';
                } else {
                    elements[key].textContent = stats[key];
                }
            }
        });
    },

    // 更新最近活动
    updateRecentActivities(activities) {
        const container = document.querySelector('#recentActivities');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon activity-${activity.type}">
                    <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.action}: ${activity.name}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    },

    // 更新顶级客户
    updateTopCustomers(customers) {
        const container = document.querySelector('#topCustomers');
        if (!container) return;

        container.innerHTML = customers.map(customer => `
            <div class="customer-item">
                <div class="customer-info">
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-value">¥${customer.value.toLocaleString()}</div>
                </div>
                <div class="customer-growth ${customer.growth > 0 ? 'positive' : 'negative'}">
                    ${customer.growth > 0 ? '+' : ''}${customer.growth}%
                </div>
            </div>
        `).join('');
    },

    // 获取活动图标
    getActivityIcon(type) {
        const icons = {
            customer: 'fas fa-user-plus',
            quote: 'fas fa-file-invoice',
            contract: 'fas fa-handshake',
            order: 'fas fa-shopping-cart'
        };
        return icons[type] || 'fas fa-circle';
    },

    // 初始化图表
    initCharts() {
        // 这里可以初始化图表库，如Chart.js
        console.log('图表初始化完成');
    }
};

// 导出到全局
window.Dashboard = Dashboard;