# SLA Admin Dashboard Setup

## 🚀 **Quick Start**

### 1. **Start Development Environment**
```bash
# Option 1: Use the development script
./start_dev.sh

# Option 2: Start manually
# Terminal 1 - API Server
cd /Users/bokarhamma/SLA-DEV
source venv/bin/activate
python simple_admin_api.py

# Terminal 2 - Web Frontend  
cd /Users/bokarhamma/SLA-DEV/apps/web
npm run dev
```

### 2. **Access the System**
- **Web Frontend**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **API Server**: http://localhost:8000

## 🔐 **Admin Authentication**

### **Default Credentials**
- **Email**: `admin@sla.ai`
- **Password**: `admin123`

### **Login Flow**
1. Go to http://localhost:5173
2. Click "Login" button
3. Select "Admin Login" tab
4. Enter credentials above
5. You'll be redirected to `/admin` dashboard

## 📊 **Admin Dashboard Features**

### **Real-Time Metrics**
- **Total Factories**: 7,567 factory locations
- **Unique Vendors**: 2,600 distinct vendors  
- **Countries**: 72 countries represented

### **Interactive Charts**
- **Top Countries Bar Chart**: Shows factory distribution by country
- **Status Distribution Pie Chart**: Shows factory readiness status
- **Real-time Data**: Click "Refresh Data" to update metrics

### **Geographic Distribution**
1. **Mainland China**: 3,205 factories (42.4%)
2. **Bangladesh**: 971 factories (12.8%)
3. **Türkiye**: 782 factories (10.3%)
4. **China (CN)**: 693 factories (9.2%)
5. **India**: 513 factories (6.8%)

## 🛠 **Technical Implementation**

### **API Endpoints**
- `GET /api/admin/metrics` - Detailed metrics with charts data
- `GET /api/admin/stats` - Basic statistics
- `POST /api/auth/admin/login` - Admin authentication
- `POST /api/auth/admin/logout` - Admin logout
- `GET /api/auth/admin/me` - Current admin info

### **Authentication**
- **JWT Tokens**: Secure admin authentication
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Role-Based Access**: Admin-only endpoints protected

### **Database Integration**
- **SQLite Database**: `sla.db` with 7,567 factory records
- **Real-Time Queries**: Live data from database
- **Optimized Performance**: Cached queries for fast loading

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Admin Authentication
ADMIN_EMAILS=admin@sla.ai,test@example.com
ADMIN_DEV_PASSWORD=admin123
JWT_SECRET=your-secret-key-here

# API Configuration  
API_PREFIX=/api
FRONTEND_ORIGIN=http://localhost:5173
```

### **Frontend Configuration**
```javascript
// Vite environment variables
VITE_API_BASE=http://localhost:8000
```

## 📁 **File Structure**

```
SLA-DEV/
├── simple_admin_api.py          # FastAPI admin server
├── start_dev.sh                 # Development startup script
├── sla.db                       # SQLite database
├── apps/web/src/
│   ├── pages/admin/
│   │   └── AdminDashboard.jsx   # Admin dashboard UI
│   ├── state/auth.ts            # Authentication state
│   └── components/auth/
│       └── LoginDialog.jsx       # Login modal with User/Admin tabs
```

## 🚨 **Troubleshooting**

### **API Server Not Starting**
```bash
# Check if port 8000 is available
lsof -i :8000

# Kill existing processes
pkill -f simple_admin_api

# Install missing dependencies
source venv/bin/activate
pip install fastapi uvicorn PyJWT
```

### **Frontend Not Loading**
```bash
# Check if port 5173 is available
lsof -i :5173

# Install dependencies
cd apps/web
npm install
```

### **Authentication Issues**
- Verify admin credentials in `simple_admin_api.py`
- Check browser cookies for `sla_admin_token`
- Ensure API server is running on port 8000

## 🎯 **Next Steps**

1. **Production Deployment**: Configure HTTPS and secure cookies
2. **User Management**: Add admin user management interface
3. **Advanced Analytics**: Add more detailed reporting features
4. **Export Features**: Add CSV/Excel export functionality
5. **Real-time Updates**: Add WebSocket support for live updates

## 📈 **Performance Notes**

- **Database Queries**: Optimized with proper indexing
- **Caching**: 5-minute cache for heavy aggregation queries
- **Charts**: Responsive design with smooth animations
- **Loading States**: Skeleton loaders for better UX

---

**✅ All systems operational!** The admin dashboard provides real-time insights into your vendor and factory database with secure authentication and beautiful visualizations.
