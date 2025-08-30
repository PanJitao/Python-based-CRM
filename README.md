# CRM销售平台 2.0

一个功能完整的客户关系管理（CRM）销售平台，基于Flask后端和原生JavaScript前端构建。

## 项目特性

### 核心功能
- 🔐 **用户认证系统** - 注册、登录、权限管理
- 👥 **客户管理** - 客户信息、联系记录、统计分析
- 💰 **报价管理** - 报价单创建、审批、转换
- 📋 **合同管理** - 合同签署、执行、跟踪
- 📦 **订单管理** - 订单处理、发货、交付
- 📊 **数据分析** - 销售统计、业绩报表

### 技术特性
- 🚀 **现代化架构** - 前后端分离设计
- 🔒 **安全可靠** - JWT认证、数据加密
- 📱 **响应式设计** - 支持多设备访问
- 🎨 **美观界面** - 现代化UI设计
- ⚡ **高性能** - 优化的数据库查询
- 🔧 **易于扩展** - 模块化代码结构

## 技术栈

### 后端
- **框架**: Flask 2.3.3
- **数据库**: MySQL 8.0+
- **认证**: JWT (Flask-JWT-Extended)
- **ORM**: 原生SQL + PyMySQL
- **API**: RESTful API设计

### 前端
- **语言**: 原生JavaScript (ES6+)
- **样式**: CSS3 + Flexbox/Grid
- **构建**: 无需构建工具，直接运行
- **组件**: 模块化组件设计

### 数据库
- **主数据库**: MySQL
- **缓存**: Redis (可选)
- **文件存储**: 本地文件系统

## 项目结构

```
LocalCRM2.0/
├── backend/                 # 后端代码
│   ├── app.py              # 主应用文件
│   ├── config.py           # 配置文件
│   ├── models/             # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py         # 用户模型
│   │   ├── customer.py     # 客户模型
│   │   ├── quote.py        # 报价模型
│   │   ├── contract.py     # 合同模型
│   │   └── order.py        # 订单模型
│   ├── routes/             # 路由控制器
│   │   ├── __init__.py
│   │   ├── auth.py         # 认证路由
│   │   ├── customers.py    # 客户路由
│   │   ├── quotes.py       # 报价路由
│   │   ├── contracts.py    # 合同路由
│   │   └── orders.py       # 订单路由
│   └── utils/              # 工具函数
│       ├── __init__.py
│       ├── database.py     # 数据库工具
│       ├── auth.py         # 认证工具
│       ├── response.py     # 响应工具
│       └── logger.py       # 日志工具
├── frontend/               # 前端代码
│   ├── index.html          # 主页面
│   ├── css/                # 样式文件
│   │   ├── style.css       # 主样式
│   │   └── components.css  # 组件样式
│   └── js/                 # JavaScript文件
│       ├── config.js       # 配置文件
│       ├── utils.js        # 工具函数
│       ├── api.js          # API接口
│       ├── auth.js         # 认证模块
│       ├── ui.js           # UI组件
│       ├── app.js          # 主应用
│       └── customers.js    # 客户管理
├── database/               # 数据库文件
│   └── init.sql           # 初始化脚本
├── requirements.txt        # Python依赖
└── README.md              # 项目文档
```

## 快速开始

### 环境要求
- Python 3.8+
- MySQL 8.0+
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd LocalCRM2.0
```

#### 2. 创建虚拟环境
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 3. 安装依赖
```bash
pip install -r requirements.txt
```

#### 4. 配置数据库
1. 创建MySQL数据库
```sql
CREATE DATABASE crm_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改配置文件 `backend/config.py`
```python
class Config:
    # 数据库配置
    DB_HOST = 'localhost'
    DB_PORT = 3306
    DB_USER = 'your_username'
    DB_PASSWORD = 'your_password'
    DB_NAME = 'crm_database'
    
    # JWT密钥
    JWT_SECRET_KEY = 'your-secret-key-here'
```

#### 5. 初始化数据库
```bash
cd backend
python -c "from app import app; app.app_context().push(); exec(open('../database/init.sql').read())"
```

或者使用Flask CLI命令：
```bash
flask init-db
```

#### 6. 启动后端服务
```bash
cd backend
python app.py
```

后端服务将在 `http://localhost:5000` 启动

#### 7. 启动前端服务
使用任意HTTP服务器启动前端，例如：

**使用Python内置服务器：**
```bash
cd frontend
python -m http.server 3000
```

**使用Node.js http-server：**
```bash
npm install -g http-server
cd frontend
http-server -p 3000
```

**使用Live Server (VS Code扩展)：**
在VS Code中打开 `frontend/index.html`，右键选择 "Open with Live Server"

前端应用将在 `http://localhost:3000` 启动

### 默认账户
- **用户名**: admin
- **密码**: admin123
- **邮箱**: admin@crm.com

## API文档

### 认证接口
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新令牌
- `GET /api/v1/auth/profile` - 获取用户信息
- `PUT /api/v1/auth/profile` - 更新用户信息

### 客户管理
- `GET /api/v1/customers` - 获取客户列表
- `POST /api/v1/customers` - 创建客户
- `GET /api/v1/customers/{id}` - 获取客户详情
- `PUT /api/v1/customers/{id}` - 更新客户信息
- `DELETE /api/v1/customers/{id}` - 删除客户

### 报价管理
- `GET /api/v1/quotes` - 获取报价列表
- `POST /api/v1/quotes` - 创建报价
- `GET /api/v1/quotes/{id}` - 获取报价详情
- `PUT /api/v1/quotes/{id}` - 更新报价
- `DELETE /api/v1/quotes/{id}` - 删除报价

### 合同管理
- `GET /api/v1/contracts` - 获取合同列表
- `POST /api/v1/contracts` - 创建合同
- `GET /api/v1/contracts/{id}` - 获取合同详情
- `PUT /api/v1/contracts/{id}` - 更新合同
- `DELETE /api/v1/contracts/{id}` - 删除合同

### 订单管理
- `GET /api/v1/orders` - 获取订单列表
- `POST /api/v1/orders` - 创建订单
- `GET /api/v1/orders/{id}` - 获取订单详情
- `PUT /api/v1/orders/{id}` - 更新订单
- `DELETE /api/v1/orders/{id}` - 删除订单

## 开发指南

### 代码规范
- 使用PEP 8 Python代码规范
- 使用ESLint JavaScript代码规范
- 提交前运行代码格式化工具

### 测试
```bash
# 运行后端测试
cd backend
pytest

# 代码格式检查
flake8 .

# 代码格式化
black .
```

### 部署

#### 生产环境部署
1. 使用Gunicorn作为WSGI服务器
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

2. 使用Nginx作为反向代理
3. 配置SSL证书
4. 设置环境变量

#### Docker部署
```bash
# 构建镜像
docker build -t crm-app .

# 运行容器
docker run -p 5000:5000 crm-app
```

## 常见问题

### Q: 数据库连接失败
A: 检查数据库配置信息，确保MySQL服务正在运行，用户名密码正确。

### Q: 前端无法访问后端API
A: 检查CORS配置，确保前端域名在允许列表中。

### Q: JWT令牌过期
A: 使用刷新令牌接口获取新的访问令牌。

### Q: 文件上传失败
A: 检查文件大小限制和存储目录权限。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目维护者: [WuhuPan]
- 邮箱: [2773243879@qq.com]
- 项目链接: [https://github.com/PanJitao/Python-based-CRM]

## 更新日志

### v2.0.0 (2024-01-01)
- 🎉 初始版本发布
- ✨ 完整的CRM功能实现
- 🔐 JWT认证系统
- 📱 响应式前端界面
- 📊 数据统计分析
- 🚀 高性能优化

---

感谢使用 CRM销售平台 2.0！如果您觉得这个项目有用，请给我们一个 ⭐️
