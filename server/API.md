# SlotSwapper API Documentation

## Base URL
- **Production:** `https://slotswapper-servicehive-production.up.railway.app`
- **Local Dev:** `http://localhost:5000`

## Authentication

All protected endpoints require JWT token in Authorization header:

Authorization: Bearer 40ea1482b9d19055a2e90ccb8c6dc221a5fd066dfbeb579f67efc69ec3c866e1

---

## Authentication Endpoints

### Register User
POST /api/auth/register

Request Body:
{
"name": "John Doe",
"email": "john@example.com",
"password": "SecurePass123"
}

Response (201 Created):
{
"message": "User registered successfully",
"user": {
"id": 1,
"name": "John Doe",
"email": "john@example.com",
"created_at": "2025-11-05T..."
},
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

text

### Login
POST /api/auth/login

Request Body:
{
"email": "john@example.com",
"password": "SecurePass123"
}

Response (200 OK):
{
"message": "Login successful",
"user": { ... },
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

### Login
POST /api/auth/login

Request Body:
{
"email": "john@example.com",
"password": "SecurePass123"
}

Response (200 OK):
{
"message": "Login successful",
"user": { ... },
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

---

## Events Endpoints

### Get All User Events
GET /api/events
Headers: Authorization: Bearer <token>

Response (200 OK):
{
"events": [
{
"id": 1,
"title": "Team Meeting",
"start_time": "2025-11-10T10:00:00Z",
"end_time": "2025-11-10T11:00:00Z",
"status": "BUSY",
"user_id": 1,
"created_at": "2025-11-05T..."
}
],
"count": 1
}

### Create Event
POST /api/events
Headers: Authorization: Bearer <token>

Request Body:
{
"title": "Doctor Appointment",
"start_time": "2025-11-15T14:00:00Z",
"end_time": "2025-11-15T15:00:00Z"
}

Response (201 Created):
{
"message": "Event created successfully",
"event": { ... }
}

Error (400 Bad Request):
{
"error": "Start time must be before end time"
}

Error (400 Bad Request):
{
"error": "This event overlaps with an existing event in your calendar"
}

### Update Event
PUT /api/events/:id
Headers: Authorization: Bearer <token>

Request Body:
{
"status": "SWAPPABLE"
}

Response (200 OK):
{
"message": "Event updated successfully",
"event": { ... with updated status ... }
}

### Delete Event
DELETE /api/events/:id
Headers: Authorization: Bearer <token>

Response (200 OK):
{
"message": "Event deleted successfully"
}

---

## Swap Marketplace Endpoints

### Browse Swappable Slots
GET /api/swap/marketplace
Headers: Authorization: Bearer <token>

Response (200 OK):
{
"slots": [
{
"id": 5,
"title": "Shift Available",
"start_time": "2025-11-20T09:00:00Z",
"end_time": "2025-11-20T17:00:00Z",
"user_id": 2,
"user_name": "Alice Smith",
"user_email": "alice@example.com"
}
],
"count": 1
}

### Create Swap Request
POST /api/swap/request
Headers: Authorization: Bearer <token>

Request Body:
{
"mySlotId": 1,
"theirSlotId": 5
}

Response (201 Created):
{
"message": "Swap request created successfully",
"swapRequest": {
"id": 1,
"requester_id": 1,
"requester_slot_id": 1,
"target_user_id": 2,
"target_slot_id": 5,
"status": "PENDING",
"created_at": "2025-11-05T..."
}
}

Error (400 Bad Request):
{
"error": "You already have a pending swap request for these slots"
}

### Get Incoming Requests
GET /api/swap/incoming
Headers: Authorization: Bearer <token>

Response (200 OK):
{
"requests": [
{
"id": 1,
"status": "PENDING",
"requester_name": "John Doe",
"their_slot_title": "Team Meeting",
"my_slot_title": "Doctor Appointment",
...
}
],
"count": 1
}

### Respond to Swap Request
POST /api/swap/respond/:requestId
Headers: Authorization: Bearer <token>

Request Body:
{
"accept": true
}

Response (200 OK):
{
"message": "Swap request accepted! Events have been swapped.",
"swapRequest": { ... }
}

OR reject with accept: false:
{
"message": "Swap request rejected. Slots are back to swappable.",
"swapRequest": { ... }
}

---

## Error Responses

### 401 Unauthorized
{
"error": "Access token required"
}

### 403 Forbidden
{
"error": "Invalid or expired token"
}

### 404 Not Found
{
"error": "Event not found"
}

### 500 Server Error
{
"error": "Failed to create event"
}

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Real-Time Events (Socket.IO)

Connect with:

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Real-Time Events (Socket.IO)

Connect with:

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Real-Time Events (Socket.IO)

Connect with:

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Real-Time Events (Socket.IO)

Connect with:
const socket = io('https://slotswapper-servicehive-production.up.railway.app', {
transports: ['websocket', 'polling']
});

// Join user room
socket.emit('join', userId);

// Listen for notifications
socket.on('new_swap_request', (data) => {
console.log('New swap request:', data);
});

socket.on('swap_accepted', (data) => {
console.log('Swap accepted:', data);
});

socket.on('swap_rejected', (data) => {
console.log('Swap rejected:', data);
});

---

## Rate Limiting

Currently not implemented. Will be added in future versions.

---

## Changelog

### v1.0.0 (November 5, 2025)
- Initial release
- Authentication system
- Event CRUD operations
- Peer-to-peer swap marketplace
- Real-time notifications
- Comprehensive test coverage