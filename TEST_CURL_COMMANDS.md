# Test Curl Commands for Chat & Profile Picture APIs

## Prerequisites
1. Server must be running: `npm run dev`
2. Replace `YOUR_TOKEN` with actual JWT token from login
3. Replace `USER_ID` with actual user ID from database

## Step 1: Login to Get Token

```bash
curl -X POST http://localhost:8087/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Response:** Copy the `token` from response

---

## CHAT APIs

### 1. Send Message

```bash
curl -X POST http://localhost:8087/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "USER_ID",
    "content": "Hello! This is a test message"
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "sender": {...},
    "recipient": {...},
    "content": "Hello! This is a test message",
    "read": false,
    "createdAt": "..."
  }
}
```

---

### 2. Get Conversations

```bash
curl -X GET http://localhost:8087/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "...",
      "userName": "...",
      "lastMessage": {...},
      "unreadCount": 0,
      "totalMessages": 1
    }
  ]
}
```

---

### 3. Get Messages

```bash
# Get all messages
curl -X GET "http://localhost:8087/api/chat/messages?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get messages with specific user
curl -X GET "http://localhost:8087/api/chat/messages?userId=USER_ID&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "sender": {...},
      "recipient": {...},
      "content": "...",
      "read": false,
      "createdAt": "..."
    }
  ]
}
```

---

### 4. Mark Message as Read

```bash
curl -X PATCH http://localhost:8087/api/chat/messages/MESSAGE_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Mark All Messages as Read

```bash
# Mark all as read
curl -X PATCH "http://localhost:8087/api/chat/messages/read-all" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark all from specific user as read
curl -X PATCH "http://localhost:8087/api/chat/messages/read-all?userId=USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## PROFILE PICTURE APIs

### 1. Upload/Update Profile Picture

```bash
curl -X POST http://localhost:8087/api/users/me/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "profilePicture": "/assets/profiles/profile-...jpg",
    "message": "Profile picture uploaded successfully"
  }
}
```

**Note:** 
- Supported formats: JPEG, JPG, PNG, WebP
- Max size: 5MB
- Image will be saved in `public/assets/profiles/` folder

---

### 2. Delete Profile Picture

```bash
curl -X DELETE http://localhost:8087/api/users/me/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "message": "Profile picture deleted successfully"
  }
}
```

---

## Quick Test Sequence

1. **Login:**
```bash
curl -X POST http://localhost:8087/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password123"}'
```

2. **Send Message:**
```bash
curl -X POST http://localhost:8087/api/chat/messages -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"recipientId":"USER_ID","content":"Test message"}'
```

3. **Get Conversations:**
```bash
curl -X GET http://localhost:8087/api/chat/conversations -H "Authorization: Bearer TOKEN"
```

4. **Upload Profile Picture:**
```bash
curl -X POST http://localhost:8087/api/users/me/avatar -H "Authorization: Bearer TOKEN" -F "file=@test.jpg"
```

5. **Delete Profile Picture:**
```bash
curl -X DELETE http://localhost:8087/api/users/me/avatar -H "Authorization: Bearer TOKEN"
```

---

## Troubleshooting

- **401 Unauthorized:** Check if token is valid and not expired
- **400 Bad Request:** Check request body format and required fields
- **404 Not Found:** Check if user/message ID exists
- **500 Server Error:** Check server logs for details


