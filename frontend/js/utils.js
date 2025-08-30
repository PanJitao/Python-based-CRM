// 工具函数库
const Utils = {
    // 日期时间工具
    date: {
        /**
         * 格式化日期
         * @param {Date|string} date - 日期对象或字符串
         * @param {string} format - 格式字符串
         * @returns {string} 格式化后的日期字符串
         */
        format(date, format = CONFIG.DATE_FORMAT.DISPLAY) {
            if (!date) return '';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },
        
        /**
         * 获取相对时间描述
         * @param {Date|string} date - 日期
         * @returns {string} 相对时间描述
         */
        relative(date) {
            if (!date) return '';
            
            const now = new Date();
            const target = new Date(date);
            const diff = now - target;
            
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (seconds < 60) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 7) return `${days}天前`;
            
            return this.format(date, CONFIG.DATE_FORMAT.DATE_ONLY);
        },
        
        /**
         * 检查日期是否过期
         * @param {Date|string} date - 日期
         * @returns {boolean} 是否过期
         */
        isExpired(date) {
            if (!date) return false;
            return new Date(date) < new Date();
        },
        
        /**
         * 获取日期范围
         * @param {string} range - 范围类型 (today, yesterday, week, month, year)
         * @returns {object} 开始和结束日期
         */
        getRange(range) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            switch (range) {
                case 'today':
                    return {
                        start: today,
                        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
                    };
                case 'yesterday':
                    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                    return {
                        start: yesterday,
                        end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
                    };
                case 'week':
                    const weekStart = new Date(today.getTime() - (today.getDay() || 7) * 24 * 60 * 60 * 1000);
                    return {
                        start: weekStart,
                        end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
                    };
                case 'month':
                    return {
                        start: new Date(now.getFullYear(), now.getMonth(), 1),
                        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                    };
                case 'year':
                    return {
                        start: new Date(now.getFullYear(), 0, 1),
                        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
                    };
                default:
                    return { start: null, end: null };
            }
        }
    },
    
    // 数字和货币工具
    number: {
        /**
         * 格式化货币
         * @param {number} amount - 金额
         * @param {string} currency - 货币符号
         * @returns {string} 格式化后的货币字符串
         */
        formatCurrency(amount, currency = CONFIG.CURRENCY.SYMBOL) {
            if (amount === null || amount === undefined) return '';
            
            const num = parseFloat(amount);
            if (isNaN(num)) return '';
            
            return currency + num.toLocaleString('zh-CN', {
                minimumFractionDigits: CONFIG.CURRENCY.DECIMAL_PLACES,
                maximumFractionDigits: CONFIG.CURRENCY.DECIMAL_PLACES
            });
        },
        
        /**
         * 格式化数字
         * @param {number} num - 数字
         * @param {number} decimals - 小数位数
         * @returns {string} 格式化后的数字字符串
         */
        format(num, decimals = 0) {
            if (num === null || num === undefined) return '';
            
            const number = parseFloat(num);
            if (isNaN(number)) return '';
            
            return number.toLocaleString('zh-CN', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        },
        
        /**
         * 格式化百分比
         * @param {number} num - 数字
         * @param {number} decimals - 小数位数
         * @returns {string} 百分比字符串
         */
        formatPercent(num, decimals = 1) {
            if (num === null || num === undefined) return '';
            
            const number = parseFloat(num);
            if (isNaN(number)) return '';
            
            return (number * 100).toFixed(decimals) + '%';
        },
        
        /**
         * 生成随机数
         * @param {number} min - 最小值
         * @param {number} max - 最大值
         * @returns {number} 随机数
         */
        random(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    },
    
    // 字符串工具
    string: {
        /**
         * 截断字符串
         * @param {string} str - 字符串
         * @param {number} length - 最大长度
         * @param {string} suffix - 后缀
         * @returns {string} 截断后的字符串
         */
        truncate(str, length = 50, suffix = '...') {
            if (!str) return '';
            if (str.length <= length) return str;
            return str.substring(0, length) + suffix;
        },
        
        /**
         * 首字母大写
         * @param {string} str - 字符串
         * @returns {string} 首字母大写的字符串
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },
        
        /**
         * 驼峰命名转换
         * @param {string} str - 字符串
         * @returns {string} 驼峰命名字符串
         */
        camelCase(str) {
            if (!str) return '';
            return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
        },
        
        /**
         * 生成随机字符串
         * @param {number} length - 长度
         * @param {string} chars - 字符集
         * @returns {string} 随机字符串
         */
        random(length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },
        
        /**
         * 高亮搜索关键词
         * @param {string} text - 文本
         * @param {string} keyword - 关键词
         * @returns {string} 高亮后的HTML
         */
        highlight(text, keyword) {
            if (!text || !keyword) return text;
            
            const regex = new RegExp(`(${keyword})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        }
    },
    
    // 数组工具
    array: {
        /**
         * 数组去重
         * @param {Array} arr - 数组
         * @param {string} key - 对象数组的唯一键
         * @returns {Array} 去重后的数组
         */
        unique(arr, key = null) {
            if (!Array.isArray(arr)) return [];
            
            if (key) {
                const seen = new Set();
                return arr.filter(item => {
                    const value = item[key];
                    if (seen.has(value)) return false;
                    seen.add(value);
                    return true;
                });
            }
            
            return [...new Set(arr)];
        },
        
        /**
         * 数组分组
         * @param {Array} arr - 数组
         * @param {string|function} key - 分组键或函数
         * @returns {Object} 分组后的对象
         */
        groupBy(arr, key) {
            if (!Array.isArray(arr)) return {};
            
            return arr.reduce((groups, item) => {
                const group = typeof key === 'function' ? key(item) : item[key];
                if (!groups[group]) groups[group] = [];
                groups[group].push(item);
                return groups;
            }, {});
        },
        
        /**
         * 数组排序
         * @param {Array} arr - 数组
         * @param {string} key - 排序键
         * @param {string} order - 排序方向 (asc/desc)
         * @returns {Array} 排序后的数组
         */
        sortBy(arr, key, order = 'asc') {
            if (!Array.isArray(arr)) return [];
            
            return [...arr].sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                
                if (aVal < bVal) return order === 'asc' ? -1 : 1;
                if (aVal > bVal) return order === 'asc' ? 1 : -1;
                return 0;
            });
        },
        
        /**
         * 数组分页
         * @param {Array} arr - 数组
         * @param {number} page - 页码
         * @param {number} size - 页大小
         * @returns {Object} 分页结果
         */
        paginate(arr, page = 1, size = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE) {
            if (!Array.isArray(arr)) return { data: [], total: 0, page: 1, size };
            
            const total = arr.length;
            const start = (page - 1) * size;
            const end = start + size;
            const data = arr.slice(start, end);
            
            return {
                data,
                total,
                page,
                size,
                totalPages: Math.ceil(total / size)
            };
        }
    },
    
    // 对象工具
    object: {
        /**
         * 深拷贝
         * @param {*} obj - 对象
         * @returns {*} 拷贝后的对象
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (typeof obj === 'object') {
                const cloned = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        cloned[key] = this.deepClone(obj[key]);
                    }
                }
                return cloned;
            }
            return obj;
        },
        
        /**
         * 对象合并
         * @param {Object} target - 目标对象
         * @param {...Object} sources - 源对象
         * @returns {Object} 合并后的对象
         */
        merge(target, ...sources) {
            if (!target) target = {};
            
            sources.forEach(source => {
                if (source) {
                    Object.keys(source).forEach(key => {
                        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                            target[key] = this.merge(target[key] || {}, source[key]);
                        } else {
                            target[key] = source[key];
                        }
                    });
                }
            });
            
            return target;
        },
        
        /**
         * 获取嵌套属性值
         * @param {Object} obj - 对象
         * @param {string} path - 属性路径
         * @param {*} defaultValue - 默认值
         * @returns {*} 属性值
         */
        get(obj, path, defaultValue = null) {
            if (!obj || !path) return defaultValue;
            
            const keys = path.split('.');
            let result = obj;
            
            for (const key of keys) {
                if (result === null || result === undefined || !(key in result)) {
                    return defaultValue;
                }
                result = result[key];
            }
            
            return result;
        },
        
        /**
         * 设置嵌套属性值
         * @param {Object} obj - 对象
         * @param {string} path - 属性路径
         * @param {*} value - 值
         */
        set(obj, path, value) {
            if (!obj || !path) return;
            
            const keys = path.split('.');
            let current = obj;
            
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in current) || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            
            current[keys[keys.length - 1]] = value;
        }
    },
    
    // 验证工具
    validate: {
        /**
         * 验证邮箱
         * @param {string} email - 邮箱
         * @returns {boolean} 是否有效
         */
        email(email) {
            return CONFIG.VALIDATION.EMAIL.test(email);
        },
        
        /**
         * 验证手机号
         * @param {string} phone - 手机号
         * @returns {boolean} 是否有效
         */
        phone(phone) {
            return CONFIG.VALIDATION.PHONE.test(phone);
        },
        
        /**
         * 验证密码
         * @param {string} password - 密码
         * @returns {Object} 验证结果
         */
        password(password) {
            const result = {
                valid: true,
                errors: []
            };
            
            if (!password) {
                result.valid = false;
                result.errors.push('密码不能为空');
                return result;
            }
            
            if (password.length < CONFIG.VALIDATION.PASSWORD.MIN_LENGTH) {
                result.valid = false;
                result.errors.push(`密码长度不能少于${CONFIG.VALIDATION.PASSWORD.MIN_LENGTH}位`);
            }
            
            if (!CONFIG.VALIDATION.PASSWORD.PATTERN.test(password)) {
                result.valid = false;
                result.errors.push('密码必须包含大小写字母和数字');
            }
            
            return result;
        },
        
        /**
         * 验证用户名
         * @param {string} username - 用户名
         * @returns {Object} 验证结果
         */
        username(username) {
            const result = {
                valid: true,
                errors: []
            };
            
            if (!username) {
                result.valid = false;
                result.errors.push('用户名不能为空');
                return result;
            }
            
            if (username.length < CONFIG.VALIDATION.USERNAME.MIN_LENGTH) {
                result.valid = false;
                result.errors.push(`用户名长度不能少于${CONFIG.VALIDATION.USERNAME.MIN_LENGTH}位`);
            }
            
            if (username.length > CONFIG.VALIDATION.USERNAME.MAX_LENGTH) {
                result.valid = false;
                result.errors.push(`用户名长度不能超过${CONFIG.VALIDATION.USERNAME.MAX_LENGTH}位`);
            }
            
            if (!CONFIG.VALIDATION.USERNAME.PATTERN.test(username)) {
                result.valid = false;
                result.errors.push('用户名只能包含字母、数字和下划线');
            }
            
            return result;
        },
        
        /**
         * 验证必填字段
         * @param {*} value - 值
         * @returns {boolean} 是否有效
         */
        required(value) {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return true;
        }
    },
    
    // 本地存储工具
    storage: {
        /**
         * 设置存储项
         * @param {string} key - 键
         * @param {*} value - 值
         * @param {number} expiry - 过期时间(毫秒)
         */
        set(key, value, expiry = null) {
            const item = {
                value,
                timestamp: Date.now(),
                expiry: expiry ? Date.now() + expiry : null
            };
            
            try {
                localStorage.setItem(CONFIG.STORAGE.PREFIX + key, JSON.stringify(item));
            } catch (e) {
                console.warn('localStorage设置失败:', e);
            }
        },
        
        /**
         * 获取存储项
         * @param {string} key - 键
         * @param {*} defaultValue - 默认值
         * @returns {*} 值
         */
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(CONFIG.STORAGE.PREFIX + key);
                if (!item) return defaultValue;
                
                const parsed = JSON.parse(item);
                
                // 检查是否过期
                if (parsed.expiry && Date.now() > parsed.expiry) {
                    this.remove(key);
                    return defaultValue;
                }
                
                return parsed.value;
            } catch (e) {
                console.warn('localStorage获取失败:', e);
                return defaultValue;
            }
        },
        
        /**
         * 删除存储项
         * @param {string} key - 键
         */
        remove(key) {
            try {
                localStorage.removeItem(CONFIG.STORAGE.PREFIX + key);
            } catch (e) {
                console.warn('localStorage删除失败:', e);
            }
        },
        
        /**
         * 清空所有存储项
         */
        clear() {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(CONFIG.STORAGE.PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (e) {
                console.warn('localStorage清空失败:', e);
            }
        }
    },
    
    // URL工具
    url: {
        /**
         * 获取URL参数
         * @param {string} name - 参数名
         * @param {string} url - URL
         * @returns {string|null} 参数值
         */
        getParam(name, url = window.location.href) {
            const urlObj = new URL(url);
            return urlObj.searchParams.get(name);
        },
        
        /**
         * 设置URL参数
         * @param {Object} params - 参数对象
         * @param {boolean} replace - 是否替换历史记录
         */
        setParams(params, replace = false) {
            const url = new URL(window.location.href);
            
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    url.searchParams.set(key, params[key]);
                } else {
                    url.searchParams.delete(key);
                }
            });
            
            if (replace) {
                window.history.replaceState({}, '', url.toString());
            } else {
                window.history.pushState({}, '', url.toString());
            }
        },
        
        /**
         * 构建查询字符串
         * @param {Object} params - 参数对象
         * @returns {string} 查询字符串
         */
        buildQuery(params) {
            const searchParams = new URLSearchParams();
            
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (value !== null && value !== undefined && value !== '') {
                    searchParams.append(key, value);
                }
            });
            
            return searchParams.toString();
        }
    },
    
    // 防抖和节流
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 文件工具
    file: {
        /**
         * 获取文件扩展名
         * @param {string} filename - 文件名
         * @returns {string} 扩展名
         */
        getExtension(filename) {
            if (!filename) return '';
            const lastDot = filename.lastIndexOf('.');
            return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
        },
        
        /**
         * 格式化文件大小
         * @param {number} bytes - 字节数
         * @returns {string} 格式化后的大小
         */
        formatSize(bytes) {
            if (bytes === 0) return '0 B';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        /**
         * 验证文件类型
         * @param {string} filename - 文件名
         * @param {Array} allowedTypes - 允许的类型
         * @returns {boolean} 是否允许
         */
        validateType(filename, allowedTypes = CONFIG.UPLOAD.ALLOWED_TYPES.ALL) {
            const extension = this.getExtension(filename);
            return allowedTypes.includes(extension);
        },
        
        /**
         * 验证文件大小
         * @param {number} size - 文件大小
         * @param {number} maxSize - 最大大小
         * @returns {boolean} 是否允许
         */
        validateSize(size, maxSize = CONFIG.UPLOAD.MAX_FILE_SIZE) {
            return size <= maxSize;
        }
    },
    
    // 日志工具
    log: {
        debug(...args) {
            if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_LEVEL === 'debug') {
                console.log('[DEBUG]', ...args);
            }
        },
        
        info(...args) {
            if (CONFIG.DEBUG.ENABLED && ['debug', 'info'].includes(CONFIG.DEBUG.LOG_LEVEL)) {
                console.info('[INFO]', ...args);
            }
        },
        
        warn(...args) {
            if (CONFIG.DEBUG.ENABLED && ['debug', 'info', 'warn'].includes(CONFIG.DEBUG.LOG_LEVEL)) {
                console.warn('[WARN]', ...args);
            }
        },
        
        error(...args) {
            console.error('[ERROR]', ...args);
        }
    }
};

// 导出工具函数
window.Utils = Utils;