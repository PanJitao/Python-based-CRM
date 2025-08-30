// 应用配置
const CONFIG = {
    // API配置
    API: {
        BASE_URL: 'http://localhost:5000/api/v1',
        TIMEOUT: 30000, // 30秒超时
        RETRY_COUNT: 3, // 重试次数
        RETRY_DELAY: 1000 // 重试延迟(毫秒)
    },

    // 认证配置
    AUTH: {
        TOKEN_KEY: 'crm_access_token',
        REFRESH_TOKEN_KEY: 'crm_refresh_token',
        USER_KEY: 'crm_user_info',
        TOKEN_EXPIRY_BUFFER: 300 // 5分钟缓冲时间
    },

    // 分页配置
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
        MAX_PAGE_SIZE: 100
    },

    // 表格配置
    TABLE: {
        DEFAULT_SORT_ORDER: 'desc',
        DEFAULT_SORT_FIELD: 'created_at'
    },

    // 文件上传配置
    UPLOAD: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: {
            IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
            ALL: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']
        }
    },

    // 通知配置
    NOTIFICATION: {
        DEFAULT_DURATION: 5000, // 5秒
        SUCCESS_DURATION: 3000, // 3秒
        ERROR_DURATION: 8000, // 8秒
        WARNING_DURATION: 6000, // 6秒
        INFO_DURATION: 4000 // 4秒
    },

    // 本地存储配置
    STORAGE: {
        PREFIX: 'crm_',
        CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时
        SETTINGS_KEY: 'user_settings',
        PREFERENCES_KEY: 'user_preferences'
    },

    // 搜索配置
    SEARCH: {
        MIN_QUERY_LENGTH: 2,
        DEBOUNCE_DELAY: 300, // 300毫秒防抖
        MAX_RESULTS: 50
    },

    // 日期格式配置
    DATE_FORMAT: {
        DISPLAY: 'YYYY-MM-DD HH:mm:ss',
        DATE_ONLY: 'YYYY-MM-DD',
        TIME_ONLY: 'HH:mm:ss',
        SHORT: 'MM-DD HH:mm',
        API: 'YYYY-MM-DDTHH:mm:ss'
    },

    // 货币配置
    CURRENCY: {
        DEFAULT: 'CNY',
        SYMBOL: '¥',
        DECIMAL_PLACES: 2,
        THOUSANDS_SEPARATOR: ','
    },

    // 状态配置
    STATUS: {
        CUSTOMER: {
            ACTIVE: { value: 'active', label: '活跃', color: 'success' },
            INACTIVE: { value: 'inactive', label: '非活跃', color: 'danger' },
            POTENTIAL: { value: 'potential', label: '潜在客户', color: 'warning' }
        },
        QUOTE: {
            DRAFT: { value: 'draft', label: '草稿', color: 'secondary' },
            SENT: { value: 'sent', label: '已发送', color: 'info' },
            ACCEPTED: { value: 'accepted', label: '已接受', color: 'success' },
            REJECTED: { value: 'rejected', label: '已拒绝', color: 'danger' },
            EXPIRED: { value: 'expired', label: '已过期', color: 'warning' }
        },
        CONTRACT: {
            DRAFT: { value: 'draft', label: '草稿', color: 'secondary' },
            PENDING: { value: 'pending', label: '待签署', color: 'warning' },
            SIGNED: { value: 'signed', label: '已签署', color: 'info' },
            EXECUTING: { value: 'executing', label: '执行中', color: 'primary' },
            COMPLETED: { value: 'completed', label: '已完成', color: 'success' },
            TERMINATED: { value: 'terminated', label: '已终止', color: 'danger' }
        },
        ORDER: {
            PENDING: { value: 'pending', label: '待确认', color: 'warning' },
            CONFIRMED: { value: 'confirmed', label: '已确认', color: 'info' },
            PROCESSING: { value: 'processing', label: '处理中', color: 'primary' },
            SHIPPED: { value: 'shipped', label: '已发货', color: 'info' },
            DELIVERED: { value: 'delivered', label: '已交付', color: 'success' },
            COMPLETED: { value: 'completed', label: '已完成', color: 'success' },
            CANCELLED: { value: 'cancelled', label: '已取消', color: 'danger' }
        }
    },

    // 优先级配置
    PRIORITY: {
        LOW: { value: 'low', label: '低', color: 'secondary' },
        MEDIUM: { value: 'medium', label: '中', color: 'warning' },
        HIGH: { value: 'high', label: '高', color: 'danger' },
        URGENT: { value: 'urgent', label: '紧急', color: 'danger' }
    },

    // 客户类型配置
    CUSTOMER_TYPE: {
        INDIVIDUAL: { value: 'individual', label: '个人' },
        COMPANY: { value: 'company', label: '企业' }
    },

    // 客户等级配置
    CUSTOMER_LEVEL: {
        BRONZE: { value: 'bronze', label: '铜牌客户', color: 'warning' },
        SILVER: { value: 'silver', label: '银牌客户', color: 'secondary' },
        GOLD: { value: 'gold', label: '金牌客户', color: 'warning' },
        PLATINUM: { value: 'platinum', label: '白金客户', color: 'info' },
        DIAMOND: { value: 'diamond', label: '钻石客户', color: 'primary' }
    },

    // 客户来源配置
    CUSTOMER_SOURCE: {
        WEBSITE: { value: 'website', label: '官网' },
        REFERRAL: { value: 'referral', label: '推荐' },
        ADVERTISING: { value: 'advertising', label: '广告' },
        EXHIBITION: { value: 'exhibition', label: '展会' },
        COLD_CALL: { value: 'cold_call', label: '电话营销' },
        SOCIAL_MEDIA: { value: 'social_media', label: '社交媒体' },
        OTHER: { value: 'other', label: '其他' }
    },

    // 行业配置
    INDUSTRY: {
        TECHNOLOGY: { value: 'technology', label: '科技' },
        FINANCE: { value: 'finance', label: '金融' },
        HEALTHCARE: { value: 'healthcare', label: '医疗' },
        EDUCATION: { value: 'education', label: '教育' },
        MANUFACTURING: { value: 'manufacturing', label: '制造业' },
        RETAIL: { value: 'retail', label: '零售' },
        REAL_ESTATE: { value: 'real_estate', label: '房地产' },
        CONSULTING: { value: 'consulting', label: '咨询' },
        MEDIA: { value: 'media', label: '媒体' },
        GOVERNMENT: { value: 'government', label: '政府' },
        OTHER: { value: 'other', label: '其他' }
    },

    // 用户角色配置
    USER_ROLE: {
        ADMIN: { value: 'admin', label: '管理员' },
        MANAGER: { value: 'manager', label: '经理' },
        SALES: { value: 'sales', label: '销售' },
        SUPPORT: { value: 'support', label: '客服' }
    },

    // 验证规则
    VALIDATION: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^1[3-9]\d{9}$/,
        PASSWORD: {
            MIN_LENGTH: 6,
            PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/
        },
        USERNAME: {
            MIN_LENGTH: 3,
            MAX_LENGTH: 20,
            PATTERN: /^[a-zA-Z0-9_]+$/
        }
    },

    // 错误消息
    ERROR_MESSAGES: {
        NETWORK_ERROR: '网络连接失败，请检查网络设置',
        SERVER_ERROR: '服务器错误，请稍后重试',
        UNAUTHORIZED: '登录已过期，请重新登录',
        FORBIDDEN: '权限不足，无法执行此操作',
        NOT_FOUND: '请求的资源不存在',
        VALIDATION_ERROR: '数据验证失败',
        UNKNOWN_ERROR: '未知错误，请联系管理员'
    },

    // 成功消息
    SUCCESS_MESSAGES: {
        LOGIN: '登录成功',
        LOGOUT: '退出成功',
        REGISTER: '注册成功',
        CREATE: '创建成功',
        UPDATE: '更新成功',
        DELETE: '删除成功',
        SAVE: '保存成功',
        SEND: '发送成功'
    },

    // 确认消息
    CONFIRM_MESSAGES: {
        DELETE: '确定要删除这条记录吗？此操作不可恢复。',
        LOGOUT: '确定要退出登录吗？',
        CANCEL: '确定要取消吗？未保存的更改将丢失。',
        RESET: '确定要重置表单吗？所有输入将被清空。'
    },

    // 开发模式配置
    DEBUG: {
        ENABLED: true, // 生产环境应设为false
        LOG_LEVEL: 'info', // debug, info, warn, error
        SHOW_API_LOGS: true,
        SHOW_PERFORMANCE_LOGS: false
    }
};

// 根据环境调整配置
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 开发环境
    CONFIG.DEBUG.ENABLED = true;
    CONFIG.API.BASE_URL = 'http://localhost:5000/api/v1';
} else {
    // 生产环境
    CONFIG.DEBUG.ENABLED = false;
    CONFIG.API.BASE_URL = '/api'; // 相对路径
}

// 冻结配置对象，防止意外修改
Object.freeze(CONFIG);

// 导出配置
window.CONFIG = CONFIG;