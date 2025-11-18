# Complete Curl Commands for Messages/Chat APIs

## Base URL
```
http://localhost:8087
```
or
```
http://103.14.120.163:8087
```

---

## 1. SEND MESSAGE (POST)

### Basic Send Message
```bash
curl -X POST http://localhost:8087/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "69158b77bf21223e78398dc9",
    "content": "Hello! This is a test message"
  }'
```

### Windows (Single Line)
```bash
curl -X POST http://localhost:8087/api/chat/messages -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"recipientId\":\"69158b77bf21223e78398dc9\",\"content\":\"Hello! This is a test message\"}"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "691852e53edbbd5f691ffa0d",
    "sender": {
      "_id": "691840843edbbd5f691ff979",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee",
      "department": "IT"
    },
    "recipient": {
      "_id": "69158b77bf21223e78398dc9",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "manager",
      "department": "HR"
    },
    "content": "Hello! This is a test message",
    "read": false,
    "createdAt": "2024-11-15T10:16:05.475Z"
  }
}
```

---

## 2. GET MESSAGES (GET)

### Get All Messages (Default limit: 50)
```bash
curl -X GET http://localhost:8087/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Messages with Limit
```bash
curl -X GET "http://localhost:8087/api/chat/messages?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Messages with Specific User (Conversation)
```bash
curl -X GET "http://localhost:8087/api/chat/messages?userId=69158b77bf21223e78398dc9" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Messages with User and Limit
```bash
curl -X GET "http://localhost:8087/api/chat/messages?userId=69158b77bf21223e78398dc9&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Messages with Pagination (Before Date)
```bash
curl -X GET "http://localhost:8087/api/chat/messages?before=2024-11-15T10:00:00.000Z&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Messages - All Parameters Combined
```bash
curl -X GET "http://localhost:8087/api/chat/messages?userId=69158b77bf21223e78398dc9&limit=30&before=2024-11-15T10:00:00.000Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Windows (Single Line Examples)
```bash
# Get all messages
curl -X GET "http://localhost:8087/api/chat/messages" -H "Authorization: Bearer YOUR_TOKEN"

# Get messages with user
curl -X GET "http://localhost:8087/api/chat/messages?userId=69158b77bf21223e78398dc9&limit=50" -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "691852e53edbbd5f691ffa0d",
      "sender": {
        "_id": "691840843edbbd5f691ff979",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee",
        "department": "IT"
      },
      "recipient": {
        "_id": "69158b77bf21223e78398dc9",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "manager",
        "department": "HR"
      },
      "content": "Hello! This is a test message",
      "read": false,
      "readAt": null,
      "createdAt": "2024-11-15T10:16:05.475Z"
    }
  ]
}
```

---

## 3. MARK MESSAGE AS READ (PATCH)

### Mark Single Message as Read
```bash
curl -X PATCH http://localhost:8087/api/chat/messages/691852e53edbbd5f691ffa0d/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Windows (Single Line)
```bash
curl -X PATCH http://localhost:8087/api/chat/messages/691852e53edbbd5f691ffa0d/read -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "691852e53edbbd5f691ffa0d",
    "sender": {
      "_id": "691840843edbbd5f691ff979",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee",
      "department": "IT"
    },
    "recipient": {
      "_id": "69158b77bf21223e78398dc9",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "manager",
      "department": "HR"
    },
    "content": "Hello! This is a test message",
    "read": true,
    "readAt": "2024-11-15T10:20:00.000Z",
    "createdAt": "2024-11-15T10:16:05.475Z"
  }
}
```

---

## 4. MARK ALL MESSAGES AS READ (PATCH)

### Mark All Unread Messages as Read
```bash
curl -X PATCH http://localhost:8087/api/chat/messages/read-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mark All Messages from Specific User as Read
```bash
curl -X PATCH "http://localhost:8087/api/chat/messages/read-all?userId=69158b77bf21223e78398dc9" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Windows (Single Line)
```bash
# Mark all as read
curl -X PATCH http://localhost:8087/api/chat/messages/read-all -H "Authorization: Bearer YOUR_TOKEN"

# Mark all from specific user as read
curl -X PATCH "http://localhost:8087/api/chat/messages/read-all?userId=69158b77bf21223e78398dc9" -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  }
}
```

---

## 5. GET CONVERSATIONS (GET)

### Get All Conversations
```bash
curl -X GET http://localhost:8087/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Windows (Single Line)
```bash
curl -X GET http://localhost:8087/api/chat/conversations -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "69158b77bf21223e78398dc9",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "userRole": "manager",
      "userDepartment": "HR",
      "lastMessage": {
        "id": "691852e53edbbd5f691ffa0d",
        "content": "Hello! This is a test message",
        "sender": {
          "_id": "691840843edbbd5f691ff979",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "employee",
          "department": "IT"
        },
        "recipient": {
          "_id": "69158b77bf21223e78398dc9",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "role": "manager",
          "department": "HR"
        },
        "read": false,
        "createdAt": "2024-11-15T10:16:05.475Z"
      },
      "unreadCount": 2,
      "totalMessages": 10
    }
  ]
}
```

---

## Complete Test Sequence

### Step 1: Login and Get Token
```bash
curl -X POST http://localhost:8087/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Step 2: Send a Message
```bash
curl -X POST http://localhost:8087/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "69158b77bf21223e78398dc9",
    "content": "Hello! This is my first message"
  }'
```

### Step 3: Get All Conversations
```bash
curl -X GET http://localhost:8087/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Get Messages with Specific User
```bash
curl -X GET "http://localhost:8087/api/chat/messages?userId=69158b77bf21223e78398dc9&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Mark Message as Read
```bash
curl -X PATCH http://localhost:8087/api/chat/messages/MESSAGE_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 6: Mark All Messages as Read
```bash
curl -X PATCH http://localhost:8087/api/chat/messages/read-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Server URL (103.14.120.163)

Replace `localhost:8087` with `103.14.120.163:8087` for server testing:

```bash
# Example: Send Message on Server
curl -X POST http://103.14.120.163:8087/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "69158b77bf21223e78398dc9",
    "content": "Hello from server!"
  }'
```

---

## Important Notes

1. **Replace `YOUR_TOKEN`** with actual JWT token from login response
2. **Replace `USER_ID`** with actual user ID from database
3. **Replace `MESSAGE_ID`** with actual message ID from response
4. **Server must be running** (`npm run dev`)
5. **All endpoints require authentication** (Bearer token)
6. **Content-Type** must be `application/json` for POST requests
7. **Query parameters** are optional for GET requests

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid recipient id"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Message not found"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden"
}
```

