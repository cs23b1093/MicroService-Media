# Microservices Social Media Platform

A scalable social media platform built with Node.js microservices architecture, featuring user management, post creation, media handling, and search functionality.

## 🏗️ Architecture

This project follows a microservices architecture with the following services:

- **API Gateway** - Central entry point for all client requests with authentication and rate limiting
- **Details Service** - User management, authentication, and profile handling
- **Post Service** - Post creation, retrieval, and management
- **Media Service** - File upload, processing, and media management with Cloudinary integration
- **Search Service** - Search functionality across posts and users

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Authentication**: JWT tokens
- **File Storage**: Cloudinary
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- MongoDB instance (or use Docker)
- Redis instance (or use Docker)
- RabbitMQ instance (or use Docker)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Set up environment variables**
   
   Create `.env` files in each service directory:
   
   **api_gateway/.env**
   ```env
   PORT=3000
   REDIS_URL=redis://localhost:6379
   RABBITMQ_URL=amqp://localhost:5672
   DETAILS_URL=http://details:3001
   POST_URL=http://post-service:3002
   MEDIA_URL=http://media-service:3003
   SEARCH_URL=http://search-service:3004
   JWT_SECRET=your-jwt-secret
   ```
   
   **details/.env**
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/social_media_details
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   ```
   
   **post-service/.env**
   ```env
   PORT=3002
   MONGODB_URI=mongodb://localhost:27017/social_media_posts
   REDIS_URL=redis://localhost:6379
   RABBITMQ_URL=amqp://localhost:5672
   JWT_SECRET=your-jwt-secret
   ```
   
   **media-service/.env**
   ```env
   PORT=3003
   MONGODB_URI=mongodb://localhost:27017/social_media_media
   REDIS_URL=redis://localhost:6379
   RABBITMQ_URL=amqp://localhost:5672
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   JWT_SECRET=your-jwt-secret
   ```
   
   **search-service/.env**
   ```env
   PORT=3004
   MONGODB_URI=mongodb://localhost:27017/social_media_search
   REDIS_URL=redis://localhost:6379
   RABBITMQ_URL=amqp://localhost:5672
   JWT_SECRET=your-jwt-secret
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - API Gateway: http://localhost:3000
   - RabbitMQ Management: http://localhost:15672 (guest/guest)
   - Redis: localhost:6379

### Manual Setup

If you prefer to run services individually:

1. **Install dependencies for each service**
   ```bash
   # For each service directory
   cd api_gateway && npm install
   cd ../details && npm install
   cd ../post-service && npm install
   cd ../media-service && npm install
   cd ../search-service && npm install
   ```

2. **Start external services**
   ```bash
   # Start Redis
   redis-server
   
   # Start RabbitMQ
   rabbitmq-server
   
   # Start MongoDB
   mongod
   ```

3. **Start each microservice**
   ```bash
   # Terminal 1 - API Gateway
   cd api_gateway && npm run dev
   
   # Terminal 2 - Details Service
   cd details && npm run dev
   
   # Terminal 3 - Post Service
   cd post-service && npm run dev
   
   # Terminal 4 - Media Service
   cd media-service && npm run dev
   
   # Terminal 5 - Search Service
   cd search-service && npm run dev
   ```

## 📡 API Endpoints

### Authentication (via API Gateway)
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh JWT token
- `POST /v1/auth/logout` - User logout

### Posts (via API Gateway)
- `GET /v1/posts` - Get all posts
- `POST /v1/posts` - Create a new post
- `GET /v1/posts/:id` - Get specific post
- `PUT /v1/posts/:id` - Update post
- `DELETE /v1/posts/:id` - Delete post

### Media (via API Gateway)
- `POST /v1/media/upload` - Upload media files
- `GET /v1/media/:id` - Get media file
- `DELETE /v1/media/:id` - Delete media file

### Search (via API Gateway)
- `GET /v1/search/posts?q=query` - Search posts
- `GET /v1/search/users?q=query` - Search users

## 🔧 Development

### Running Tests
```bash
# Run tests for all services
npm test

# Run tests for specific service
cd api_gateway && npm test
```

### Code Style
The project uses ESLint and Prettier for code formatting. Run:
```bash
npm run lint
npm run format
```

### Debugging
Each service includes Winston logging. Logs are output to console and can be configured for file output.

## 🐳 Docker

### Building Images
```bash
# Build all services
docker-compose build

# Build specific service
docker build -t api-gateway ./api_gateway
```

### Environment Variables
All services support the following environment variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Service port
- `REDIS_URL` - Redis connection string
- `RABBITMQ_URL` - RabbitMQ connection string
- `JWT_SECRET` - JWT signing secret

## 🔒 Security Features

- **Rate Limiting**: Redis-backed rate limiting on API Gateway
- **Authentication**: JWT-based authentication with refresh tokens
- **Input Validation**: Joi schema validation on all inputs
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: Argon2 for secure password storage
- **CORS**: Configurable CORS policies

## 📊 Monitoring & Logging

- **Logging**: Winston logger with structured logging
- **Health Checks**: Built-in health check endpoints
- **Rate Limiting**: Redis-based rate limiting with monitoring
- **Error Handling**: Centralized error handling middleware

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use proper secrets management
2. **Database**: Use managed MongoDB service (MongoDB Atlas)
3. **Cache**: Use managed Redis service (Redis Cloud)
4. **Message Queue**: Use managed RabbitMQ service (CloudAMQP)
5. **File Storage**: Configure Cloudinary for media storage
6. **Load Balancing**: Use load balancer in front of API Gateway
7. **SSL/TLS**: Enable HTTPS in production

### CI/CD Pipeline

The project includes GitHub Actions workflow that:
- Runs tests on all services
- Builds Docker images
- Performs security checks
- Deploys to staging/production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000-3004, 5672, 6379, 15672 are available
2. **MongoDB connection**: Verify MongoDB is running and accessible
3. **Redis connection**: Check Redis server status
4. **RabbitMQ connection**: Ensure RabbitMQ is running with management plugin
5. **Environment variables**: Verify all required environment variables are set

### Logs
Check service logs for detailed error information:
```bash
docker-compose logs [service-name]
```

## 📞 Support

For support and questions, please open an issue in the GitHub repository.