import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// API URL
const API_URL = 'http://127.0.0.1:5001/api';

// Іконки
const DashboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const PackageIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>);
const ShoppingCartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>);
const TruckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>);
const InboxIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>);
const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
const InfoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);

// Логотип
const LogoIcon = () => (
  <svg className="sidebar-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "var(--color-primary)", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "var(--color-primary-dark)", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path fill="url(#logoGradient)" d="M50,5A45,45 0 1 1 5,50A45,45 0 0 1 50,5 M50,15 A35,35 0 1 0 85,50 A35,35 0 0 0 50,15 Z" />
    <polyline points="35,50 45,60 65,40" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Контекст автентифікації
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      setUser(response.data);
      return true;
    } catch (error) {
      console.error("Помилка входу:", error);
      throw new Error(error.response?.data?.error || "Невірний логін або пароль");
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API_URL}/auth/register`, userData);
      return true;
    } catch (error) {
      console.error("Помилка реєстрації:", error);
      throw new Error(error.response?.data?.error || "Помилка реєстрації");
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// Головний компонент додатку
function App() {
  const { user } = useAuth();
  const [page, setPage] = useState(user?.role === 'supplier' ? 'supplier_dashboard' : 'dashboard');

  useEffect(() => {
    if (user) {
      setPage(user.role === 'supplier' ? 'supplier_dashboard' : 'dashboard');
    }
  }, [user]);

  if (!user) {
    return <AuthPage />;
  }

  // Рендеринг для Менеджера/Chief
  if (user.role === 'manager' || user.role === 'chief') {
    return (
      <div className="app-container">
        <Sidebar user={user} setPage={setPage} currentPage={page} />
        <div className="content-container">
          <PageHeader page={page} user={user} />
          <main>
            {page === 'dashboard' && <DashboardPage />}
            {page === 'products' && <ProductPage />}
            {page === 'orders' && <OrderPage />}
            {page === 'suppliers' && <SupplierPage />}
          </main>
        </div>
      </div>
    );
  }
  // Рендеринг для Постачальника
  else if (user.role === 'supplier') {
    return (
      <div className="app-container">
        <Sidebar user={user} setPage={setPage} currentPage={page} />
        <div className="content-container">
          <PageHeader page={page} user={user} />
          <main>
            {page === 'supplier_dashboard' && <SupplierDashboardPage />}
            {page === 'supplier_products' && <SupplierProductPage />}
          </main>
        </div>
      </div>
    );
  }

  return null; // На випадок невідомої ролі
}

// Обгортка для AuthProvider
export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

// Компоненти автентифікації
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? "Вхід в InStock Pro" : "Реєстрація"}</h1>
        {isLogin ? <LoginPage /> : <RegisterPage />}
        <button className="auth-toggle-btn" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Немає акаунту? Зареєструватись" : "Вже є акаунт? Увійти"}
        </button>
      </div>
    </div>
  );
}

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
          await login(username, password);
        } catch (err) {
          setError(err.message);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="styled-form">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
            <label>Ім'я користувача</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-full">Увійти</button>
        </form>
  );
}

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const userData = { username, password, role };
    if (role === 'supplier') {
      if (!name || !contactInfo) {
        setError("Назва компанії та контакти є обов'язковими для постачальника");
        return;
      }
      userData.name = name;
      userData.contactInfo = contactInfo;
    }
    try {
      await register(userData);
      setSuccess('Користувача успішно створено! Тепер ви можете увійти.');
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="styled-form">
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <div className="form-group">
        <label>Ви реєструєтесь як:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="manager">Менеджер</option>
            <option value="supplier">Постачальник</option>
        </select>
      </div>
      <div className="form-group">
        <label>Ім'я користувача (логін)</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {role === 'supplier' && (
        <>
          <div className="form-group">
            <label>Назва компанії (Публічна)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Контактна інформація (Email, телефон)</label>
            <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
          </div>
        </>
      )}
      <button type="submit" className="btn btn-primary btn-full">Зареєструватись</button>
    </form>
  );
}

// Компоненти інтерфейсу
function Sidebar({ user, setPage, currentPage }) {
  const { logout } = useAuth();

  const managerNavItems = [
    { name: 'dashboard', label: 'Панель', icon: <DashboardIcon />, roles: ['manager', 'chief'] },
    { name: 'products', label: 'Каталог Товарів', icon: <PackageIcon />, roles: ['manager', 'chief'] },
    { name: 'orders', label: 'Мої Замовлення', icon: <ShoppingCartIcon />, roles: ['manager', 'chief'] },
    { name: 'suppliers', label: 'Постачальники', icon: <TruckIcon />, roles: ['chief'] },
  ];

  const supplierNavItems = [
    { name: 'supplier_dashboard', label: 'Нові Замовлення', icon: <InboxIcon />, roles: ['supplier'] },
    { name: 'supplier_products', label: 'Мої Товари', icon: <PackageIcon />, roles: ['supplier'] },
  ];

  const navItems = (user.role === 'supplier') ? supplierNavItems : managerNavItems;

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <LogoIcon />
        <span className="sidebar-title">InStock Pro</span>
      </div>
      <ul className="sidebar-menu">
        {navItems.map(item => (
          user.role && item.roles.includes(user.role) ? (
            <li key={item.name}>
              <button
                className={`sidebar-button ${currentPage === item.name ? 'active' : ''}`}
                onClick={() => setPage(item.name)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ) : null
        ))}
      </ul>
      <div className="sidebar-footer">
        <div className="user-profile">
          <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-role">
                {user.role === 'chief' ? 'Головний Менеджер' :
                 user.role === 'manager' ? 'Менеджер' : 'Постачальник'}
            </span>
          </div>
        </div>
        <button className="sidebar-button logout-btn" onClick={logout}>
          <LogOutIcon />
          <span>Вийти</span>
        </button>
      </div>
    </nav>
  );
}

function PageHeader({ page, user }) {
  const titles = {
    dashboard: 'Оглядова Панель',
    products: 'Загальний Каталог Товарів',
    orders: 'Управління Замовленнями',
    suppliers: 'Зареєстровані Постачальники',
    supplier_dashboard: 'Панель Постачальника',
    supplier_products: 'Управління Моїми Товарами'
  };
  return (
    <header className="page-header">
      <h2>{titles[page]}</h2>
      <p>Вітаємо, {user.username}! {user.role === 'supplier' ? 'Керуйте своїми товарами та замовленнями.' : 'Ось ваш огляд.'}</p>
    </header>
  );
}

// Сторінки додатку
function DashboardPage() {
    const [stats, setStats] = useState({ products: 0, orders: 0, suppliers: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const fetchDashboardData = async () => {
        try {
            const [productsRes, ordersRes, suppliersRes] = await Promise.all([
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/orders`),
                axios.get(`${API_URL}/suppliers`)
            ]);
            const products = productsRes.data;
            const orders = ordersRes.data;
            setStats({
                products: products.length,
                orders: orders.filter(o => o.status === 'pending_chief_approval').length,
                suppliers: suppliersRes.data.length
            });
            setRecentOrders(orders.slice(0, 5));
            const lowStockItems = products.filter(p => p.reorder_point !== undefined && p.quantity <= p.reorder_point);
            setLowStock(lowStockItems);
        } catch (error) {
            console.error("Помилка завантаження даних для панелі:", error);
        }
    };
    useEffect(() => {
        fetchDashboardData();
    }, []);
    return (
        <div className="dashboard-grid">
            <div className="stat-card">
                <h3>Товари в Каталозі</h3>
                <p>{stats.products}</p>
                <span>Всього SKU від постачальників</span>
            </div>
            <div className="stat-card">
                <h3>Очікують Затвердження (Chief)</h3>
                <p>{stats.orders}</p>
                <span>Нових замовлень</span>
            </div>
            <div className="stat-card">
                <h3>Постачальники</h3>
                <p>{stats.suppliers}</p>
                <span>Активних партнерів</span>
            </div>
            <div className="card full-width">
                <h3>Товари, що потребують замовлення (нижче ROP)</h3>
                <div className="table-wrapper">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Товар</th>
                                <th>Постачальник</th>
                                <th>На складі</th>
                                <th title="Точка Поповнення: Рівень запасу, при якому потрібно робити нове замовлення. Розраховується як (Середній попит * Час доставки) + Безпековий запас.">
                                    Точка поповн. (ROP) <InfoIcon />
                                </th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStock.length > 0 ? lowStock.map(p => (
                                <tr key={p._id}>
                                    <td>{p.name}</td>
                                    <td>{p.supplierName || 'N/A'}</td>
                                    <td>{p.quantity}</td>
                                    <td>{p.reorder_point}</td>
                                    <td><ProductStatusBadge status={p.safety_stock !== undefined && p.quantity <= p.safety_stock ? 'critical' : 'reorder'} /></td>
                                </tr>
                            )) : <tr><td colSpan="5">Немає товарів з низьким залишком.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="card full-width">
                <h3>Останні Замовлення (Всі)</h3>
                <OrderTable orders={recentOrders} onStatusChange={fetchDashboardData} showAll={false} />
            </div>
        </div>
    );
}

function ProductPage() {
  const [products, setProducts] = useState([]);
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Помилка завантаження товарів:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <div className="card">
        <ProductTable
          products={products}
          onEdit={() => {}} // Менеджер не може редагувати
          onDelete={() => {}} // Менеджер не може видаляти
          userRole={user.role}
          isSupplierView={false} // Вигляд Менеджера
        />
      </div>
    </div>
  );
}

function OrderPage() {
  const [orders, setOrders] = useState([]);
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error("Помилка завантаження замовлень:", error);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);
  return (
    <div className="card">
      <OrderTable orders={orders} onStatusChange={fetchOrders} showAll={true} />
    </div>
  );
}

function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const { user } = useAuth();
  useEffect(() => {
    if (user.role === 'chief') {
        const fetchSuppliers = async () => {
            try {
              const response = await axios.get(`${API_URL}/suppliers`);
              setSuppliers(response.data);
            } catch (error) {
              console.error("Помилка завантаження постачальників:", error);
            }
          };
      fetchSuppliers();
    }
  }, [user.role]);
  if (user.role !== 'chief') {
    return <p>У вас немає доступу до цієї сторінки.</p>;
  }
  return (
    <div>
      <div className="card">
        <h3>Список Зареєстрованих Постачальників</h3>
        <div className="table-wrapper">
            <table className="styled-table">
            <thead>
                <tr>
                <th>Назва компанії</th>
                <th>Контактна інформація</th>
                </tr>
            </thead>
            <tbody>
                {suppliers.length > 0 ? suppliers.map(supplier => (
                <tr key={supplier._id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.contactInfo}</td>
                </tr>
                )) : (
                <tr><td colSpan="2">Постачальники відсутні.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

function SupplierDashboardPage() {
    const [orders, setOrders] = useState([]);
    const { user } = useAuth();

    const fetchSupplierOrders = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/supplier/orders?userId=${user.userId}`);
            setOrders(response.data);
        } catch (error) {
            console.error("Помилка завантаження замовлень постачальника:", error);
        }
    }, [user.userId]);

    useEffect(() => {
        if (user && user.role === 'supplier') {
            fetchSupplierOrders();
        }
    }, [user, fetchSupplierOrders]);

    const handleConfirm = async (orderId) => {
        if (!window.confirm("Ви впевнені, що хочете ПІДТВЕРДИТИ це замовлення?")) return;
        try {
            await axios.put(`${API_URL}/supplier/orders/${orderId}/confirm`);
            fetchSupplierOrders();
        } catch (error) {
            console.error("Помилка підтвердження:", error);
        }
    };
    const handleReject = async (orderId) => {
        if (!window.confirm("Ви впевнені, що хочете ВІДХИЛИТИ це замовлення?")) return;
        try {
            await axios.put(`${API_URL}/supplier/orders/${orderId}/reject`);
            fetchSupplierOrders();
        } catch (error) {
            console.error("Помилка відхилення:", error);
        }
    };
    return (
        <div className="card">
            <h3>Замовлення, що очікують на ваше підтвердження</h3>
            <div className="table-wrapper">
                <table className="styled-table">
                <thead>
                    <tr>
                    <th>Дата</th>
                    <th>Товар</th>
                    <th>Кількість</th>
                    <th>Статус</th>
                    <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length > 0 ? orders.map(order => (
                    <tr key={order._id}>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>{order.productName}</td>
                        <td>{order.quantity}</td>
                        <td>
                            <OrderStatusBadge status='pending_supplier_approval' />
                        </td>
                        <td>
                            <div className="action-buttons">
                                <button className="btn btn-success" onClick={() => handleConfirm(order._id)}>
                                    Підтвердити
                                </button>
                                <button className="btn btn-danger" onClick={() => handleReject(order._id)}>
                                    Відхилити
                                </button>
                            </div>
                        </td>
                    </tr>
                    )) : (
                    <tr><td colSpan="5">Нові замовлення відсутні.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>
    );
}

function SupplierProductPage() {
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchSupplierProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/supplier/products?userId=${user.userId}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Помилка завантаження товарів постачальника:", error);
    }
  }, [user.userId]);

  useEffect(() => {
    if (user) {
      fetchSupplierProducts();
    }
  }, [user, fetchSupplierProducts]);

  const handleSaveProduct = async (productData) => {
    try {
      const url = currentProduct && currentProduct._id
        ? `${API_URL}/products/${currentProduct._id}?userId=${user.userId}`
        : `${API_URL}/products?userId=${user.userId}`;

      const method = currentProduct && currentProduct._id ? 'put' : 'post';

      await axios[method](url, productData);

      fetchSupplierProducts();
      setIsModalOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error("Помилка збереження товару:", error);
      alert(error.response?.data?.error || "Не вдалося зберегти товар");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей товар зі свого каталогу?')) {
      try {
        await axios.delete(`${API_URL}/products/${productId}?userId=${user.userId}`);
        fetchSupplierProducts();
      } catch (error) {
        console.error("Помилка видалення товару:", error);
        alert(error.response?.data?.error || "Не вдалося видалити товар");
      }
    }
  };

  const openForm = (product = null) => {
    // Встановлюємо порожні значення для нового товару
    setCurrentProduct(product || { name: '', quantity: '', lead_time: 1, sales_history: '' });
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="page-actions">
        <button className="btn btn-primary" onClick={() => openForm()}>
          + Додати новий товар
        </button>
      </div>

      <div className="card">
        <ProductTable
          products={products}
          onEdit={openForm}
          onDelete={handleDeleteProduct}
          userRole={user.role}
          isSupplierView={true}
        />
      </div>

      {isModalOpen && (
        <Modal title={currentProduct && currentProduct._id ? "Редагувати товар" : "Додати товар"} onClose={() => setIsModalOpen(false)}>
          <ProductForm
            onSave={handleSaveProduct}
            currentProduct={currentProduct}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// Перевикористовувані компоненти
function ProductForm({ onSave, currentProduct, onCancel }) {
  const [product, setProduct] = useState({
    name: '', quantity: '', lead_time: 1, sales_history: ''
  });

  // Використовуємо useEffect для оновлення форми при зміні currentProduct
  useEffect(() => {
    if (currentProduct) {
      const salesHistoryString = currentProduct.sales_history ? currentProduct.sales_history.join(', ') : '';
      // Переконуємось, що всі поля існують перед встановленням стану
      setProduct({
        name: currentProduct.name || '',
        quantity: currentProduct.quantity || '',
        lead_time: currentProduct.lead_time || 1,
        sales_history: salesHistoryString,
        _id: currentProduct._id // Зберігаємо ID для ідентифікації при збереженні
      });
    } else {
         // Скидання для нового товару
         setProduct({ name: '', quantity: '', lead_time: 1, sales_history: '' });
    }
  }, [currentProduct]); // Залежність тільки від currentProduct

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
        name: product.name,
        quantity: Number(product.quantity) || 0,
        lead_time: Number(product.lead_time) || 1,
        sales_history: product.sales_history
            .split(',')
            .map(s => Number(s.trim()))
            .filter(n => !isNaN(n)) // Залишаємо лише числа
    };
    // Якщо це редагування, додаємо ID
    if(product._id) {
        productData._id = product._id;
    }
    onSave(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="styled-form">
      <div className="form-group">
        <label>Назва товару</label>
        <input name="name" value={product.name} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Кількість на складі (ваша наявність)</label>
        <input name="quantity" type="number" value={product.quantity} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Час доставки (днів)</label>
        <input name="lead_time" type="number" value={product.lead_time} onChange={handleChange} required />
      </div>
      {/* Видалено поле Рівень обслуговування */}
      <div className="form-group">
        <label>Історія продажів (через кому, напр.: 10, 12, 15)</label>
        <textarea name="sales_history" value={product.sales_history} onChange={handleChange} rows="3" placeholder="Числа, розділені комою"/>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Скасувати</button>
        <button type="submit" className="btn btn-primary">Зберегти</button>
      </div>
    </form>
  );
}

function ProductTable({ products, onEdit, onDelete, userRole, isSupplierView }) {
  const [orderProduct, setOrderProduct] = useState(null);

  const getStatus = (product) => {
    if (product.safety_stock === undefined || product.reorder_point === undefined) return 'ok';
    if (product.quantity <= product.safety_stock) return 'critical';
    if (product.quantity <= product.reorder_point) return 'reorder';
    const avgDemand = product.avg_daily_demand === undefined ? 0 : product.avg_daily_demand;
    const surplusThreshold = product.reorder_point + (avgDemand * 7);
    if (product.quantity > surplusThreshold && surplusThreshold > 0) return 'surplus';
    return 'ok';
  };

  return (
    <>
      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Назва</th>
              {!isSupplierView && <th>Постачальник</th>}
              <th>На складі</th>
              {!isSupplierView &&
                <th title="Середньодобовий попит, розрахований на основі історії продажів.">
                  Сер. попит <InfoIcon/>
                </th>
              }
              <th>Час дост.</th>
              {/* Видалено Рів. обсл. */}
              {!isSupplierView &&
                <th title="Безпековий Запас: Додаткова кількість товару для покриття несподіваних коливань попиту або затримок доставки. Розраховується на основі мінливості попиту (Std Dev), часу доставки та рівня обслуговування (95%).">
                  Безп. Запас (SS) <InfoIcon/>
                </th>
              }
              {!isSupplierView &&
                <th title="Точка Поповнення: Рівень запасу, при якому потрібно робити нове замовлення. Розраховується як (Середній попит * Час доставки) + Безпековий запас.">
                  Точка Поповн. (ROP) <InfoIcon/>
                </th>
              }
              {!isSupplierView && <th>Статус</th>}
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? products.map(p => (
              <tr key={p._id}>
                <td>{p.name}</td>
                {!isSupplierView && <td>{p.supplierName || 'N/A'}</td>}
                <td>{p.quantity}</td>
                {!isSupplierView && <td>{p.avg_daily_demand ?? 'N/A'}</td>}
                <td>{p.lead_time} дн.</td>
                {/* Видалено Рів. обсл. */}
                {!isSupplierView && <td>{p.safety_stock ?? 'N/A'}</td>}
                {!isSupplierView && <td>{p.reorder_point ?? 'N/A'}</td>}
                {!isSupplierView && <td><ProductStatusBadge status={getStatus(p)} /></td>}
                <td>
                  <div className="action-buttons">
                    {isSupplierView && (
                      <>
                        <button className="btn btn-secondary" onClick={() => onEdit(p)}>
                          Редаг.
                        </button>
                        <button className="btn btn-danger" onClick={() => onDelete(p._id)}>
                          Видал.
                        </button>
                      </>
                    )}
                    {!isSupplierView && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setOrderProduct(p)}
                        disabled={!p.supplierId}
                        title={!p.supplierId ? "Товар без постачальника" : ""}
                      >
                        Замовити
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              // Оновлено colspan, враховуючи видалені колонки
              <tr><td colSpan={isSupplierView ? 4 : 8}>Товари не знайдено.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isSupplierView && orderProduct && (
        <Modal title={`Створити замовлення для: ${orderProduct.name}`} onClose={() => setOrderProduct(null)}>
          <OrderForm product={orderProduct} onCancel={() => setOrderProduct(null)} />
        </Modal>
      )}
    </>
  );
}


function OrderTable({ orders, onStatusChange, showAll }) {
  const { user } = useAuth();
  const handleStatusChange = async (orderId, status) => {
    const actionText = status === 'approved' ? 'затвердити' : 'відхилити';
    if (!window.confirm(`Ви впевнені, що хочете ${actionText} це замовлення?`)) return;
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status });
      onStatusChange();
    } catch (error) {
      console.error("Помилка оновлення статусу:", error);
    }
  };
  return (
    <div className="table-wrapper">
      <table className="styled-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Товар</th>
            <th>Кількість</th>
            <th>Постачальник</th>
            <th>Статус</th>
            {showAll && user.role === 'chief' && <th>Дії (Гол. Менеджер)</th>}
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? orders.map(order => (
                <tr key={order._id}>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>{order.supplierName || 'Н/Д'}</td>
                <td>
                    <OrderStatusBadge status={order.status} />
                </td>
                {showAll && user.role === 'chief' && (
                    <td>
                    {order.status === 'pending_chief_approval' && (
                        <div className="action-buttons">
                        <button className="btn btn-success" onClick={() => handleStatusChange(order._id, 'approved')}>
                            Затвердити
                        </button>
                        <button className="btn btn-danger" onClick={() => handleStatusChange(order._id, 'rejected')}>
                            Відхилити
                        </button>
                        </div>
                    )}
                    </td>
                )}
                </tr>
            )
          ) : (
            <tr><td colSpan={showAll ? "6" : "5"}>Замовлення відсутні.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function OrderForm({ product, onCancel }) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!product.supplierId) {
        setError("Помилка: Неможливо замовити товар без постачальника.");
        return;
    }

    try {
      await axios.post(`${API_URL}/orders`, {
        productId: product._id,
        productName: product.name,
        quantity: Number(quantity),
        supplierId: product.supplierId
      });
      onCancel();
    } catch (err) {
      setError(err.response?.data?.error || "Помилка створення замовлення");
    }
  };

  const recommendedQty = (product.reorder_point === undefined || product.quantity === undefined || product.avg_daily_demand === undefined)
    ? 0
    : Math.max(0, Math.ceil(product.reorder_point - product.quantity + product.avg_daily_demand));

  return (
    <form onSubmit={handleSubmit} className="styled-form">
      {error && <p className="error-message">{error}</p>}

      <div className="form-group">
        <label>Постачальник</label>
        <input
          type="text"
          value={product.supplierName || 'Не вказано'}
          disabled
        />
      </div>

      <div className="form-group">
        <label>Рекомендована кількість (на основі ROP):</label>
        <p>Система рекомендує замовити <strong>{recommendedQty}</strong> од.</p>
      </div>
      <div className="form-group">
        <label>Кількість для замовлення</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={recommendedQty.toString()}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Скасувати</button>
        <button type="submit" className="btn btn-primary">Відправити на затвердження</button>
      </div>
    </form>
  );
}

function ProductStatusBadge({ status }) {
    const statusConfig = {
        ok: { text: 'В нормі', class: 'status-ok' },
        reorder: { text: 'Замовити', class: 'status-reorder' },
        critical: { text: 'Критично', class: 'status-critical' },
        surplus: { text: 'Надлишок', class: 'status-surplus' }
    };
    const config = statusConfig[status] || statusConfig.ok;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
}

function OrderStatusBadge({ status }) {
    const statusConfig = {
        pending_chief_approval: { text: 'На затв. (Chief)', class: 'status-pending' },
        rejected_by_chief: { text: 'Відхилено (Chief)', class: 'status-rejected' },
        pending_supplier_approval: { text: 'На затв. (Пост.)', class: 'status-reorder' },
        rejected_by_supplier: { text: 'Відхилено (Пост.)', class: 'status-rejected' },
        confirmed_by_supplier: { text: 'Підтверджено', class: 'status-approved' },
    };
    const config = statusConfig[status] || { text: status, class: 'status-ok' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

