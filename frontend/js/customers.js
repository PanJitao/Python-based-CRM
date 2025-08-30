// 客户管理模块
const CustomerManager = {
    // 当前数据
    customers: [],
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    
    // 搜索和筛选条件
    filters: {
        search: '',
        status: '',
        type: '',
        level: '',
        industry: '',
        source: ''
    },
    
    // 排序条件
    sort: {
        field: 'created_at',
        order: 'desc'
    },
    
    // 初始化
    async init() {
        this.renderPage();
        this.bindEvents();
        await this.loadCustomers();
    },
    
    // 渲染页面
    renderPage() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="customers-page">
                <div class="page-header">
                    <div class="page-title">
                        <h2>客户管理</h2>
                        <span class="page-subtitle">管理您的客户信息</span>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" onclick="CustomerManager.exportCustomers()">
                            <i class="fas fa-download"></i> 导出
                        </button>
                        <button class="btn btn-primary" onclick="CustomerManager.showAddModal()">
                            <i class="fas fa-plus"></i> 添加客户
                        </button>
                    </div>
                </div>
                
                <!-- 筛选和搜索 -->
                <div class="filters-section">
                    <div class="search-box">
                        <input type="text" id="customerSearch" placeholder="搜索客户名称、公司、联系人..." value="${this.filters.search}">
                        <i class="fas fa-search"></i>
                    </div>
                    
                    <div class="filter-controls">
                        <select id="statusFilter" class="filter-select">
                            <option value="">全部状态</option>
                            ${Object.entries(CONFIG.CUSTOMER_STATUS).map(([key, value]) => 
                                `<option value="${key}" ${this.filters.status === key ? 'selected' : ''}>${value.label}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="typeFilter" class="filter-select">
                            <option value="">全部类型</option>
                            ${Object.entries(CONFIG.CUSTOMER_TYPE).map(([key, value]) => 
                                `<option value="${key}" ${this.filters.type === key ? 'selected' : ''}>${value.label}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="levelFilter" class="filter-select">
                            <option value="">全部等级</option>
                            ${Object.entries(CONFIG.CUSTOMER_LEVEL).map(([key, value]) => 
                                `<option value="${key}" ${this.filters.level === key ? 'selected' : ''}>${value.label}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="industryFilter" class="filter-select">
                            <option value="">全部行业</option>
                            ${CONFIG.INDUSTRIES.map(industry => 
                                `<option value="${industry}" ${this.filters.industry === industry ? 'selected' : ''}>${industry}</option>`
                            ).join('')}
                        </select>
                        
                        <button class="btn btn-outline btn-sm" onclick="CustomerManager.resetFilters()">
                            <i class="fas fa-undo"></i> 重置
                        </button>
                    </div>
                </div>
                
                <!-- 客户列表 -->
                <div class="table-container">
                    <div class="table-header">
                        <div class="table-info">
                            <span id="customerCount">共 ${this.totalCount} 个客户</span>
                        </div>
                        <div class="table-controls">
                            <select id="pageSizeSelect" class="page-size-select">
                                <option value="10">10条/页</option>
                                <option value="20" selected>20条/页</option>
                                <option value="50">50条/页</option>
                                <option value="100">100条/页</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-wrapper">
                        <table class="data-table" id="customersTable">
                            <thead>
                                <tr>
                                    <th class="sortable" data-field="name">
                                        客户名称 <i class="fas fa-sort"></i>
                                    </th>
                                    <th class="sortable" data-field="company">
                                        公司 <i class="fas fa-sort"></i>
                                    </th>
                                    <th>联系人</th>
                                    <th>联系方式</th>
                                    <th class="sortable" data-field="industry">
                                        行业 <i class="fas fa-sort"></i>
                                    </th>
                                    <th class="sortable" data-field="type">
                                        类型 <i class="fas fa-sort"></i>
                                    </th>
                                    <th class="sortable" data-field="level">
                                        等级 <i class="fas fa-sort"></i>
                                    </th>
                                    <th class="sortable" data-field="status">
                                        状态 <i class="fas fa-sort"></i>
                                    </th>
                                    <th class="sortable" data-field="last_contact_date">
                                        最后联系 <i class="fas fa-sort"></i>
                                    </th>
                                    <th class="actions-column">操作</th>
                                </tr>
                            </thead>
                            <tbody id="customersTableBody">
                                <!-- 数据将通过JavaScript动态加载 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 分页 -->
                    <div class="pagination-container" id="customersPagination">
                        <!-- 分页组件将通过JavaScript动态生成 -->
                    </div>
                </div>
            </div>
            
            <!-- 添加/编辑客户模态框 -->
            <div class="modal" id="customerModal">
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title" id="customerModalTitle">添加客户</h3>
                        <button class="modal-close" onclick="UI.closeModal('customerModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="customerForm" class="form">
                            <input type="hidden" id="customerId" name="id">
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerName" class="required">客户名称</label>
                                    <input type="text" id="customerName" name="name" required>
                                </div>
                                <div class="form-group">
                                    <label for="customerCompany">公司名称</label>
                                    <input type="text" id="customerCompany" name="company">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerIndustry">行业</label>
                                    <select id="customerIndustry" name="industry">
                                        <option value="">请选择行业</option>
                                        ${CONFIG.INDUSTRIES.map(industry => 
                                            `<option value="${industry}">${industry}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="customerType" class="required">客户类型</label>
                                    <select id="customerType" name="type" required>
                                        <option value="">请选择类型</option>
                                        ${Object.entries(CONFIG.CUSTOMER_TYPE).map(([key, value]) => 
                                            `<option value="${key}">${value.label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerContact">联系人</label>
                                    <input type="text" id="customerContact" name="contact">
                                </div>
                                <div class="form-group">
                                    <label for="customerPhone">联系电话</label>
                                    <input type="tel" id="customerPhone" name="phone">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerEmail">邮箱</label>
                                    <input type="email" id="customerEmail" name="email">
                                </div>
                                <div class="form-group">
                                    <label for="customerAddress">地址</label>
                                    <input type="text" id="customerAddress" name="address">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerSource">客户来源</label>
                                    <select id="customerSource" name="source">
                                        <option value="">请选择来源</option>
                                        ${CONFIG.CUSTOMER_SOURCE.map(source => 
                                            `<option value="${source}">${source}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="customerLevel">客户等级</label>
                                    <select id="customerLevel" name="level">
                                        <option value="">请选择等级</option>
                                        ${Object.entries(CONFIG.CUSTOMER_LEVEL).map(([key, value]) => 
                                            `<option value="${key}">${value.label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerStatus">状态</label>
                                    <select id="customerStatus" name="status">
                                        ${Object.entries(CONFIG.CUSTOMER_STATUS).map(([key, value]) => 
                                            `<option value="${key}">${value.label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="customerCreditLimit">信用额度</label>
                                    <input type="number" id="customerCreditLimit" name="credit_limit" min="0" step="0.01">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerDescription">描述</label>
                                <textarea id="customerDescription" name="description" rows="3"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerNotes">备注</label>
                                <textarea id="customerNotes" name="notes" rows="3"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerTags">标签</label>
                                <input type="text" id="customerTags" name="tags" placeholder="用逗号分隔多个标签">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal('customerModal')">
                            取消
                        </button>
                        <button class="btn btn-primary" onclick="CustomerManager.saveCustomer()">
                            <i class="fas fa-save"></i> 保存
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 客户详情模态框 -->
            <div class="modal" id="customerDetailModal">
                <div class="modal-content modal-xl">
                    <div class="modal-header">
                        <h3 class="modal-title">客户详情</h3>
                        <button class="modal-close" onclick="UI.closeModal('customerDetailModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="customerDetailContent">
                        <!-- 详情内容将通过JavaScript动态加载 -->
                    </div>
                </div>
            </div>
        `;
    },
    
    // 绑定事件
    bindEvents() {
        // 搜索框
        const searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadCustomers();
            }, 300));
        }
        
        // 筛选器
        const filterSelects = ['statusFilter', 'typeFilter', 'levelFilter', 'industryFilter'];
        filterSelects.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', (e) => {
                    const filterKey = filterId.replace('Filter', '');
                    this.filters[filterKey] = e.target.value;
                    this.currentPage = 1;
                    this.loadCustomers();
                });
            }
        });
        
        // 页面大小选择
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                CONFIG.PAGINATION.PAGE_SIZE = parseInt(e.target.value);
                this.currentPage = 1;
                this.loadCustomers();
            });
        }
        
        // 表格排序
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sortable')) {
                const th = e.target.closest('.sortable');
                const field = th.getAttribute('data-field');
                this.handleSort(field);
            }
        });
        
        // 客户表单提交
        const customerForm = document.getElementById('customerForm');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCustomer();
            });
        }
    },
    
    // 加载客户列表
    async loadCustomers() {
        const tableBody = document.getElementById('customersTableBody');
        const customerCount = document.getElementById('customerCount');
        
        try {
            UI.showLoading(tableBody, '加载客户数据...');
            
            const params = {
                page: this.currentPage,
                page_size: CONFIG.PAGINATION.PAGE_SIZE,
                ...this.filters,
                sort_field: this.sort.field,
                sort_order: this.sort.order
            };
            
            // 移除空值
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });
            
            const response = await API.customers.getList(params);
            const data = response.data;
            
            this.customers = data.customers || [];
            this.totalCount = data.total || 0;
            this.totalPages = Math.ceil(this.totalCount / CONFIG.PAGINATION.PAGE_SIZE);
            
            this.renderCustomersTable();
            this.renderPagination();
            
            // 更新计数
            if (customerCount) {
                customerCount.textContent = `共 ${this.totalCount} 个客户`;
            }
            
        } catch (error) {
            Utils.log.error('加载客户列表失败:', error);
            UI.showNotification('error', '加载失败', error.message || '加载客户列表时发生错误');
            UI.showEmptyState(tableBody, '加载失败', 'fas fa-exclamation-triangle');
        } finally {
            UI.hideLoading(tableBody);
        }
    },
    
    // 渲染客户表格
    renderCustomersTable() {
        const tableBody = document.getElementById('customersTableBody');
        
        if (this.customers.length === 0) {
            UI.showEmptyState(tableBody, '暂无客户数据', 'fas fa-users');
            return;
        }
        
        tableBody.innerHTML = this.customers.map(customer => `
            <tr>
                <td>
                    <div class="customer-name">
                        <strong>${Utils.string.escapeHtml(customer.name)}</strong>
                        ${customer.tags ? `<div class="customer-tags">${this.renderTags(customer.tags)}</div>` : ''}
                    </div>
                </td>
                <td>${Utils.string.escapeHtml(customer.company || '-')}</td>
                <td>${Utils.string.escapeHtml(customer.contact || '-')}</td>
                <td>
                    <div class="contact-info">
                        ${customer.phone ? `<div><i class="fas fa-phone"></i> ${customer.phone}</div>` : ''}
                        ${customer.email ? `<div><i class="fas fa-envelope"></i> ${customer.email}</div>` : ''}
                    </div>
                </td>
                <td>${Utils.string.escapeHtml(customer.industry || '-')}</td>
                <td>${this.renderCustomerType(customer.type)}</td>
                <td>${this.renderCustomerLevel(customer.level)}</td>
                <td>${UI.createStatusBadge(customer.status, 'customer').outerHTML}</td>
                <td>${customer.last_contact_date ? Utils.date.formatRelative(customer.last_contact_date) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="CustomerManager.viewCustomer(${customer.id})" data-tooltip="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="CustomerManager.editCustomer(${customer.id})" data-tooltip="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="CustomerManager.updateLastContact(${customer.id})" data-tooltip="更新联系时间">
                            <i class="fas fa-clock"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="CustomerManager.deleteCustomer(${customer.id})" data-tooltip="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // 重新初始化工具提示
        UI.initTooltips();
    },
    
    // 渲染标签
    renderTags(tags) {
        if (!tags) return '';
        
        const tagList = Array.isArray(tags) ? tags : tags.split(',');
        return tagList.map(tag => 
            `<span class="tag">${Utils.string.escapeHtml(tag.trim())}</span>`
        ).join('');
    },
    
    // 渲染客户类型
    renderCustomerType(type) {
        const typeConfig = CONFIG.CUSTOMER_TYPE[type];
        if (typeConfig) {
            return `<span class="badge badge-${typeConfig.color}">${typeConfig.label}</span>`;
        }
        return type || '-';
    },
    
    // 渲染客户等级
    renderCustomerLevel(level) {
        const levelConfig = CONFIG.CUSTOMER_LEVEL[level];
        if (levelConfig) {
            return `<span class="badge badge-${levelConfig.color}">${levelConfig.label}</span>`;
        }
        return level || '-';
    },
    
    // 渲染分页
    renderPagination() {
        const paginationContainer = document.getElementById('customersPagination');
        UI.createPagination(
            paginationContainer,
            this.currentPage,
            this.totalPages,
            (page) => {
                this.currentPage = page;
                this.loadCustomers();
            }
        );
    },
    
    // 处理排序
    handleSort(field) {
        if (this.sort.field === field) {
            this.sort.order = this.sort.order === 'asc' ? 'desc' : 'asc';
        } else {
            this.sort.field = field;
            this.sort.order = 'asc';
        }
        
        this.currentPage = 1;
        this.loadCustomers();
        
        // 更新排序图标
        this.updateSortIcons();
    },
    
    // 更新排序图标
    updateSortIcons() {
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            const field = header.getAttribute('data-field');
            const icon = header.querySelector('i');
            
            if (field === this.sort.field) {
                icon.className = this.sort.order === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            } else {
                icon.className = 'fas fa-sort';
            }
        });
    },
    
    // 重置筛选条件
    resetFilters() {
        this.filters = {
            search: '',
            status: '',
            type: '',
            level: '',
            industry: '',
            source: ''
        };
        
        // 重置表单
        document.getElementById('customerSearch').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('levelFilter').value = '';
        document.getElementById('industryFilter').value = '';
        
        this.currentPage = 1;
        this.loadCustomers();
    },
    
    // 显示添加客户模态框
    showAddModal() {
        document.getElementById('customerModalTitle').textContent = '添加客户';
        document.getElementById('customerForm').reset();
        document.getElementById('customerId').value = '';
        
        // 设置默认值
        document.getElementById('customerStatus').value = 'potential';
        document.getElementById('customerType').value = 'individual';
        
        UI.showModal('customerModal');
    },
    
    // 编辑客户
    async editCustomer(customerId) {
        try {
            const response = await API.customers.getById(customerId);
            const customer = response.data.customer;
            
            document.getElementById('customerModalTitle').textContent = '编辑客户';
            
            // 填充表单
            document.getElementById('customerId').value = customer.id;
            document.getElementById('customerName').value = customer.name || '';
            document.getElementById('customerCompany').value = customer.company || '';
            document.getElementById('customerIndustry').value = customer.industry || '';
            document.getElementById('customerType').value = customer.type || '';
            document.getElementById('customerContact').value = customer.contact || '';
            document.getElementById('customerPhone').value = customer.phone || '';
            document.getElementById('customerEmail').value = customer.email || '';
            document.getElementById('customerAddress').value = customer.address || '';
            document.getElementById('customerSource').value = customer.source || '';
            document.getElementById('customerLevel').value = customer.level || '';
            document.getElementById('customerStatus').value = customer.status || '';
            document.getElementById('customerCreditLimit').value = customer.credit_limit || '';
            document.getElementById('customerDescription').value = customer.description || '';
            document.getElementById('customerNotes').value = customer.notes || '';
            
            // 处理标签
            if (customer.tags) {
                const tags = Array.isArray(customer.tags) ? customer.tags.join(', ') : customer.tags;
                document.getElementById('customerTags').value = tags;
            }
            
            UI.showModal('customerModal');
            
        } catch (error) {
            Utils.log.error('获取客户信息失败:', error);
            UI.showNotification('error', '加载失败', error.message || '获取客户信息时发生错误');
        }
    },
    
    // 查看客户详情
    async viewCustomer(customerId) {
        try {
            UI.showLoading('customerDetailContent', '加载客户详情...');
            UI.showModal('customerDetailModal');
            
            const response = await API.customers.getById(customerId);
            const customer = response.data.customer;
            
            // 渲染客户详情
            this.renderCustomerDetail(customer);
            
        } catch (error) {
            Utils.log.error('获取客户详情失败:', error);
            UI.showNotification('error', '加载失败', error.message || '获取客户详情时发生错误');
            UI.closeModal('customerDetailModal');
        } finally {
            UI.hideLoading('customerDetailContent');
        }
    },
    
    // 渲染客户详情
    renderCustomerDetail(customer) {
        const content = document.getElementById('customerDetailContent');
        content.innerHTML = `
            <div class="customer-detail">
                <div class="detail-header">
                    <div class="customer-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="customer-info">
                        <h3>${Utils.string.escapeHtml(customer.name)}</h3>
                        <p class="customer-company">${Utils.string.escapeHtml(customer.company || '')}</p>
                        <div class="customer-badges">
                            ${UI.createStatusBadge(customer.status, 'customer').outerHTML}
                            ${this.renderCustomerType(customer.type)}
                            ${this.renderCustomerLevel(customer.level)}
                        </div>
                    </div>
                    <div class="detail-actions">
                        <button class="btn btn-outline" onclick="CustomerManager.editCustomer(${customer.id})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-outline" onclick="CustomerManager.updateLastContact(${customer.id})">
                            <i class="fas fa-clock"></i> 更新联系时间
                        </button>
                    </div>
                </div>
                
                <div class="detail-tabs">
                    <div class="tabs">
                        <div class="tab-buttons">
                            <button class="tab-button active" data-tab="basicInfo">基本信息</button>
                            <button class="tab-button" data-tab="businessInfo">业务信息</button>
                            <button class="tab-button" data-tab="contactHistory">联系记录</button>
                            <button class="tab-button" data-tab="relatedData">相关数据</button>
                        </div>
                        
                        <div class="tab-content active" id="basicInfo">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>客户名称</label>
                                    <span>${Utils.string.escapeHtml(customer.name)}</span>
                                </div>
                                <div class="info-item">
                                    <label>公司名称</label>
                                    <span>${Utils.string.escapeHtml(customer.company || '-')}</span>
                                </div>
                                <div class="info-item">
                                    <label>行业</label>
                                    <span>${Utils.string.escapeHtml(customer.industry || '-')}</span>
                                </div>
                                <div class="info-item">
                                    <label>联系人</label>
                                    <span>${Utils.string.escapeHtml(customer.contact || '-')}</span>
                                </div>
                                <div class="info-item">
                                    <label>联系电话</label>
                                    <span>${Utils.string.escapeHtml(customer.phone || '-')}</span>
                                </div>
                                <div class="info-item">
                                    <label>邮箱</label>
                                    <span>${Utils.string.escapeHtml(customer.email || '-')}</span>
                                </div>
                                <div class="info-item">
                                    <label>地址</label>
                                    <span>${Utils.string.escapeHtml(customer.address || '-')}</span>
                                </div>
                                <div class="info-item">
                                    <label>客户来源</label>
                                    <span>${Utils.string.escapeHtml(customer.source || '-')}</span>
                                </div>
                            </div>
                            
                            ${customer.description ? `
                                <div class="info-section">
                                    <h4>描述</h4>
                                    <p>${Utils.string.escapeHtml(customer.description)}</p>
                                </div>
                            ` : ''}
                            
                            ${customer.notes ? `
                                <div class="info-section">
                                    <h4>备注</h4>
                                    <p>${Utils.string.escapeHtml(customer.notes)}</p>
                                </div>
                            ` : ''}
                            
                            ${customer.tags ? `
                                <div class="info-section">
                                    <h4>标签</h4>
                                    <div class="tags-list">${this.renderTags(customer.tags)}</div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="tab-content" id="businessInfo">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>客户类型</label>
                                    <span>${this.renderCustomerType(customer.type)}</span>
                                </div>
                                <div class="info-item">
                                    <label>客户等级</label>
                                    <span>${this.renderCustomerLevel(customer.level)}</span>
                                </div>
                                <div class="info-item">
                                    <label>客户状态</label>
                                    <span>${UI.createStatusBadge(customer.status, 'customer').outerHTML}</span>
                                </div>
                                <div class="info-item">
                                    <label>信用额度</label>
                                    <span>${customer.credit_limit ? Utils.number.formatCurrency(customer.credit_limit) : '-'}</span>
                                </div>
                                <div class="info-item">
                                    <label>销售员</label>
                                    <span>${Utils.string.escapeHtml(customer.salesperson_name || '-')}</span>
                                </div>
                                <div class="info-item">
                                    <label>首次接触</label>
                                    <span>${customer.first_contact_date ? Utils.date.format(customer.first_contact_date) : '-'}</span>
                                </div>
                                <div class="info-item">
                                    <label>最后联系</label>
                                    <span>${customer.last_contact_date ? Utils.date.formatDateTime(customer.last_contact_date) : '-'}</span>
                                </div>
                                <div class="info-item">
                                    <label>下次跟进</label>
                                    <span>${customer.next_follow_date ? Utils.date.format(customer.next_follow_date) : '-'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-content" id="contactHistory">
                            <div class="coming-soon">
                                <i class="fas fa-history"></i>
                                <p>联系记录功能即将上线</p>
                            </div>
                        </div>
                        
                        <div class="tab-content" id="relatedData">
                            <div class="coming-soon">
                                <i class="fas fa-link"></i>
                                <p>相关数据功能即将上线</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // 保存客户
    async saveCustomer() {
        const form = document.getElementById('customerForm');
        const formData = new FormData(form);
        
        // 验证表单
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const customerData = {
            name: formData.get('name'),
            company: formData.get('company'),
            industry: formData.get('industry'),
            type: formData.get('type'),
            contact: formData.get('contact'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            source: formData.get('source'),
            level: formData.get('level'),
            status: formData.get('status'),
            credit_limit: formData.get('credit_limit') ? parseFloat(formData.get('credit_limit')) : null,
            description: formData.get('description'),
            notes: formData.get('notes'),
            tags: formData.get('tags')
        };
        
        // 移除空值
        Object.keys(customerData).forEach(key => {
            if (customerData[key] === '' || customerData[key] === null) {
                delete customerData[key];
            }
        });
        
        const customerId = formData.get('id');
        const isEdit = !!customerId;
        
        try {
            if (isEdit) {
                await API.customers.update(customerId, customerData);
                UI.showNotification('success', '更新成功', '客户信息已更新');
            } else {
                await API.customers.create(customerData);
                UI.showNotification('success', '添加成功', '客户已添加');
            }
            
            UI.closeModal('customerModal');
            this.loadCustomers();
            
        } catch (error) {
            Utils.log.error('保存客户失败:', error);
            UI.showNotification('error', '保存失败', error.message || '保存客户信息时发生错误');
        }
    },
    
    // 删除客户
    async deleteCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        UI.showConfirm(
            '确认删除',
            `确定要删除客户 "${customer.name}" 吗？此操作不可恢复。`,
            async () => {
                try {
                    await API.customers.delete(customerId);
                    UI.showNotification('success', '删除成功', '客户已删除');
                    this.loadCustomers();
                } catch (error) {
                    Utils.log.error('删除客户失败:', error);
                    UI.showNotification('error', '删除失败', error.message || '删除客户时发生错误');
                }
            }
        );
    },
    
    // 更新最后联系时间
    async updateLastContact(customerId) {
        try {
            await API.customers.updateLastContact(customerId);
            UI.showNotification('success', '更新成功', '最后联系时间已更新');
            this.loadCustomers();
        } catch (error) {
            Utils.log.error('更新联系时间失败:', error);
            UI.showNotification('error', '更新失败', error.message || '更新联系时间时发生错误');
        }
    },
    
    // 导出客户
    async exportCustomers() {
        try {
            UI.showNotification('info', '导出中', '正在准备导出文件...');
            
            const params = {
                ...this.filters,
                sort_field: this.sort.field,
                sort_order: this.sort.order
            };
            
            // 移除空值
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });
            
            const response = await API.customers.export(params);
            
            // 创建下载链接
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `客户列表_${Utils.date.format(new Date(), 'YYYY-MM-DD')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            UI.showNotification('success', '导出成功', '客户列表已导出');
            
        } catch (error) {
            Utils.log.error('导出客户失败:', error);
            UI.showNotification('error', '导出失败', error.message || '导出客户列表时发生错误');
        }
    }
};

// 导出客户管理对象
window.CustomerManager = CustomerManager;