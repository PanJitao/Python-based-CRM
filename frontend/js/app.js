// 主应用管理
const App = {
    // 当前页面
    currentPage: 'dashboard',
    
    // 页面数据缓存
    pageCache: {},
    
    // 初始化应用
    init() {
        Auth.init();
        this.bindEvents();
        this.initNavigation();
        this.loadDashboard();
        this.startPeriodicUpdates();
    },
    
    // 绑定事件
    bindEvents() {
        // 导航菜单点击
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const page = navItem.getAttribute('data-page');
                if (page) {
                    this.navigateTo(page);
                }
            }
        });
        
        // 面包屑导航
        document.addEventListener('click', (e) => {
            const breadcrumbItem = e.target.closest('.breadcrumb-item');
            if (breadcrumbItem && !breadcrumbItem.classList.contains('active')) {
                const page = breadcrumbItem.getAttribute('data-page');
                if (page) {
                    this.navigateTo(page);
                }
            }
        });
        
        // 快速操作按钮
        document.addEventListener('click', (e) => {
            const quickAction = e.target.closest('.quick-action');
            if (quickAction) {
                const action = quickAction.getAttribute('data-action');
                this.handleQuickAction(action);
            }
        });
        
        // 搜索框
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', Utils.debounce((e) => {
                this.handleGlobalSearch(e.target.value);
            }, 300));
        }
        
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshCurrentPage();
            });
        }
    },
    
    // 初始化导航
    initNavigation() {
        this.updateNavigation();
    },
    
    // 导航到指定页面
    navigateTo(page) {
        if (page === this.currentPage) return;
        
        // 检查权限
        if (!this.checkPagePermission(page)) {
            UI.showNotification('error', '权限不足', '您没有访问该页面的权限');
            return;
        }
        
        this.currentPage = page;
        this.updateNavigation();
        this.updateBreadcrumb();
        this.loadPage(page);
    },
    
    // 检查页面权限
    checkPagePermission(page) {
        const pagePermissions = {
            dashboard: ['read'],
            customers: ['read'],
            quotes: ['read'],
            contracts: ['read'],
            orders: ['read'],
            reports: ['read'],
            settings: ['admin']
        };
        
        const requiredPermissions = pagePermissions[page] || ['read'];
        
        return requiredPermissions.some(permission => {
            if (permission === 'admin') {
                return Auth.hasRole('admin');
            }
            return Auth.hasPermission(permission);
        });
    },
    
    // 更新导航状态
    updateNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === this.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    // 更新面包屑导航
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        const pageNames = {
            dashboard: '仪表盘',
            customers: '客户管理',
            quotes: '报价管理',
            contracts: '合同管理',
            orders: '订单管理',
            reports: '报表分析',
            settings: '系统设置'
        };
        
        const currentPageName = pageNames[this.currentPage] || this.currentPage;
        
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item" data-page="dashboard">
                <i class="fas fa-home"></i> 首页
            </span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">${currentPageName}</span>
        `;
    },
    
    // 加载页面
    async loadPage(page) {
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;
        
        // 隐藏所有内容页面
        const contentPages = document.querySelectorAll('.content-page');
        contentPages.forEach(page => page.classList.remove('active'));
        
        // 显示目标页面
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // 显示加载状态
        UI.showLoading(contentArea, '加载中...');
        
        try {
            switch (page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'customers':
                    await this.loadCustomers();
                    break;
                case 'quotes':
                    await this.loadQuotes();
                    break;
                case 'contracts':
                    await this.loadContracts();
                    break;
                case 'orders':
                    await this.loadOrders();
                    break;
                case 'reports':
                    await this.loadReports();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                default:
                    throw new Error(`未知页面: ${page}`);
            }
        } catch (error) {
            Utils.log.error(`加载页面失败: ${page}`, error);
            UI.showNotification('error', '加载失败', error.message || '页面加载时发生错误');
            
            contentArea.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-message">
                        <h3>页面加载失败</h3>
                        <p>${error.message || '发生未知错误'}</p>
                        <button class="btn btn-primary" onclick="App.refreshCurrentPage()">
                            <i class="fas fa-redo"></i> 重新加载
                        </button>
                    </div>
                </div>
            `;
        } finally {
            UI.hideLoading(contentArea);
        }
    },
    
    // 加载仪表盘
    async loadDashboard() {
        const contentArea = document.getElementById('contentArea');
        
        // 获取统计数据
        const stats = await this.getDashboardStats();
        if (!stats) return;
        
        contentArea.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <h2>仪表盘</h2>
                    <div class="dashboard-actions">
                        <button class="btn btn-outline" onclick="App.refreshCurrentPage()">
                            <i class="fas fa-sync-alt"></i> 刷新
                        </button>
                    </div>
                </div>
                
                <!-- 统计卡片 -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon customer">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.customers.total}</div>
                            <div class="stat-label">客户总数</div>
                            <div class="stat-change ${stats.customers.change >= 0 ? 'positive' : 'negative'}">
                                <i class="fas fa-arrow-${stats.customers.change >= 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(stats.customers.change)}%
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon quote">
                            <i class="fas fa-file-invoice"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.quotes.total}</div>
                            <div class="stat-label">报价单数</div>
                            <div class="stat-change ${stats.quotes.change >= 0 ? 'positive' : 'negative'}">
                                <i class="fas fa-arrow-${stats.quotes.change >= 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(stats.quotes.change)}%
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon contract">
                            <i class="fas fa-handshake"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.contracts.total}</div>
                            <div class="stat-label">合同数量</div>
                            <div class="stat-change ${stats.contracts.change >= 0 ? 'positive' : 'negative'}">
                                <i class="fas fa-arrow-${stats.contracts.change >= 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(stats.contracts.change)}%
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon revenue">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${Utils.number.formatCurrency(stats.revenue.total)}</div>
                            <div class="stat-label">总收入</div>
                            <div class="stat-change ${stats.revenue.change >= 0 ? 'positive' : 'negative'}">
                                <i class="fas fa-arrow-${stats.revenue.change >= 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(stats.revenue.change)}%
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 快速操作 -->
                <div class="quick-actions">
                    <h3>快速操作</h3>
                    <div class="quick-actions-grid">
                        <div class="quick-action" data-action="add-customer">
                            <div class="quick-action-icon">
                                <i class="fas fa-user-plus"></i>
                            </div>
                            <div class="quick-action-text">添加客户</div>
                        </div>
                        <div class="quick-action" data-action="create-quote">
                            <div class="quick-action-icon">
                                <i class="fas fa-file-plus"></i>
                            </div>
                            <div class="quick-action-text">创建报价</div>
                        </div>
                        <div class="quick-action" data-action="create-contract">
                            <div class="quick-action-icon">
                                <i class="fas fa-handshake"></i>
                            </div>
                            <div class="quick-action-text">创建合同</div>
                        </div>
                        <div class="quick-action" data-action="create-order">
                            <div class="quick-action-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="quick-action-text">创建订单</div>
                        </div>
                    </div>
                </div>
                
                <!-- 最近活动 -->
                <div class="recent-activities">
                    <h3>最近活动</h3>
                    <div class="activity-list" id="activityList">
                        <!-- 活动列表将通过JavaScript动态加载 -->
                    </div>
                </div>
            </div>
        `;
        
        // 加载最近活动
        await this.loadRecentActivities();
    },
    
    // 获取仪表盘统计数据
    async getDashboardStats() {
        try {
            const response = await API.dashboard.getDashboard();
            return response.data;
        } catch (error) {
            Utils.log.error('获取仪表盘统计数据失败:', error);
            return null;
        }
    },
    
    // 加载最近活动
    async loadRecentActivities() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        try {
            const response = await API.stats.getRecentActivities({ limit: 10 });
            const activities = response.data.activities || [];
            
            if (activities.length === 0) {
                UI.showEmptyState(activityList, '暂无最近活动', 'fas fa-clock');
                return;
            }
            
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="${this.getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${Utils.date.formatRelative(activity.created_at)}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            Utils.log.error('加载最近活动失败:', error);
            UI.showEmptyState(activityList, '加载活动失败', 'fas fa-exclamation-triangle');
        }
    },
    
    // 获取活动图标
    getActivityIcon(type) {
        const icons = {
            customer: 'fas fa-user',
            quote: 'fas fa-file-invoice',
            contract: 'fas fa-handshake',
            order: 'fas fa-shopping-cart',
            payment: 'fas fa-credit-card',
            system: 'fas fa-cog'
        };
        return icons[type] || 'fas fa-info-circle';
    },
    
    // 加载客户页面
    async loadCustomers() {
        if (window.CustomerManager) {
            await window.CustomerManager.init();
        } else {
            throw new Error('客户管理模块未加载');
        }
    },
    
    // 加载报价页面
    async loadQuotes() {
        if (window.QuoteManager) {
            await window.QuoteManager.init();
        } else {
            throw new Error('报价管理模块未加载');
        }
    },
    
    // 加载合同页面
    async loadContracts() {
        if (window.ContractManager) {
            await window.ContractManager.init();
        } else {
            throw new Error('合同管理模块未加载');
        }
    },
    
    // 加载订单页面
    async loadOrders() {
        if (window.OrderManager) {
            await window.OrderManager.init();
        } else {
            throw new Error('订单管理模块未加载');
        }
    },
    
    // 加载报表页面
    async loadReports() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="reports">
                <div class="page-header">
                    <h2>报表分析</h2>
                </div>
                <div class="coming-soon">
                    <div class="coming-soon-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="coming-soon-text">
                        <h3>报表功能即将上线</h3>
                        <p>我们正在开发强大的报表分析功能，敬请期待！</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // 加载设置页面
    async loadSettings() {
        if (!Auth.hasRole('admin')) {
            throw new Error('只有管理员可以访问系统设置');
        }
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="settings">
                <div class="page-header">
                    <h2>系统设置</h2>
                </div>
                <div class="coming-soon">
                    <div class="coming-soon-icon">
                        <i class="fas fa-cog"></i>
                    </div>
                    <div class="coming-soon-text">
                        <h3>系统设置功能即将上线</h3>
                        <p>我们正在开发系统设置功能，敬请期待！</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // 处理快速操作
    handleQuickAction(action) {
        switch (action) {
            case 'add-customer':
                this.navigateTo('customers');
                setTimeout(() => {
                    if (window.CustomerManager && window.CustomerManager.showAddModal) {
                        window.CustomerManager.showAddModal();
                    }
                }, 100);
                break;
            case 'create-quote':
                this.navigateTo('quotes');
                setTimeout(() => {
                    if (window.QuoteManager && window.QuoteManager.showAddModal) {
                        window.QuoteManager.showAddModal();
                    }
                }, 100);
                break;
            case 'create-contract':
                this.navigateTo('contracts');
                setTimeout(() => {
                    if (window.ContractManager && window.ContractManager.showAddModal) {
                        window.ContractManager.showAddModal();
                    }
                }, 100);
                break;
            case 'create-order':
                this.navigateTo('orders');
                setTimeout(() => {
                    if (window.OrderManager && window.OrderManager.showAddModal) {
                        window.OrderManager.showAddModal();
                    }
                }, 100);
                break;
            default:
                UI.showNotification('info', '提示', '该功能正在开发中');
        }
    },
    
    // 处理全局搜索
    async handleGlobalSearch(query) {
        if (!query.trim()) return;
        
        try {
            const response = await API.search.global({ query, limit: 10 });
            const results = response.data.results || [];
            
            // 显示搜索结果
            this.showSearchResults(results);
            
        } catch (error) {
            Utils.log.error('全局搜索失败:', error);
        }
    },
    
    // 显示搜索结果
    showSearchResults(results) {
        // 这里可以实现搜索结果的显示逻辑
        console.log('搜索结果:', results);
    },
    
    // 刷新当前页面
    refreshCurrentPage() {
        // 清除页面缓存
        delete this.pageCache[this.currentPage];
        
        // 重新加载页面
        this.loadPage(this.currentPage);
        
        UI.showNotification('success', '刷新成功', '页面已刷新');
    },
    
    // 开始定期更新
    startPeriodicUpdates() {
        // 每5分钟更新一次仪表盘数据
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadRecentActivities();
            }
        }, 5 * 60 * 1000);
    },
    
    // 获取当前页面
    getCurrentPage() {
        return this.currentPage;
    },
    
    // 设置页面缓存
    setPageCache(page, data) {
        this.pageCache[page] = {
            data,
            timestamp: Date.now()
        };
    },
    
    // 获取页面缓存
    getPageCache(page, maxAge = 5 * 60 * 1000) { // 默认5分钟过期
        const cache = this.pageCache[page];
        if (cache && (Date.now() - cache.timestamp) < maxAge) {
            return cache.data;
        }
        return null;
    },
    
    // 清除页面缓存
    clearPageCache(page) {
        if (page) {
            delete this.pageCache[page];
        } else {
            this.pageCache = {};
        }
    }
};

// 导出应用对象
window.App = App;