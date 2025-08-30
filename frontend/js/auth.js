// 认证管理
const Auth = {
    // 当前用户信息
    currentUser: null,
    
    // 初始化认证
    init() {
        this.loadUserFromStorage();
        this.bindEvents();
        this.checkAuthStatus();
    },
    
    // 从存储中加载用户信息
    loadUserFromStorage() {
        const user = Utils.storage.get(CONFIG.AUTH.USER_KEY);
        if (user) {
            this.currentUser = user;
        }
    },
    
    // 绑定事件
    bindEvents() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
        
        // 显示注册页面
        const showRegisterBtn = document.getElementById('showRegister');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterPage();
            });
        }
        
        // 显示登录页面
        const showLoginBtn = document.getElementById('showLogin');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginPage();
            });
        }
        
        // 登出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
        
        // 用户菜单
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });
            
            // 点击其他地方关闭菜单
            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }
    },
    
    // 检查认证状态
    checkAuthStatus() {
        const token = Utils.storage.get(CONFIG.AUTH.TOKEN_KEY);
        const user = Utils.storage.get(CONFIG.AUTH.USER_KEY);
        
        // 如果没有token或用户信息，或者token无效，显示登录页面
        if (!token || !user || !this.isValidToken(token)) {
            this.clearAuthData();
            this.showLoginPage();
        } else {
            // 恢复用户信息
            this.currentUser = user;
            this.showMainApp();
        }
    },
    
    // 处理登录
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        // 验证输入
        const validation = this.validateLoginForm(credentials);
        if (!validation.valid) {
            UI.showNotification('error', '登录失败', validation.errors.join('\n'));
            return;
        }
        
        // 显示加载状态
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
        submitBtn.disabled = true;
        
        try {
            const response = await API.auth.login(credentials);
            
            if (response.data.user && response.data.access_token) {
                // 保存用户信息和token
                this.currentUser = response.data.user;
                App.init();
                Utils.storage.set(CONFIG.AUTH.TOKEN_KEY, response.data.access_token);
                Utils.storage.set(CONFIG.AUTH.USER_KEY, response.data.user);
                
                if (response.data.refresh_token) {
                    Utils.storage.set(CONFIG.AUTH.REFRESH_TOKEN_KEY, response.data.refresh_token);
                }
                
                this.updateUserDisplay();
                this.showMainApp();
                
                UI.showNotification('success', '登录成功', `欢迎回来，${this.currentUser.real_name || this.currentUser.username}！`);
                
                // 清空表单
                form.reset();
            } else {
                throw new Error('登录响应数据不完整');
            }
            
        } catch (error) {
            Utils.log.error('登录失败:', error);
            UI.showNotification('error', '登录失败', error.message || '用户名或密码错误');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },
    
    // 处理注册
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            real_name: formData.get('real_name'),
            phone: formData.get('phone'),
            department: formData.get('department'),
            password: formData.get('password'),
            confirm_password: formData.get('confirm_password')
        };
        
        // 验证输入
        const validation = this.validateRegisterForm(userData);
        if (!validation.valid) {
            UI.showNotification('error', '注册失败', validation.errors.join('\n'));
            return;
        }
        
        // 显示加载状态
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';
        submitBtn.disabled = true;
        
        try {
            // 移除确认密码字段
            delete userData.confirm_password;
            
            await API.auth.register(userData);
            
            UI.showNotification('success', '注册成功', '账户创建成功，请登录');
            
            // 清空表单并跳转到登录页
            form.reset();
            this.showLoginPage();
            
        } catch (error) {
            Utils.log.error('注册失败:', error);
            UI.showNotification('error', '注册失败', error.message || '注册过程中发生错误');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },
    
    // 处理登出
    async handleLogout() {
        if (!confirm(CONFIG.CONFIRM_MESSAGES.LOGOUT)) {
            return;
        }
        
        try {
            await API.auth.logout();
        } catch (error) {
            Utils.log.warn('登出请求失败:', error);
        } finally {
            this.clearAuthData();
            this.showLoginPage();
            UI.showNotification('success', '退出成功', '您已安全退出系统');
        }
    },

    // 清除认证数据
    clearAuthData() {
        Utils.storage.remove(CONFIG.AUTH.TOKEN_KEY);
        Utils.storage.remove(CONFIG.AUTH.REFRESH_TOKEN_KEY);
        Utils.storage.remove(CONFIG.AUTH.USER_KEY);
        this.currentUser = null;
    },

    // 验证token有效性（简化版本）
    isValidToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        
        // 检查token长度
        if (token.length < 10) {
            return false;
        }
        
        // 如果是模拟token，检查特定格式
        if (token.startsWith('mock_token_')) {
            return true;
        }
        
        // 如果是JWT格式，检查是否过期
        if (token.includes('.')) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp && payload.exp < Date.now() / 1000) {
                    return false;
                }
                return true;
            } catch (e) {
                return false;
            }
        }
        
        return true;
    },
    
    async validateToken() {
        try {
            const token = Utils.storage.get(CONFIG.AUTH.TOKEN_KEY);
            return this.isValidToken(token);
        } catch (error) {
            Utils.log.error('Token验证失败:', error);
            return false;
        }
    },
    
    // 验证登录表单
    validateLoginForm(credentials) {
        const errors = [];
        
        if (!Utils.validate.required(credentials.username)) {
            errors.push('请输入用户名');
        }
        
        if (!Utils.validate.required(credentials.password)) {
            errors.push('请输入密码');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    // 验证注册表单
    validateRegisterForm(userData) {
        const errors = [];
        
        // 验证用户名
        const usernameValidation = Utils.validate.username(userData.username);
        if (!usernameValidation.valid) {
            errors.push(...usernameValidation.errors);
        }
        
        // 验证邮箱
        if (!Utils.validate.required(userData.email)) {
            errors.push('请输入邮箱');
        } else if (!Utils.validate.email(userData.email)) {
            errors.push('邮箱格式不正确');
        }
        
        // 验证真实姓名
        if (!Utils.validate.required(userData.real_name)) {
            errors.push('请输入真实姓名');
        }
        
        // 验证手机号（可选）
        if (userData.phone && !Utils.validate.phone(userData.phone)) {
            errors.push('手机号格式不正确');
        }
        
        // 验证密码
        const passwordValidation = Utils.validate.password(userData.password);
        if (!passwordValidation.valid) {
            errors.push(...passwordValidation.errors);
        }
        
        // 验证确认密码
        if (userData.password !== userData.confirm_password) {
            errors.push('两次输入的密码不一致');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    // 显示登录页面
    showLoginPage() {
        this.hideAllPages();
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.classList.add('active');
            // 禁用页面滚动
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
        }
    },
    
    // 显示注册页面
    showRegisterPage() {
        this.hideAllPages();
        const registerPage = document.getElementById('registerPage');
        if (registerPage) {
            registerPage.classList.add('active');
            // 禁用页面滚动
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
        }
    },
    
    // 显示主应用
    showMainApp() {
        this.hideAllPages();
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.classList.add('active');
            this.updateUserDisplay();
            
            // 恢复页面滚动
            document.body.style.overflow = '';
            document.body.style.height = '';
            
            // 初始化主应用
            if (window.App && typeof window.App.init === 'function') {
                window.App.init();
            }
        }
    },
    
    // 隐藏所有页面
    hideAllPages() {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
    },
    
    // 更新用户显示
    updateUserDisplay() {
        if (!this.currentUser) return;
        
        const userNameElement = document.getElementById('currentUserName');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.real_name || this.currentUser.username;
        }
    },
    
    // 检查是否已登录
    isAuthenticated() {
        const token = Utils.storage.get(CONFIG.AUTH.TOKEN_KEY);
        return !!(token && this.currentUser);
    },
    
    // 检查用户权限
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // 管理员拥有所有权限
        if (this.currentUser.role === 'admin') return true;
        
        // 根据角色检查权限
        const rolePermissions = {
            manager: ['read', 'write', 'delete'],
            sales: ['read', 'write'],
            support: ['read']
        };
        
        const userPermissions = rolePermissions[this.currentUser.role] || [];
        return userPermissions.includes(permission);
    },
    
    // 检查用户角色
    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.role === role;
    },
    
    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    },
    
    // 更新用户信息
    async updateProfile(userData) {
        try {
            const response = await API.auth.updateProfile(userData);
            
            if (response.data.user) {
                this.currentUser = response.data.user;
                this.updateUserDisplay();
            }
            
            UI.showNotification('success', '更新成功', '个人信息已更新');
            return response;
            
        } catch (error) {
            Utils.log.error('更新个人信息失败:', error);
            UI.showNotification('error', '更新失败', error.message || '更新个人信息时发生错误');
            throw error;
        }
    },
    
    // 修改密码
    async changePassword(passwordData) {
        try {
            await API.auth.changePassword(passwordData);
            UI.showNotification('success', '修改成功', '密码已修改，请重新登录');
            
            // 延迟登出
            setTimeout(() => {
                this.handleLogout();
            }, 2000);
            
        } catch (error) {
            Utils.log.error('修改密码失败:', error);
            UI.showNotification('error', '修改失败', error.message || '修改密码时发生错误');
            throw error;
        }
    },
    
    // 刷新用户信息
    async refreshUserInfo() {
        try {
            const response = await API.auth.getCurrentUser();
            
            if (response.data.user) {
                this.currentUser = response.data.user;
                Utils.storage.set(CONFIG.AUTH.USER_KEY, this.currentUser);
                this.updateUserDisplay();
            }
            
            return response;
            
        } catch (error) {
            Utils.log.error('刷新用户信息失败:', error);
            throw error;
        }
    },
    
    // 自动刷新令牌
    startTokenRefresh() {
        // 每30分钟检查一次令牌
        setInterval(async () => {
            const token = Utils.storage.get(CONFIG.AUTH.TOKEN_KEY);
            if (token) {
                try {
                    // 这里可以添加令牌过期检查逻辑
                    // 如果令牌即将过期，自动刷新
                    await API.auth.refreshToken();
                    Utils.log.debug('令牌已自动刷新');
                } catch (error) {
                    Utils.log.warn('自动刷新令牌失败:', error);
                    // 如果刷新失败，可能需要重新登录
                    if (error.message.includes('刷新令牌')) {
                        this.handleLogout();
                    }
                }
            }
        }, 30 * 60 * 1000); // 30分钟
    }
};

// 页面加载完成后初始化认证
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    Auth.startTokenRefresh();
});

// 导出认证对象
window.Auth = Auth;