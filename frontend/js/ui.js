// UI组件管理
const UI = {
    // 初始化UI组件
    init() {
        this.bindGlobalEvents();
        this.initTooltips();
        this.initModals();
        this.initTabs();
        this.initCollapse();
    },
    
    // 绑定全局事件
    bindGlobalEvents() {
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // 点击模态框背景关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        
        // 阻止模态框内容区域的点击事件冒泡
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-content')) {
                e.stopPropagation();
            }
        });
    },
    
    // 显示通知
    showNotification(type, title, message, duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;
        
        // 添加到通知容器
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // 动画显示
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 进度条动画
        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar && duration > 0) {
            progressBar.style.animationDuration = `${duration}ms`;
            progressBar.classList.add('animate');
        }
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        return notification;
    },
    
    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    },
    
    // 移除通知
    removeNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },
    
    // 显示确认对话框
    showConfirm(title, message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'confirmModal';
        
        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="UI.closeModal('confirmModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="UI.closeModal('confirmModal')">
                        取消
                    </button>
                    <button class="btn btn-danger" id="confirmBtn">
                        确认
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定确认按钮事件
        const confirmBtn = modal.querySelector('#confirmBtn');
        confirmBtn.addEventListener('click', () => {
            this.closeModal('confirmModal');
            if (onConfirm) onConfirm();
        });
        
        // 绑定取消事件
        const cancelBtns = modal.querySelectorAll('.btn-secondary, .modal-close');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (onCancel) onCancel();
            });
        });
        
        this.showModal('confirmModal');
    },
    
    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            
            // 聚焦到第一个输入框
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },
    
    // 关闭模态框
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // 如果是动态创建的模态框，延迟删除
            if (modalId === 'confirmModal') {
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        }
    },
    
    // 关闭所有模态框
    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            this.closeModal(modal.id);
        });
    },
    
    // 初始化工具提示
    initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target);
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip(e.target);
            });
        });
    },
    
    // 显示工具提示
    showTooltip(element) {
        const text = element.getAttribute('data-tooltip');
        if (!text) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.id = 'tooltip';
        
        document.body.appendChild(tooltip);
        
        // 计算位置
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;
        
        // 边界检查
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        
        if (top < 8) {
            top = rect.bottom + 8;
            tooltip.classList.add('tooltip-bottom');
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        
        setTimeout(() => tooltip.classList.add('show'), 10);
    },
    
    // 隐藏工具提示
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    },
    
    // 初始化模态框
    initModals() {
        // 绑定模态框关闭按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || 
                e.target.closest('.modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            }
        });
    },
    
    // 初始化标签页
    initTabs() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                this.switchTab(e.target);
            }
        });
    },
    
    // 切换标签页
    switchTab(tabButton) {
        const tabContainer = tabButton.closest('.tabs');
        if (!tabContainer) return;
        
        const targetId = tabButton.getAttribute('data-tab');
        
        // 移除所有活动状态
        tabContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        tabContainer.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 激活当前标签
        tabButton.classList.add('active');
        const targetContent = tabContainer.querySelector(`#${targetId}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    },
    
    // 初始化折叠面板
    initCollapse() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('collapse-toggle') || 
                e.target.closest('.collapse-toggle')) {
                const toggle = e.target.closest('.collapse-toggle') || e.target;
                this.toggleCollapse(toggle);
            }
        });
    },
    
    // 切换折叠状态
    toggleCollapse(toggle) {
        const targetId = toggle.getAttribute('data-target');
        const target = document.getElementById(targetId);
        
        if (target) {
            const isExpanded = target.classList.contains('show');
            
            if (isExpanded) {
                target.classList.remove('show');
                toggle.classList.remove('expanded');
            } else {
                target.classList.add('show');
                toggle.classList.add('expanded');
            }
        }
    },
    
    // 显示加载状态
    showLoading(container, message = '加载中...') {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            container.style.position = 'relative';
            container.appendChild(loadingElement);
        }
        
        return loadingElement;
    },
    
    // 隐藏加载状态
    hideLoading(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            const loadingElement = container.querySelector('.loading-overlay');
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    },
    
    // 创建分页组件
    createPagination(container, currentPage, totalPages, onPageChange) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container || totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.className = `pagination-btn ${currentPage <= 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) onPageChange(currentPage - 1);
        });
        pagination.appendChild(prevBtn);
        
        // 页码按钮
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            const firstBtn = this.createPageButton(1, currentPage, onPageChange);
            pagination.appendChild(firstBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = this.createPageButton(i, currentPage, onPageChange);
            pagination.appendChild(pageBtn);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
            
            const lastBtn = this.createPageButton(totalPages, currentPage, onPageChange);
            pagination.appendChild(lastBtn);
        }
        
        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.className = `pagination-btn ${currentPage >= totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) onPageChange(currentPage + 1);
        });
        pagination.appendChild(nextBtn);
        
        container.innerHTML = '';
        container.appendChild(pagination);
    },
    
    // 创建页码按钮
    createPageButton(page, currentPage, onPageChange) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${page === currentPage ? 'active' : ''}`;
        btn.textContent = page;
        btn.addEventListener('click', () => onPageChange(page));
        return btn;
    },
    
    // 创建状态标签
    createStatusBadge(status, type = 'customer') {
        const badge = document.createElement('span');
        badge.className = 'status-badge';
        
        let statusConfig;
        switch (type) {
            case 'customer':
                statusConfig = CONFIG.CUSTOMER_STATUS[status];
                break;
            case 'quote':
                statusConfig = CONFIG.QUOTE_STATUS[status];
                break;
            case 'contract':
                statusConfig = CONFIG.CONTRACT_STATUS[status];
                break;
            case 'order':
                statusConfig = CONFIG.ORDER_STATUS[status];
                break;
            default:
                statusConfig = { label: status, color: 'gray' };
        }
        
        if (statusConfig) {
            badge.textContent = statusConfig.label;
            badge.classList.add(`status-${statusConfig.color}`);
        } else {
            badge.textContent = status;
            badge.classList.add('status-gray');
        }
        
        return badge;
    },
    
    // 创建优先级标签
    createPriorityBadge(priority) {
        const badge = document.createElement('span');
        badge.className = 'priority-badge';
        
        const priorityConfig = CONFIG.PRIORITY[priority];
        if (priorityConfig) {
            badge.textContent = priorityConfig.label;
            badge.classList.add(`priority-${priorityConfig.color}`);
        } else {
            badge.textContent = priority;
            badge.classList.add('priority-gray');
        }
        
        return badge;
    },
    
    // 格式化表格数据
    formatTableData(data, columns) {
        return data.map(row => {
            const formattedRow = {};
            
            columns.forEach(column => {
                let value = Utils.object.getNestedValue(row, column.key);
                
                if (column.formatter) {
                    value = column.formatter(value, row);
                } else if (column.type) {
                    switch (column.type) {
                        case 'date':
                            value = Utils.date.format(value);
                            break;
                        case 'datetime':
                            value = Utils.date.formatDateTime(value);
                            break;
                        case 'currency':
                            value = Utils.number.formatCurrency(value);
                            break;
                        case 'status':
                            value = this.createStatusBadge(value, column.statusType).outerHTML;
                            break;
                        case 'priority':
                            value = this.createPriorityBadge(value).outerHTML;
                            break;
                    }
                }
                
                formattedRow[column.key] = value;
            });
            
            return formattedRow;
        });
    },
    
    // 显示空状态
    showEmptyState(container, message = '暂无数据', icon = 'fas fa-inbox') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="empty-message">${message}</div>
                </div>
            `;
        }
    },
    
    // 滚动到顶部
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },
    
    // 滚动到元素
    scrollToElement(element, offset = 0) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: elementTop - offset,
                behavior: 'smooth'
            });
        }
    }
};

// 页面加载完成后初始化UI组件
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

// 导出UI对象
window.UI = UI;