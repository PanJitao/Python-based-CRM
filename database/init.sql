-- CRM销售平台数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS crmV2_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_database;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(120) NOT NULL UNIQUE COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '电话号码',
    department VARCHAR(50) COMMENT '部门',
    position VARCHAR(50) COMMENT '职位',
    role ENUM('admin', 'manager', 'sales', 'user') DEFAULT 'user' NOT NULL COMMENT '用户角色',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' NOT NULL COMMENT '用户状态',
    last_login DATETIME COMMENT '最后登录时间',
    avatar VARCHAR(255) COMMENT '头像URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否删除',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '客户名称',
    company VARCHAR(200) COMMENT '公司名称',
    industry VARCHAR(100) COMMENT '所属行业',
    customer_type ENUM('individual', 'enterprise') DEFAULT 'individual' NOT NULL COMMENT '客户类型',
    contact_person VARCHAR(50) COMMENT '联系人',
    phone VARCHAR(20) COMMENT '电话号码',
    mobile VARCHAR(20) COMMENT '手机号码',
    email VARCHAR(120) COMMENT '邮箱',
    fax VARCHAR(20) COMMENT '传真',
    website VARCHAR(200) COMMENT '网站',
    address TEXT COMMENT '详细地址',
    city VARCHAR(50) COMMENT '城市',
    province VARCHAR(50) COMMENT '省份',
    country VARCHAR(50) DEFAULT '中国' COMMENT '国家',
    postal_code VARCHAR(10) COMMENT '邮政编码',
    source VARCHAR(50) COMMENT '客户来源',
    level ENUM('A', 'B', 'C', 'D') DEFAULT 'C' NOT NULL COMMENT '客户等级',
    status ENUM('potential', 'active', 'inactive', 'lost') DEFAULT 'potential' NOT NULL COMMENT '客户状态',
    credit_limit DECIMAL(15,2) DEFAULT 0.00 COMMENT '信用额度',
    sales_user_id INT COMMENT '负责销售员ID',
    first_contact_date DATE COMMENT '首次接触日期',
    last_contact_date DATE COMMENT '最后接触日期',
    next_follow_date DATE COMMENT '下次跟进日期',
    description TEXT COMMENT '客户描述',
    notes TEXT COMMENT '备注信息',
    tags VARCHAR(500) COMMENT '标签（逗号分隔）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否删除',
    FOREIGN KEY (sales_user_id) REFERENCES users(id),
    INDEX idx_name (name),
    INDEX idx_company (company),
    INDEX idx_status (status),
    INDEX idx_level (level),
    INDEX idx_sales_user (sales_user_id),
    INDEX idx_customer_type (customer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表';

-- 报价表
CREATE TABLE IF NOT EXISTS quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_number VARCHAR(50) NOT NULL UNIQUE COMMENT '报价单号',
    title VARCHAR(200) NOT NULL COMMENT '报价标题',
    customer_id INT NOT NULL COMMENT '客户ID',
    sales_user_id INT NOT NULL COMMENT '销售员ID',
    quote_date DATE NOT NULL COMMENT '报价日期',
    valid_until DATE COMMENT '有效期至',
    currency VARCHAR(10) DEFAULT 'CNY' NOT NULL COMMENT '币种',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000 COMMENT '汇率',
    subtotal DECIMAL(15,2) DEFAULT 0.00 COMMENT '小计金额',
    discount_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '折扣率',
    discount_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '折扣金额',
    tax_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '税率',
    tax_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '税额',
    total_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '总金额',
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft' NOT NULL COMMENT '报价状态',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' NOT NULL COMMENT '优先级',
    description TEXT COMMENT '报价描述',
    terms_conditions TEXT COMMENT '条款和条件',
    notes TEXT COMMENT '备注',
    sent_date DATETIME COMMENT '发送日期',
    response_date DATETIME COMMENT '客户回复日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否删除',
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sales_user_id) REFERENCES users(id),
    INDEX idx_quote_number (quote_number),
    INDEX idx_customer (customer_id),
    INDEX idx_sales_user (sales_user_id),
    INDEX idx_status (status),
    INDEX idx_quote_date (quote_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报价表';

-- 报价项目表
CREATE TABLE IF NOT EXISTS quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL COMMENT '报价ID',
    product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
    product_code VARCHAR(50) COMMENT '产品编码',
    description TEXT COMMENT '产品描述',
    specification VARCHAR(500) COMMENT '规格',
    unit VARCHAR(20) COMMENT '单位',
    quantity DECIMAL(10,2) NOT NULL COMMENT '数量',
    unit_price DECIMAL(15,2) NOT NULL COMMENT '单价',
    total_price DECIMAL(15,2) NOT NULL COMMENT '总价',
    sort_order INT DEFAULT 0 COMMENT '排序',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否删除',
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    INDEX idx_quote (quote_id),
    INDEX idx_product_name (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报价项目表';

-- 合同表
CREATE TABLE IF NOT EXISTS contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_number VARCHAR(50) NOT NULL UNIQUE COMMENT '合同编号',
    title VARCHAR(200) NOT NULL COMMENT '合同标题',
    customer_id INT NOT NULL COMMENT '客户ID',
    sales_user_id INT NOT NULL COMMENT '销售员ID',
    quote_id INT COMMENT '关联报价ID',
    contract_date DATE NOT NULL COMMENT '合同日期',
    start_date DATE COMMENT '合同开始日期',
    end_date DATE COMMENT '合同结束日期',
    currency VARCHAR(10) DEFAULT 'CNY' NOT NULL COMMENT '币种',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000 COMMENT '汇率',
    contract_amount DECIMAL(15,2) NOT NULL COMMENT '合同金额',
    paid_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '已付金额',
    remaining_amount DECIMAL(15,2) NOT NULL COMMENT '剩余金额',
    status ENUM('draft', 'pending', 'signed', 'executing', 'completed', 'terminated') DEFAULT 'draft' NOT NULL COMMENT '合同状态',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' NOT NULL COMMENT '优先级',
    content TEXT COMMENT '合同内容',
    terms_conditions TEXT COMMENT '条款和条件',
    payment_terms TEXT COMMENT '付款条件',
    delivery_terms TEXT COMMENT '交付条件',
    warranty_terms TEXT COMMENT '保修条款',
    notes TEXT COMMENT '备注',
    signed_date DATETIME COMMENT '签署日期',
    customer_signer VARCHAR(100) COMMENT '客户签署人',
    company_signer VARCHAR(100) COMMENT '公司签署人',
    contract_file_path VARCHAR(500) COMMENT '合同文件路径',
    signed_file_path VARCHAR(500) COMMENT '已签署文件路径',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否删除',
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sales_user_id) REFERENCES users(id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    INDEX idx_contract_number (contract_number),
    INDEX idx_customer (customer_id),
    INDEX idx_sales_user (sales_user_id),
    INDEX idx_status (status),
    INDEX idx_contract_date (contract_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合同表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
    customer_id INT NOT NULL COMMENT '客户ID',
    sales_user_id INT NOT NULL COMMENT '销售员ID',
    contract_id INT COMMENT '关联合同ID',
    order_date DATE NOT NULL COMMENT '订单日期',
    required_date DATE COMMENT '要求交付日期',
    shipped_date DATE COMMENT '发货日期',
    delivery_date DATE COMMENT '实际交付日期',
    currency VARCHAR(10) DEFAULT 'CNY' NOT NULL COMMENT '币种',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000 COMMENT '汇率',
    subtotal DECIMAL(15,2) DEFAULT 0.00 COMMENT '小计金额',
    discount_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '折扣率',
    discount_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '折扣金额',
    tax_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '税率',
    tax_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '税额',
    shipping_cost DECIMAL(15,2) DEFAULT 0.00 COMMENT '运费',
    total_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '总金额',
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL COMMENT '订单状态',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' NOT NULL COMMENT '优先级',
    shipping_method VARCHAR(50) COMMENT '配送方式',
    tracking_number VARCHAR(100) COMMENT '快递单号',
    shipping_address TEXT COMMENT '配送地址',
    shipping_contact VARCHAR(100) COMMENT '收货联系人',
    shipping_phone VARCHAR(20) COMMENT '收货电话',
    description TEXT COMMENT '订单描述',
    notes TEXT COMMENT '备注',
    internal_notes TEXT COMMENT '内部备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否删除',
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sales_user_id) REFERENCES users(id),
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    INDEX idx_order_number (order_number),
    INDEX idx_customer (customer_id),
    INDEX idx_sales_user (sales_user_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 订单项目表
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
    product_code VARCHAR(50) COMMENT '产品编码',
    description TEXT COMMENT '产品描述',
    specification VARCHAR(500) COMMENT '规格',
    unit VARCHAR(20) COMMENT '单位',
    quantity DECIMAL(10,2) NOT NULL COMMENT '数量',
    unit_price DECIMAL(15,2) NOT NULL COMMENT '单价',
    total_price DECIMAL(15,2) NOT NULL COMMENT '总价',
    delivered_quantity DECIMAL(10,2) DEFAULT 0.00 COMMENT '已交付数量',
    sort_order INT DEFAULT 0 COMMENT '排序',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否删除',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_product_name (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单项目表';

-- 插入默认管理员用户
INSERT INTO users (username, email, password_hash, real_name, role, status) VALUES 
('admin', 'admin@crm.com', 'pbkdf2:sha256:260000$VQzGJhKGQKGQKGQK$46cc2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c', '系统管理员', 'admin', 'active');

-- 插入示例客户数据
INSERT INTO customers (name, company, industry, customer_type, contact_person, phone, email, address, source, level, status, sales_user_id) VALUES 
('张三', '北京科技有限公司', 'IT服务', 'enterprise', '张三', '13800138001', 'zhangsan@example.com', '北京市朝阳区科技园区1号', '网络推广', 'A', 'active', 1),
('李四', '上海贸易公司', '贸易', 'enterprise', '李四', '13800138002', 'lisi@example.com', '上海市浦东新区商务区2号', '客户推荐', 'B', 'potential', 1),
('王五', '个人客户', '个人', 'individual', '王五', '13800138003', 'wangwu@example.com', '广州市天河区住宅区3号', '展会', 'C', 'active', 1);

-- 创建视图：客户统计
CREATE VIEW customer_stats AS
SELECT 
    level,
    status,
    COUNT(*) as count,
    AVG(credit_limit) as avg_credit_limit
FROM customers 
WHERE is_deleted = FALSE
GROUP BY level, status;

-- 创建视图：销售业绩统计
CREATE VIEW sales_performance AS
SELECT 
    u.username,
    u.real_name,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT q.id) as quote_count,
    COUNT(DISTINCT ct.id) as contract_count,
    COUNT(DISTINCT o.id) as order_count,
    COALESCE(SUM(ct.contract_amount), 0) as total_contract_amount,
    COALESCE(SUM(o.total_amount), 0) as total_order_amount
FROM users u
LEFT JOIN customers c ON u.id = c.sales_user_id AND c.is_deleted = FALSE
LEFT JOIN quotes q ON u.id = q.sales_user_id AND q.is_deleted = FALSE
LEFT JOIN contracts ct ON u.id = ct.sales_user_id AND ct.is_deleted = FALSE
LEFT JOIN orders o ON u.id = o.sales_user_id AND o.is_deleted = FALSE
WHERE u.role IN ('sales', 'manager') AND u.is_deleted = FALSE
GROUP BY u.id, u.username, u.real_name;

-- 创建存储过程：更新报价总金额
DELIMITER //
CREATE PROCEDURE UpdateQuoteTotalAmount(IN quote_id INT)
BEGIN
    DECLARE total DECIMAL(15,2) DEFAULT 0.00;
    DECLARE discount DECIMAL(15,2) DEFAULT 0.00;
    DECLARE tax DECIMAL(15,2) DEFAULT 0.00;
    
    -- 计算小计
    SELECT COALESCE(SUM(total_price), 0.00) INTO total
    FROM quote_items 
    WHERE quote_id = quote_id AND is_deleted = FALSE;
    
    -- 获取折扣和税率
    SELECT 
        CASE 
            WHEN discount_rate > 0 THEN total * discount_rate / 100
            ELSE discount_amount
        END,
        CASE 
            WHEN tax_rate > 0 THEN (total - discount) * tax_rate / 100
            ELSE tax_amount
        END
    INTO discount, tax
    FROM quotes 
    WHERE id = quote_id;
    
    -- 更新报价总金额
    UPDATE quotes 
    SET 
        subtotal = total,
        discount_amount = discount,
        tax_amount = tax,
        total_amount = total - discount + tax,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = quote_id;
END //
DELIMITER ;

-- 创建存储过程：更新订单总金额
DELIMITER //
CREATE PROCEDURE UpdateOrderTotalAmount(IN order_id INT)
BEGIN
    DECLARE total DECIMAL(15,2) DEFAULT 0.00;
    DECLARE discount DECIMAL(15,2) DEFAULT 0.00;
    DECLARE tax DECIMAL(15,2) DEFAULT 0.00;
    DECLARE shipping DECIMAL(15,2) DEFAULT 0.00;
    
    -- 计算小计
    SELECT COALESCE(SUM(total_price), 0.00) INTO total
    FROM order_items 
    WHERE order_id = order_id AND is_deleted = FALSE;
    
    -- 获取折扣、税率和运费
    SELECT 
        CASE 
            WHEN discount_rate > 0 THEN total * discount_rate / 100
            ELSE discount_amount
        END,
        CASE 
            WHEN tax_rate > 0 THEN (total - discount) * tax_rate / 100
            ELSE tax_amount
        END,
        shipping_cost
    INTO discount, tax, shipping
    FROM orders 
    WHERE id = order_id;
    
    -- 更新订单总金额
    UPDATE orders 
    SET 
        subtotal = total,
        discount_amount = discount,
        tax_amount = tax,
        total_amount = total - discount + tax + shipping,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = order_id;
END //
DELIMITER ;

-- 创建触发器：报价项目变更时自动更新报价总金额
DELIMITER //
CREATE TRIGGER quote_items_after_insert
AFTER INSERT ON quote_items
FOR EACH ROW
BEGIN
    CALL UpdateQuoteTotalAmount(NEW.quote_id);
END //

CREATE TRIGGER quote_items_after_update
AFTER UPDATE ON quote_items
FOR EACH ROW
BEGIN
    CALL UpdateQuoteTotalAmount(NEW.quote_id);
END //

CREATE TRIGGER quote_items_after_delete
AFTER DELETE ON quote_items
FOR EACH ROW
BEGIN
    CALL UpdateQuoteTotalAmount(OLD.quote_id);
END //
DELIMITER ;

-- 创建触发器：订单项目变更时自动更新订单总金额
DELIMITER //
CREATE TRIGGER order_items_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    CALL UpdateOrderTotalAmount(NEW.order_id);
END //

CREATE TRIGGER order_items_after_update
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
    CALL UpdateOrderTotalAmount(NEW.order_id);
END //

CREATE TRIGGER order_items_after_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    CALL UpdateOrderTotalAmount(OLD.order_id);
END //
DELIMITER ;

-- 创建索引优化查询性能
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_customers_next_follow_date ON customers(next_follow_date);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_orders_required_date ON orders(required_date);

-- 数据库初始化完成
SELECT 'CRM数据库初始化完成！' as message;
