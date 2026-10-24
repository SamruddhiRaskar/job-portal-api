# Job Portal API

A RESTful Job Portal API built using Node.js, Express.js, MongoDB, and Mongoose. The API allows employers to publish and manage job listings while candidates can search for jobs and submit applications.

## Features

* User registration and login
* JWT-based authentication
* Password hashing using bcrypt
* Role-based authorization for candidates and employers
* Create, read, update, and delete job listings
* Search, filtering, sorting, and pagination
* Apply for jobs and view applications
* Application status management
* Job application statistics using MongoDB aggregation
* Job ownership verification
* Duplicate application prevention
* Automatic deletion of applications when a job is deleted
* Centralized error handling

## Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Tokens (JWT)
* bcryptjs
* dotenv
* express-validator

## Project Structure

```text
job-portal-api/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── jobController.js
│   └── applicationController.js
├── middleware/
│   └── authMiddleware.js
├── models/
│   ├── User.js
│   ├── Job.js
│   └── Application.js
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   └── applicationRoutes.js
├── postman/
│   └── Job Portal API.postman_collection.json
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Prerequisites

Install the following before running the project:

* Node.js and npm
* MongoDB Community Server
* Postman

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd job-portal-api
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

Alternatively, download the project and open its folder in VS Code.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root directory.

Add the following configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/job_portal
JWT_SECRET=replace_with_a_long_random_secret
```

Use a strong, private JWT secret for your local configuration and deployment.

Make sure MongoDB is running before starting the API.

### 4. Start the server

For development:

```bash
npm run dev
```

Alternatively:

```bash
npm start
```

The API runs at:

```text
http://localhost:5000
```

## API Endpoints

### Authentication

| Method | Endpoint             | Description                    | Access        |
| ------ | -------------------- | ------------------------------ | ------------- |
| POST   | `/api/auth/register` | Register a user                | Public        |
| POST   | `/api/auth/login`    | Log in                         | Public        |
| GET    | `/api/auth/me`       | Get the current user's profile | Authenticated |

### Jobs

| Method | Endpoint                     | Description                 | Access    |
| ------ | ---------------------------- | --------------------------- | --------- |
| POST   | `/api/jobs`                  | Create a job                | Employer  |
| GET    | `/api/jobs`                  | List and search open jobs   | Public    |
| GET    | `/api/jobs/:id`              | Get a job by ID             | Public    |
| PUT    | `/api/jobs/:id`              | Update a job                | Job owner |
| PATCH  | `/api/jobs/:id/close`        | Close a job                 | Job owner |
| DELETE | `/api/jobs/:id`              | Delete a job                | Job owner |
| GET    | `/api/jobs/:id/stats`        | Get application statistics  | Job owner |
| GET    | `/api/jobs/:id/applications` | View applications for a job | Job owner |
| POST   | `/api/jobs/:id/apply`        | Apply for a job             | Candidate |

### Applications

| Method | Endpoint                       | Description                               | Access              |
| ------ | ------------------------------ | ----------------------------------------- | ------------------- |
| GET    | `/api/applications/my`         | View the current candidate's applications | Candidate           |
| PATCH  | `/api/applications/:id/status` | Update an application's status            | Job-owning employer |
| DELETE | `/api/applications/:id`        | Withdraw an application                   | Application owner   |

## Authentication

Protected endpoints use JWT authentication.

Include the token in the request header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Register or log in to obtain a token.

The API supports two roles:

* **Candidate:** Can browse jobs, apply for jobs, view their applications, and withdraw eligible applications.
* **Employer:** Can create jobs and manage their own jobs and the applications associated with those jobs.

Passwords are hashed before storage and are not returned in API responses.

## Job Search and Pagination

The public job listing endpoint supports search, filtering, sorting, and pagination.

Example:

```text
GET /api/jobs?search=Backend&location=Pune&type=internship&minSalary=10000&sort=-createdAt&page=1&limit=10
```

Supported query parameters:

* `search`: Search job titles and company names.
* `location`: Filter by location.
* `type`: Filter by job type.
* `skill`: Filter by skill.
* `minSalary`: Filter by minimum salary.
* `sort`: Sort by salary or creation date.
* `page`: Select the page number.
* `limit`: Set the number of results per page.

Only open jobs appear in the public job listing.

## Application Business Rules

* Only candidates can apply for jobs.
* Employers cannot apply for jobs.
* Applications are accepted only for open jobs.
* A candidate cannot apply to the same job more than once.
* Employers can manage only their own jobs and associated applications.
* Candidates can withdraw only their own applications while the status is `applied`.
* Deleting a job also deletes its associated applications.

### Application Status Transitions

The allowed status transitions are:

```text
applied
  ├── shortlisted
  │     ├── hired
  │     └── rejected
  └── rejected
```

The `hired` and `rejected` statuses are terminal. No further status transitions are allowed from them.

## Error Handling

The API uses consistent error responses.

Example:

```json
{
  "success": false,
  "message": "Job not found"
}
```

Common HTTP status codes:

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| 200    | Request successful                             |
| 201    | Resource created                               |
| 400    | Invalid input or request                       |
| 401    | Authentication failed or token missing/invalid |
| 403    | Insufficient permissions                       |
| 404    | Resource or route not found                    |
| 409    | Duplicate resource or conflicting operation    |
| 500    | Internal server error                          |

## Postman Documentation

The Postman collection is available in the `postman/` directory.

It contains three folders:

* Auth
* Jobs
* Applications

Configure a Postman environment with the following variables:

```text
baseUrl
employerToken
candidateToken
jobId
applicationId
```

Set `baseUrl` to `http://localhost:5000` for local testing. Obtain tokens by logging in, and use valid resource IDs from API responses.

## Database

The application uses MongoDB with Mongoose models for:

* Users
* Jobs
* Applications

The application model prevents duplicate applications by creating a unique compound index on the job and candidate fields.

Job statistics are calculated using MongoDB aggregation.

## Security

* Passwords are hashed using bcrypt.
* JWTs protect authenticated routes.
* Role-based access control restricts candidate and employer operations.
* Job ownership is checked before employer management operations.
* Environment variables are stored in `.env`.
* The `.env` file must not be committed to Git.

## Future Improvements

* Email verification
* Password reset functionality
* Resume uploads
* Advanced job recommendations
* Automated integration testing

## Author

Developed as a Job Portal API project using Node.js, Express.js, and MongoDB.
