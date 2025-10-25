# MongoDB Setup Guide for Dress Code Scanner

## 📊 MongoDB Compass Connection Setup

### **Step 1: Create New Connection in MongoDB Compass**

1. **Open MongoDB Compass**
2. **Click "New Connection"**
3. **Enter Connection Details:**

   **Connection Name:** `dress-code-scanner-db`
   
   **Connection String:** `mongodb://localhost:27017`
   
   **Or fill individual fields:**
   - **Host:** `localhost`
   - **Port:** `27017`
   - **Authentication:** None (for local development)

4. **Click "Connect"**

### **Step 2: Database Structure**

Once connected, you'll see the database structure:

**Database Name:** `dress_code_scanner`

**Collections:**
1. **`users`** - Stores user accounts (OSA and Security personnel)
2. **`violations`** - Stores violation records with student information

### **Step 3: Sample Data**

The system automatically creates:

#### **Default Users:**
- **OSA Account:**
  - Email: `osa@school.edu`
  - Password: `password`
  - Role: `osa`

- **Security Account:**
  - Email: `security@school.edu`
  - Password: `password`
  - Role: `security`

#### **Sample Violations:**
- Anna Cruz - Croptop violation
- Jhon Doe - Tattered Jeans violation
- Jason Fabria - Rubber Slipper violation
- Miles Cristi Cabamac - Short shorts violation

## 🔧 Database Schema

### **Users Collection Schema:**
```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  email: String (required, unique),
  password: String (hashed),
  role: String (enum: ['osa', 'security']),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **Violations Collection Schema:**
```javascript
{
  _id: ObjectId,
  studentName: String (required),
  yearLevel: String,
  course: String,
  violation: String (required),
  date: String (required),
  time: String,
  status: String (enum: ['pending', 'resolved', 'not yet resolved']),
  image: String (file path),
  detectedBy: String (username),
  resolvedBy: String,
  resolvedAt: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Verification Steps

### **1. Check Database Connection:**
- Open MongoDB Compass
- Connect using the connection string above
- You should see `dress_code_scanner` database

### **2. Verify Collections:**
- Click on `dress_code_scanner` database
- You should see two collections: `users` and `violations`

### **3. Check Sample Data:**
- Click on `users` collection → should show 2 default users
- Click on `violations` collection → should show 4 sample violations

### **4. Test Application:**
- Go to `http://localhost:3000`
- Login with demo accounts
- Add new violations and see them appear in MongoDB

## 📈 Database Features

### **Indexes for Performance:**
- `users.email` (unique)
- `users.username` (unique)
- `violations.studentName`
- `violations.date`
- `violations.status`
- `violations.createdAt`

### **Data Validation:**
- Email format validation
- Required field validation
- String length limits
- Enum value validation

### **Automatic Features:**
- Password hashing with bcrypt
- Timestamps (createdAt, updatedAt)
- Resolved timestamp when status changes
- Default values for optional fields

## 🔍 Monitoring Database Changes

### **Real-time Updates:**
- New violations appear immediately in MongoDB
- Status changes are tracked with timestamps
- User login times are recorded

### **Using MongoDB Compass:**
1. Keep Compass open while using the application
2. Refresh collections to see new data
3. Use the filter feature to search violations
4. Monitor real-time changes as you use the app

## 🛠️ Troubleshooting

### **Connection Issues:**
- Ensure MongoDB is running on your system
- Check if port 27017 is available
- Verify no firewall blocking the connection

### **Data Not Appearing:**
- Check server console for errors
- Refresh the collection in Compass
- Verify the application is connected to the correct database

### **Performance:**
- Indexes are automatically created for better query performance
- Large datasets will benefit from the implemented indexing strategy

---

**Note:** This setup is for development purposes. For production, consider:
- Authentication and authorization
- SSL/TLS encryption
- Database clustering
- Regular backups
- Environment-specific configurations
