# AWS-Project
# AI Production Management System

## Overview

AI Production Management System is a cloud-based web application designed to assist manufacturing companies in managing production planning, order processing, and factory performance monitoring.

The system allows managers to analyze production capacity, schedule manufacturing tasks, and monitor production efficiency in real time.

The application is deployed using containerized architecture on AWS cloud infrastructure.

---

# System Objectives

The system aims to:

* Support production order management
* Optimize production scheduling
* Monitor manufacturing performance
* Improve production transparency
* Assist decision-making for order acceptance

---

# User Roles

The system supports three main roles.

## Admin

Responsible for managing system configuration and users.

Functions:

* Manage user accounts
* Manage system roles
* Monitor system activity

---

## Manager

Responsible for production planning and order scheduling.

Functions:

* Create production orders
* Attach SOP and related documents
* Schedule production plans
* Monitor production progress
* Analyze production delays

---

## Line Leader

Responsible for executing production tasks.

Functions:

* View assigned production schedule
* Receive production files via email
* Track production tasks

---

# System Features

## Order Management

Managers can create and manage production orders including:

* Order information
* Production quantity
* Required production line
* SOP and production documents

---

## Production Scheduling

The system allows managers to:

* Schedule production orders
* Allocate resources
* Visualize schedules using Gantt charts
* Detect scheduling conflicts

---

## Production Monitoring

The system monitors production performance including:

* Production progress
* Delay tracking
* Manufacturing efficiency

Metrics supported:

* Production schedule timeline
* Delay monitoring
* OEE (Overall Equipment Effectiveness)

---

## Email Notification

The system supports:

* OTP email for password reset
* Production schedule notifications
* Sending production documents to line leaders

---

# System Architecture

The system is deployed on AWS cloud infrastructure using containerized services.

Main cloud services include:

* Amazon Route53
* Amazon CloudFront
* AWS Application Load Balancer
* Amazon Elastic Container Registry
* Amazon Elastic Container Service
* Amazon RDS
* Amazon S3
* Amazon Simple Email Service

---

# System Request Flow

User request flow in production environment:

1. User accesses the system via domain.
2. DNS resolution handled by Route53.
3. Static resources delivered through CloudFront.
4. API requests forwarded to Application Load Balancer.
5. ALB routes traffic to backend containers running on ECS.
6. Backend container images are stored in ECR.
7. Backend services communicate with database hosted on RDS.
8. Production documents and files are uploaded to S3.
9. Notification emails are sent through SES.

---

# Technology Stack

## Backend

* Java
* Spring Boot
* Spring Security
* JPA / Hibernate
* REST API

## Frontend

* React
* Axios
* REST API Integration

## Database

* PostgreSQL

## Cloud Infrastructure

* Docker
* AWS ECS
* AWS ECR
* AWS RDS
* AWS S3
* AWS CloudFront
* AWS Route53
* AWS SES

---

# Backend Project Structure

```
backend
 ├── controller
 ├── service
 ├── repository
 ├── entity
 ├── dto
 ├── config
 ├── security
 └── Application.java
```

---

# Frontend Project Structure

```
frontend
 ├── src
 │   ├── components
 │   ├── pages
 │   ├── services
 │   ├── hooks
 │   └── App.js
```

---

# Local Development Setup

## Clone Repository

```
git clone https://github.com/your-username/project-name.git
```

---

## Run Backend

```
cd backend
mvn spring-boot:run
```

---

## Run Frontend

```
cd frontend
npm install
npm start
```

---

# Environment Configuration

Example environment variables:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://database-url
SPRING_DATASOURCE_USERNAME=username
SPRING_DATASOURCE_PASSWORD=password

AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=production-files

SES_EMAIL=system@email.com
```

---

# Deployment

The backend is deployed using containerized infrastructure:

1. Build Docker image
2. Push image to Amazon ECR
3. Deploy container using AWS ECS
4. Route traffic through Application Load Balancer
5. Access application through domain configured in Route53

---

# Future Improvements

Planned improvements include:

* AI-based production scheduling optimization
* Machine learning for delay prediction
* Real-time production dashboard
* Advanced production analytics
* IoT integration with factory machines


