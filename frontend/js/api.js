// API接口管理
const API = {
    // 基础配置
    baseURL: CONFIG.API.BASE_URL,
    timeout: CONFIG.API.TIMEOUT,
    
    // 请求拦截器
    interceptors: {
        request: [],
        response: []
    },
    
    // 添加请求拦截器
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    },
    
    // 添加响应拦截器
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    },
    
    // URL拼接函数
    joinUrl(base, path) {
        const a = base.endsWith('/') ? base.slice(0, -1) : base;
        const b = path.startsWith('/') ? path.slice(1) : path;
        return `${a}/${b}`;
    },
    
    // 基础请求方法
    async request(url, options = {}) {
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };
        
        // 添加认证头
        const token = Utils.storage.get(CONFIG.AUTH.TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 执行请求拦截器
        for (const interceptor of this.interceptors.request) {
            await interceptor(config);
        }
        
        const fullUrl = url.startsWith('http') ? url : this.joinUrl(this.baseURL, url);
        
        try {
            Utils.log.debug('API请求:', config.method, fullUrl, config);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(fullUrl, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            const result = {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config
            };
            
            // 执行响应拦截器
            for (const interceptor of this.interceptors.response) {
                await interceptor(result);
            }
            
            if (!response.ok) {
                throw new Error(data.message || response.statusText);
            }
            
            Utils.log.debug('API响应:', result);
            return result;
            
        } catch (error) {
            Utils.log.error('API错误:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            
            // 处理网络错误
            if (!navigator.onLine) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            }
            
            throw error;
        }
    },
    
    // GET请求
    async get(url, params = {}, options = {}) {
        const queryString = Utils.url.buildQuery(params);
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        return this.request(fullUrl, {
            method: 'GET',
            ...options
        });
    },
    
    // POST请求
    async post(url, data = {}, options = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    },
    
    // PUT请求
    async put(url, data = {}, options = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    },
    
    // PATCH请求
    async patch(url, data = {}, options = {}) {
        return this.request(url, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    },
    
    // DELETE请求
    async delete(url, options = {}) {
        return this.request(url, {
            method: 'DELETE',
            ...options
        });
    },
    
    // 文件上传
    async upload(url, file, data = {}, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        
        return this.request(url, {
            method: 'POST',
            body: formData,
            headers: {}, // 让浏览器自动设置Content-Type
            onProgress
        });
    },
    
    // 认证相关API
    auth: {
        // 用户登录
        async login(credentials) {
            try {
                const response = await API.post('/auth/login', credentials);
                
                if (response.data.access_token) {
                    Utils.storage.set(CONFIG.AUTH.TOKEN_KEY, response.data.access_token);
                    if (response.data.refresh_token) {
                        Utils.storage.set(CONFIG.AUTH.REFRESH_TOKEN_KEY, response.data.refresh_token);
                    }
                    if (response.data.user) {
                        Utils.storage.set(CONFIG.AUTH.USER_KEY, response.data.user);
                    }
                }
                
                return response;
            } catch (error) {
                throw error;
            }
        },
        
        // 用户注册
        async register(userData) {
            return API.post('/auth/register', userData);
        },
        
        // 刷新令牌
        async refreshToken() {
            const refreshToken = Utils.storage.get(CONFIG.AUTH.REFRESH_TOKEN_KEY);
            if (!refreshToken) {
                throw new Error('没有刷新令牌');
            }
            
            const response = await API.post('/auth/refresh', {
                refresh_token: refreshToken
            });
            
            if (response.data.access_token) {
                Utils.storage.set(CONFIG.AUTH.TOKEN_KEY, response.data.access_token);
            }
            
            return response;
        },
        
        // 用户登出
        async logout() {
            try {
                await API.post('/auth/logout');
            } catch (error) {
                Utils.log.warn('登出请求失败:', error);
            } finally {
                Utils.storage.remove(CONFIG.AUTH.TOKEN_KEY);
                Utils.storage.remove(CONFIG.AUTH.REFRESH_TOKEN_KEY);
                Utils.storage.remove(CONFIG.AUTH.USER_KEY);
            }
        },
        
        // 获取当前用户信息
        async getCurrentUser() {
            return API.get('/auth/me');
        },
        
        // 更新用户信息
        async updateProfile(userData) {
            const response = await API.put('/auth/profile', userData);
            
            if (response.data.user) {
                Utils.storage.set(CONFIG.AUTH.USER_KEY, response.data.user);
            }
            
            return response;
        },
        
        // 修改密码
        async changePassword(passwordData) {
            return API.post('/auth/change-password', passwordData);
        }
    },

    // 仪表盘相关API
    dashboard: {
        async getDashboardStats() {
            return API.get('/dashboard/stats');
        },
        async getDashboard() {
            return API.get('/stats/dashboard');
        },
        async getRecentActivities(params) {
            return API.get('/stats/recent-activities', params);
        }
    },
    
    // 客户管理API
    customers: {
        // 获取客户列表
        async getList(params = {}) {
            return API.get('/customers', params);
        },
        
        // 获取客户详情
        async getById(id) {
            return API.get(`/customers/${id}`);
        },
        
        // 创建客户
        async create(customerData) {
            return API.post('/customers', customerData);
        },
        
        // 更新客户
        async update(id, customerData) {
            return API.put(`/customers/${id}`, customerData);
        },
        
        // 删除客户
        async delete(id) {
            return API.delete(`/customers/${id}`);
        },
        
        // 更新最后接触日期
        async updateLastContact(id) {
            return API.patch(`/customers/${id}/last-contact`);
        },
        
        // 获取客户统计
        async getStats() {
            return API.get('/customers/stats');
        },
        
        // 搜索客户
        async search(query, params = {}) {
            return API.get('/customers/search', { q: query, ...params });
        }
    },
    
    // 报价管理API
    quotes: {
        // 获取报价列表
        async getList(params = {}) {
            return API.get('/quotes', params);
        },
        
        // 获取报价详情
        async getById(id) {
            return API.get(`/quotes/${id}`);
        },
        
        // 创建报价
        async create(quoteData) {
            return API.post('/quotes', quoteData);
        },
        
        // 更新报价
        async update(id, quoteData) {
            return API.put(`/quotes/${id}`, quoteData);
        },
        
        // 删除报价
        async delete(id) {
            return API.delete(`/quotes/${id}`);
        },
        
        // 发送报价
        async send(id, emailData = {}) {
            return API.post(`/quotes/${id}/send`, emailData);
        },
        
        // 接受报价
        async accept(id) {
            return API.post(`/quotes/${id}/accept`);
        },
        
        // 拒绝报价
        async reject(id, reason = '') {
            return API.post(`/quotes/${id}/reject`, { reason });
        },
        
        // 复制报价
        async copy(id) {
            return API.post(`/quotes/${id}/copy`);
        },
        
        // 导出报价
        async export(id, format = 'pdf') {
            return API.get(`/quotes/${id}/export`, { format });
        }
    },
    
    // 合同管理API
    contracts: {
        // 获取合同列表
        async getList(params = {}) {
            return API.get('/contracts', params);
        },
        
        // 获取合同详情
        async getById(id) {
            return API.get(`/contracts/${id}`);
        },
        
        // 创建合同
        async create(contractData) {
            return API.post('/contracts', contractData);
        },
        
        // 更新合同
        async update(id, contractData) {
            return API.put(`/contracts/${id}`, contractData);
        },
        
        // 删除合同
        async delete(id) {
            return API.delete(`/contracts/${id}`);
        },
        
        // 签署合同
        async sign(id, signData) {
            return API.post(`/contracts/${id}/sign`, signData);
        },
        
        // 开始执行
        async start(id) {
            return API.post(`/contracts/${id}/start`);
        },
        
        // 完成合同
        async complete(id) {
            return API.post(`/contracts/${id}/complete`);
        },
        
        // 终止合同
        async terminate(id, reason = '') {
            return API.post(`/contracts/${id}/terminate`, { reason });
        },
        
        // 添加付款记录
        async addPayment(id, paymentData) {
            return API.post(`/contracts/${id}/payments`, paymentData);
        },
        
        // 获取付款记录
        async getPayments(id) {
            return API.get(`/contracts/${id}/payments`);
        },
        
        // 上传合同文件
        async uploadFile(id, file) {
            return API.upload(`/contracts/${id}/upload`, file);
        }
    },
    
    // 订单管理API
    orders: {
        // 获取订单列表
        async getList(params = {}) {
            return API.get('/orders', params);
        },
        
        // 获取订单详情
        async getById(id) {
            return API.get(`/orders/${id}`);
        },
        
        // 创建订单
        async create(orderData) {
            return API.post('/orders', orderData);
        },
        
        // 更新订单
        async update(id, orderData) {
            return API.put(`/orders/${id}`, orderData);
        },
        
        // 删除订单
        async delete(id) {
            return API.delete(`/orders/${id}`);
        },
        
        // 确认订单
        async confirm(id) {
            return API.post(`/orders/${id}/confirm`);
        },
        
        // 开始处理
        async process(id) {
            return API.post(`/orders/${id}/process`);
        },
        
        // 发货
        async ship(id, shippingData) {
            return API.post(`/orders/${id}/ship`, shippingData);
        },
        
        // 交付
        async deliver(id, deliveryData = {}) {
            return API.post(`/orders/${id}/deliver`, deliveryData);
        },
        
        // 完成订单
        async complete(id) {
            return API.post(`/orders/${id}/complete`);
        },
        
        // 取消订单
        async cancel(id, reason = '') {
            return API.post(`/orders/${id}/cancel`, { reason });
        },
        
        // 更新交付进度
        async updateDelivery(id, itemId, quantity) {
            return API.patch(`/orders/${id}/items/${itemId}/delivery`, { quantity });
        },
        
        // 获取物流信息
        async getTracking(id) {
            return API.get(`/orders/${id}/tracking`);
        }
    },
    
    // 统计分析API
    analytics: {
        // 获取仪表盘数据
        async getDashboard(params = {}) {
            return API.get('/analytics/dashboard', params);
        },
        
        // 获取销售统计
        async getSalesStats(params = {}) {
            return API.get('/analytics/sales', params);
        },
        
        // 获取客户统计
        async getCustomerStats(params = {}) {
            return API.get('/analytics/customers', params);
        },
        
        // 获取产品统计
        async getProductStats(params = {}) {
            return API.get('/analytics/products', params);
        },
        
        // 获取趋势数据
        async getTrends(type, params = {}) {
            return API.get(`/analytics/trends/${type}`, params);
        }
    },
    
    // 系统设置API
    settings: {
        // 获取系统设置
        async get() {
            return API.get('/settings');
        },
        
        // 更新系统设置
        async update(settings) {
            return API.put('/settings', settings);
        },
        
        // 获取用户设置
        async getUserSettings() {
            return API.get('/settings/user');
        },
        
        // 更新用户设置
        async updateUserSettings(settings) {
            return API.put('/settings/user', settings);
        }
    }
};

// 添加默认拦截器
API.addRequestInterceptor(async (config) => {
    // 添加时间戳防止缓存
    if (config.method === 'GET') {
        const url = new URL(config.url || '', API.baseURL);
        url.searchParams.set('_t', Date.now().toString());
        config.url = url.pathname + url.search;
    }
});

API.addResponseInterceptor(async (response) => {
    // 处理认证错误
    if (response.status === 401) {
        // 尝试刷新令牌
        try {
            await API.auth.refreshToken();
            // 重新发起原请求
            return API.request(response.config.url, response.config);
        } catch (error) {
            // 刷新失败，跳转到登录页
            Utils.storage.clear();
            window.location.href = '#login';
            throw new Error(CONFIG.ERROR_MESSAGES.UNAUTHORIZED);
        }
    }
    
    // 处理其他HTTP错误
    if (response.status >= 400) {
        let message = CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR;
        
        switch (response.status) {
            case 403:
                message = CONFIG.ERROR_MESSAGES.FORBIDDEN;
                break;
            case 404:
                message = CONFIG.ERROR_MESSAGES.NOT_FOUND;
                break;
            case 422:
                message = CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
                break;
            case 500:
                message = CONFIG.ERROR_MESSAGES.SERVER_ERROR;
                break;
        }
        
        if (response.data && response.data.message) {
            message = response.data.message;
        }
        
        throw new Error(message);
    }
});

// 导出API对象
window.API = API;