# Backend API Reference

**Base URL**: https://delivery-routing-system.onrender.com  
**Authentication**: OAuth2 Bearer Token (JWT)  
**Docs**: `/docs` (Swagger UI) | `/redoc` (ReDoc)

---

## Authentication

### Login
- **Endpoint**: `POST /user/Login/`
- **Body**: `application/x-www-form-urlencoded`
  ```
  username: string (min 3 chars)
  password: string (min 6 chars)
  ```
- **Response**: `{ access_token: string, token_type: "bearer" }`
- **Usage**: Add header `Authorization: Bearer {access_token}` to all protected requests

### Signup
- **Endpoint**: `POST /user/Signup/`
- **Body**: JSON
  ```json
  {
    "username": "string",
    "email": "user@example.com",
    "password": "string",
    "work_location": "string",
    "address": "string"
  }
  ```
- **Response**: `{ id: string, username: string, email: string, role: string }`

### Logout
- **Endpoint**: `POST /user/logout/` (Protected)
- **Response**: `{ message: "Logged out successfully" }`

### Update Profile
- **Endpoint**: `PUT /user/UpdateProfile/` (Protected)
- **Body**: JSON (all fields optional)
  ```json
  {
    "email": "string",
    "work_location": "string",
    "address": "string",
    "password": "string"
  }
  ```
- **Response**: Updated user object

---

## Consignments

### Create Consignment
- **Endpoint**: `POST /consignment/create` (Protected)
- **Body**: `multipart/form-data`
  ```
  origin_pincode: string (numeric, 6 digits)
  destination_pincode: string (numeric, 6 digits)
  product_type: string
  weight: number
  image: File (JPEG/PNG/WebP, max 5MB)
  ```
- **Response**: `{ consignment_id: string, qr_code_url: string, status: "pending" }`

### Get All Consignments
- **Endpoint**: `GET /consignment/all` (Protected)
- **Query Parameters**:
  ```
  limit: number (default 10)
  skip: number (default 0)
  ```
- **Response**: Array of consignment objects

### Get Consignment
- **Endpoint**: `GET /consignment/{id}` or `GET /consignment/by_name/{name}` (Protected)
- **Response**: Consignment object with full details

### Update Consignment Details
- **Endpoint**: `PUT /consignment/update/{id}` (Protected)
- **Body**: JSON (all fields optional)
  ```json
  {
    "product_type": "string",
    "weight": number,
    "destination_pincode": "string"
  }
  ```
- **Response**: Updated consignment object

### Update Consignment Image
- **Endpoint**: `PUT /consignment/image/{id}` (Protected)
- **Body**: `multipart/form-data`
  ```
  image: File (JPEG/PNG/WebP, max 5MB)
  ```
- **Response**: `{ message: "Image updated", image_url: string }`

### Scan QR Code
- **Endpoint**: `POST /consignment/scan_qr` (Protected)
- **Body**: `multipart/form-data`
  ```
  qr_image: File
  status: string ("pending" | "in-transit" | "delivered")
  ```
- **Response**: `{ consignment_id: string, status: string, updated_at: string }`

### Check Pincode
- **Endpoint**: `GET /consignment/check_pincode/{pincode}` (Protected)
- **Response**: `{ valid: boolean, region: string }`

---

## Route Optimization

### Get Optimal Path
- **Endpoint**: `GET /Paths/optimal_path/{consignment_id}` (Protected)
- **Response**:
  ```json
  {
    "optimal_path": ["hub1", "hub2", "hub3"],
    "distance": number,
    "estimated_time": "HH:MM",
    "cost": number
  }
  ```

### Get Route Matrix
- **Endpoint**: `GET /Paths/matrix` (Protected)
- **Query Parameters**:
  ```
  hubs: string (comma-separated: "hub1,hub2,hub3")
  vehicles: number (count of vehicles)
  ```
- **Response**: Distance/time matrix between all hubs

### Get Routes Between
- **Endpoint**: `GET /Paths/routes` (Protected)
- **Query Parameters**:
  ```
  source: string (source location)
  destination: string (destination location)
  ```
- **Response**: Array of possible routes with details

### Get Deliveries
- **Endpoint**: `GET /Deliveries` (Protected)
- **Query Parameters**:
  ```
  work_location: string (optional, filter by location)
  ```
- **Response**: Array of delivery tasks assigned to user

---

## Data Models

### User
```javascript
{
  id: string (UUID),
  username: string,
  email: string,
  role: string ("admin" | "manager" | "operator"),
  work_location: string,
  address: string,
  created_at: string (ISO date),
  updated_at: string (ISO date)
}
```

### Consignment
```javascript
{
  consignment_id: string (UUID),
  origin_pincode: string,
  destination_pincode: string,
  product_type: string,
  weight: number,
  status: string ("pending" | "in-transit" | "delivered"),
  image_url: string,
  qr_code_url: string,
  created_at: string (ISO date),
  updated_at: string (ISO date),
  user_id: string
}
```

### Route
```javascript
{
  route_id: string (UUID),
  consignment_id: string,
  hubs: string[] (array of hub names),
  distance: number (km),
  estimated_time: string ("HH:MM"),
  cost: number,
  optimization_score: number (0-100),
  created_at: string (ISO date)
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "detail": "Invalid input"
}
```

### 401 - Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 422 - Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "origin_pincode"],
      "msg": "String should match pattern '^[0-9]{6}$'",
      "type": "string_pattern"
    }
  ]
}
```

### 404 - Not Found
```json
{
  "detail": "Consignment not found"
}
```

### 500 - Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- All numeric IDs are UUIDs
- Pincodes must be exactly 6 digits
- Images max 5MB (JPEG, PNG, WebP)
- Token expires after 24 hours (check backend for actual TTL)
- Pagination uses `limit` (page size) + `skip` (offset) pattern
- All protected endpoints require valid Bearer token in Authorization header

**See README.md for quick start and development workflow.**
