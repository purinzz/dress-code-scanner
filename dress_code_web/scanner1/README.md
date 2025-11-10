# Dress Code Scanner System

A comprehensive web-based dress code monitoring system for educational institutions, developed as a 4th year capstone thesis project.

## Features

### 🔐 Authentication System
- Role-based login/signup (OSA and Security Personnel)
- JWT-based authentication
- Secure password hashing

### 👨‍💼 OSA Dashboard
- **Overview**: Total violations statistics
- **Violations Management**: View, search, and update violation statuses
- **Real-time Notifications**: Get notified of new violations

### 🛡️ Security Personnel Dashboard
- **Real-time Monitoring**: Live camera feed and recent scanned pictures
- **Violation Logging**: Add new violations with image upload
- **Student Violation Logs**: Search and filter violation records
- **Alert & Notifications**: View detected violations with images and details

## Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Styling with Tailwind CSS framework
- **JavaScript**: Interactive functionality and API integration
- **Socket.IO**: Real-time communication

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Socket.IO**: Real-time bidirectional communication
- **JWT**: Authentication tokens
- **Multer**: File upload handling
- **bcryptjs**: Password hashing

## Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (running locally or MongoDB Atlas)
- **MongoDB Compass** (optional, for database visualization)

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd scanner1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - **Local MongoDB**: Ensure MongoDB is running on `localhost:27017`
   - **MongoDB Compass**: Create connection with name `dress-code-scanner-db`
   - **Connection String**: `mongodb://localhost:27017`
   - See `MONGODB_SETUP.md` for detailed instructions

4. **Environment Configuration**
   - The `.env` file is already configured for local development
   - Database: `dress_code_scanner`
   - Default connection: `mongodb://localhost:27017/dress_code_scanner`

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and go to: `http://localhost:3000`
   - The system will automatically create default users and sample data

## Demo Accounts

### OSA Account
- **Email**: `osa@school.edu`
- **Password**: `password`
- **Role**: OSA (Office of Student Affairs)

### Security Personnel Account
- **Email**: `security@school.edu`
- **Password**: `password`
- **Role**: Security Personnel

## Project Structure

```
scanner1/
├── backend/
│   ├── server.js              # Main server file
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── violations.js      # Violation management routes
│   │   └── dashboard.js       # Dashboard data routes
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   ├── User.js            # User data model
│   │   └── Violation.js       # Violation data model
│   └── uploads/               # Uploaded images storage
├── frontend/
│   ├── index.html             # Login page
│   ├── signup.html            # Registration page
│   ├── osa/
│   │   └── dashboard.html     # OSA dashboard
│   ├── security/
│   │   └── dashboard.html     # Security dashboard
│   ├── css/
│   │   └── styles.css         # Custom styles
│   └── js/
│       ├── auth.js            # Authentication logic
│       ├── osa-dashboard.js   # OSA dashboard functionality
│       └── security-dashboard.js # Security dashboard functionality
└── package.json              # Project dependencies
```

## Key Functionalities

### For OSA Personnel
1. **Dashboard Overview**: View total violation statistics
2. **Violation Management**: 
   - View all violations in a searchable table
   - Filter by student name, violation type, and date
   - Update violation status (pending, resolved, not yet resolved)
3. **Real-time Updates**: Receive notifications when new violations are detected

### For Security Personnel
1. **Real-time Monitoring**: 
   - View live camera feed
   - See recent scanned pictures
2. **Violation Logging**:
   - Add new violations with student details
   - Upload violation images
   - Automatic timestamp recording
3. **Violation Logs**: 
   - Search and filter existing violations
   - View violation history
4. **Alert System**: 
   - View detected violations with images
   - Real-time violation notifications

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Violations
- `GET /api/violations` - Get all violations (with search/filter)
- `POST /api/violations` - Create new violation (Security only)
- `PUT /api/violations/:id` - Update violation
- `DELETE /api/violations/:id` - Delete violation

### Dashboard
- `GET /api/dashboard/stats` - Get violation statistics
- `GET /api/dashboard/recent` - Get recent violations
- `GET /api/dashboard/analytics` - Get analytics data

## Real-time Features

The system uses Socket.IO for real-time communication:
- **New Violation Alerts**: Instantly notify OSA when violations are detected
- **Status Updates**: Real-time updates across all connected clients
- **Live Monitoring**: Real-time data synchronization

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for OSA and Security roles
- **Password Hashing**: Secure password storage using bcryptjs
- **File Upload Validation**: Image file type and size validation

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- AI-powered dress code violation detection
- Email notifications
- Advanced analytics and reporting
- Mobile application
- Camera integration for live monitoring

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## License

This project is developed as a capstone thesis project for educational purposes.

## Contributors

- [Your Name] - 4th Year Student
- [Team Members] - If applicable

---

**Note**: This is a prototype system designed for educational purposes. For production use, consider implementing a proper database, enhanced security measures, and additional features based on specific institutional requirements.
