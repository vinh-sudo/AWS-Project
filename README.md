# AI Production Management System

A web system for production management: order handling, scheduling, progress tracking, and role-based notifications.

## Features

- Manage production orders and plans
- Schedule tasks, track progress, and detect delays
- Role-based access: `ADMIN`, `MANAGER`, `LINE_LEADER`
- Send password reset OTP via Amazon SES
- Notification flow using Amazon SNS -> Amazon SQS
- Store production documents on Amazon S3

## Tech Stack

- Backend: Java 17, Spring Boot, Spring Security, JPA/Hibernate, Redis
- Frontend: React (Vite), Redux Toolkit, Axios
- Database: PostgreSQL
- AWS: ECS, ECR, RDS, S3, SES, SNS, SQS, ALB, CloudFront, Route 53

## Project Structure

```text
AWS-Project/
├── buildspec.yml
├── backend/
│   └── backend/        # Spring Boot app
└── frontend/           # React + Vite app
```

## Run Locally

### Backend

```powershell
cd backend/backend
.\mvnw.cmd spring-boot:run
```

Default backend URL: `http://localhost:8080`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

## Environment Variables

Backend config is based on `backend/backend/src/main/resources/application.yml`:

```bash
RDS_USERNAME=your_db_username
RDS_PASSWORD=your_db_password
REDIS_HOST=your_redis_host
REDIS_PASSWORD=your_redis_password
SES_SMTP_USERNAME=your_ses_smtp_username
SES_SMTP_PASSWORD=your_ses_smtp_password
JWT_SECRET_KEY=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

Frontend:

```bash
# local development (optional)
VITE_API_URL=http://localhost:8080

# production build for S3/CloudFront
VITE_API_URL=https://api.ims.mom
```

For production builds, the frontend repo includes `frontend/.env.production`.
So the deployer only needs to pull latest code and run build, no manual API URL edits.

## API Docs

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Deployment Notes

- Root `buildspec.yml` builds backend, builds/pushes Docker image to ECR, and generates `imagedefinitions.json` for ECS deployment.
- Production flow: Route 53 -> CloudFront/ALB -> ECS -> RDS/S3, email via SES, event notifications via SNS/SQS.
- Frontend handoff flow (S3): pull latest branch -> `cd frontend` -> `npm ci` -> `npm run build` -> upload contents of `frontend/dist` to S3.
