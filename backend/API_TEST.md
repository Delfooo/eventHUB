# EventHub Authentication API Test

## Server Status
✅ Server running on http://localhost:3000
✅ Database: In-memory (test mode)
✅ All endpoints working

## Available Endpoints

### 1. Register User
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

### 2. Login User
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. Verify Token
```http
GET http://localhost:3000/api/auth/verify
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Get Current User
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Logout User
```http
POST http://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

## Test Results
✅ Registration - Working
✅ Login - Working  
✅ Token Verification - Working
✅ Get User Info - Working
✅ Logout - Working

## JWT Token Info
- Algorithm: HS256
- Expires in: 7 days
- Secret: eventhub-super-secret-jwt-key-2024

## Next Steps
1. Connect to MongoDB (replace app.test.js with app.js)
2. Add frontend interface
3. Add more features (events, chat, etc.)