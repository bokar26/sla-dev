# smpl logistics - Full-Stack Waitlist Platform

A modern, full-stack waitlist platform for smpl logistics featuring React frontend and Python Flask backend, designed to collect and manage early access signups for the SLA (smpl logistics assistant) tool.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Python Flask + SQLAlchemy + PostgreSQL/SQLite
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Styling**: Tailwind CSS with custom green theme
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React for modern iconography

## 🚀 Features

### Frontend
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: Clean, professional interface with green accent colors
- **Smooth Animations**: Framer Motion animations and transitions
- **Form Validation**: Real-time validation with error handling
- **TypeScript**: Full type safety and better development experience
- **Component-Based**: Modular, reusable React components

### Backend
- **RESTful API**: Clean, documented API endpoints
- **Database Models**: SQLAlchemy ORM with migrations
- **Email Integration**: Automated welcome emails
- **Data Validation**: Input validation and sanitization
- **Statistics**: Waitlist analytics and insights
- **Admin Features**: Entry management and status updates

## 📁 Project Structure

```
SLA-Landing/
├── frontend/                 # React application
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── App.tsx          # Main app component
│   │   └── index.tsx        # Entry point
│   ├── package.json         # Node dependencies
│   ├── tailwind.config.js   # Tailwind configuration
│   └── tsconfig.json        # TypeScript configuration
├── backend/                  # Python Flask application
│   ├── app.py               # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   ├── env.example          # Environment variables template
│   └── migrations/          # Database migrations
├── README.md                 # Project documentation
└── .gitignore               # Git ignore rules
```

## 🛠️ Technology Stack

### Frontend
- **React 18**: Latest React with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Production-ready motion library
- **Lucide React**: Beautiful, customizable icons
- **Axios**: HTTP client for API communication

### Backend
- **Flask**: Lightweight Python web framework
- **SQLAlchemy**: Python SQL toolkit and ORM
- **Flask-Migrate**: Database migration support
- **Flask-Mail**: Email functionality
- **Flask-CORS**: Cross-origin resource sharing
- **python-dotenv**: Environment variable management

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **Python** 3.8+ and **pip**
- **Git** for version control

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Open browser**: Navigate to `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**:
   ```bash
   flask init-db
   ```

6. **Start Flask server**:
   ```bash
   python app.py
   ```

7. **API will be available at**: `http://localhost:5000`

## 🔧 Configuration

### Frontend Configuration
- **Port**: Configured in `package.json` scripts
- **API Proxy**: Set to `http://localhost:5000` for development
- **Tailwind**: Custom green theme in `tailwind.config.js`

### Backend Configuration
- **Database**: SQLite for development, PostgreSQL for production
- **Email**: Configure SMTP settings in `.env`
- **CORS**: Configured for React development server
- **Security**: Environment-based secret keys

## 📊 API Endpoints

### Waitlist Management
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist` - Get waitlist entries (admin)
- `GET /api/waitlist/<id>` - Get specific entry
- `PUT /api/waitlist/<id>` - Update entry status
- `GET /api/waitlist/stats` - Get waitlist statistics

### System
- `GET /api/health` - Health check endpoint

## 🎨 Customization

### Colors
Modify the green theme in `frontend/tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#10b981',  // Main green
    600: '#059669',  // Darker green
    // ... more shades
  }
}
```

### Content
- Update text content in React components
- Modify form fields in `Waitlist.tsx`
- Customize email templates in `app.py`

### Styling
- Modify Tailwind classes in components
- Add custom CSS in `src/index.css`
- Update animations in Framer Motion components

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy build/ folder to your hosting service
```

**Recommended Platforms**:
- **Netlify**: Drag & drop deployment
- **Vercel**: Git-based deployment
- **AWS S3**: Static hosting
- **GitHub Pages**: Free hosting

### Backend Deployment
```bash
cd backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

**Recommended Platforms**:
- **Heroku**: Easy Python deployment
- **DigitalOcean**: App Platform
- **AWS**: EC2 or Elastic Beanstalk
- **Google Cloud**: App Engine

### Environment Variables
Set these in production:
- `DATABASE_URL`: Production database connection
- `SECRET_KEY`: Strong, unique secret key
- `MAIL_*`: Email configuration
- `FLASK_ENV`: Set to `production`

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
pytest
```

## 📈 Performance Optimization

### Frontend
- **Code Splitting**: React.lazy for route-based splitting
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Analyze bundle size with webpack-bundle-analyzer
- **Lazy Loading**: Intersection Observer for animations

### Backend
- **Database Indexing**: Optimize query performance
- **Caching**: Redis for session and data caching
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: Protect against abuse

## 🔒 Security Features

- **Input Validation**: Server-side validation of all inputs
- **SQL Injection Protection**: SQLAlchemy ORM protection
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Secure configuration management
- **HTTPS Enforcement**: Production security requirements

## 📱 Mobile Optimization

- **Responsive Design**: Mobile-first approach
- **Touch Interactions**: Optimized for mobile devices
- **Performance**: Optimized for slower mobile networks
- **Progressive Web App**: PWA capabilities ready

## 🔮 Future Enhancements

- **Authentication System**: User accounts and admin panel
- **Analytics Dashboard**: Waitlist insights and metrics
- **Email Campaigns**: Automated marketing sequences
- **Integration APIs**: Connect with CRM and marketing tools
- **Multi-language Support**: Internationalization
- **Dark Mode**: Theme switching capability
- **Real-time Updates**: WebSocket notifications

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

- **Documentation**: Check this README and code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Email**: Contact the development team
- **Community**: Join our developer community

## 🎯 Quick Start Commands

```bash
# Clone repository
git clone <repository-url>
cd SLA-Landing

# Start frontend (in one terminal)
cd frontend
npm install
npm start

# Start backend (in another terminal)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

**Built with ❤️ for smpl logistics**

*Transform your logistics operations with intelligent AI-powered solutions.*
