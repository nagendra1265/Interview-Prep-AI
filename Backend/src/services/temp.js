const resume = `Aarav Sharma
Full-stack Software Engineer | 3 years of experience
Pune, India | aarav.sharma@example.com | LinkedIn: linkedin.com/in/aarav-sharma | GitHub: github.com/aarav-sharma

SUMMARY
Full-stack engineer with 3 years of experience delivering customer-facing web products using React, TypeScript, Node.js, and PostgreSQL. Experienced in taking features from requirements through implementation, testing, release, and monitoring. Enjoys improving performance, building maintainable APIs, and collaborating with product, design, and QA teams.

EXPERIENCE
Software Engineer | BrightCart | Pune, India | Jan 2023-present
- Developed React and TypeScript workflows for a retail operations dashboard used by approximately 1,200 store employees.
- Designed and maintained Node.js/Express REST endpoints for inventory, order tracking, and account management; added input validation, pagination, and consistent error responses.
- Reviewed slow PostgreSQL queries with EXPLAIN ANALYZE and added targeted indexes, reducing p95 response time for a frequently used inventory endpoint from 1.8 seconds to 650 ms.
- Built reusable form and table components and added accessible loading, empty, and error states, reducing repeated UI implementation across three product areas.
- Added Jest and React Testing Library coverage for key workflows and API behavior; helped reduce recurring regression reports after releases.
- Worked with product, design, QA, and two other engineers in two-week sprints; participated in code reviews, estimation, and release support.
- Used Docker Compose for local development and GitHub Actions for linting and test checks. Supported AWS deployments with guidance from senior engineers.

Junior Developer | PixelWorks | Pune, India | Jul 2021-Dec 2022
- Implemented responsive React interfaces from Figma designs and verified behavior across desktop and mobile breakpoints.
- Built and maintained Express API routes and MongoDB queries for user profiles and content management features.
- Fixed production UI defects by reproducing issues, reviewing browser logs, and coordinating changes with QA.
- Wrote unit tests and contributed to pull request reviews; documented setup steps that helped new team members run the application locally.

SELECTED PROJECTS
Inventory Health Dashboard | React, TypeScript, Node.js, PostgreSQL
- Built a dashboard showing low-stock products and recent inventory changes, with filters and paginated results.
- Added a scheduled report export endpoint and role-based access checks for store managers.

Team Notes API | Node.js, Express, MongoDB, Docker
- Created a small REST API with authentication, CRUD operations, request validation, and integration tests as a personal learning project.
- Containerized the service and documented local setup; explored deployment concepts but have not operated it at production scale.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, SQL
Frontend: React, HTML, CSS, responsive design, accessibility fundamentals
Backend: Node.js, Express, REST APIs, authentication, request validation
Data: PostgreSQL, MongoDB, query optimization, schema design fundamentals
Tools: Git, Docker, GitHub Actions, Jest, React Testing Library, Postman
Cloud: AWS deployment support; introductory experience with cloud monitoring and CI/CD

EDUCATION
B.Tech in Computer Science | Savitribai Phule Pune University | 2021

ADDITIONAL
Languages: English, Hindi, Marathi
Interests: developer tooling, performance troubleshooting, and mentoring junior teammates`;

const selfDescription = `I am a full-stack software engineer with about three years of experience building web products. In my current role at BrightCart, I work across a React and TypeScript frontend and a Node.js and Express backend. I have contributed to inventory, order tracking, and account management features, and I am comfortable taking a feature from a product discussion through implementation, testing, and release.

One project I am proud of involved an inventory endpoint that was slow for stores with large catalogs. I looked at the query plan with EXPLAIN ANALYZE, found that a common filter was not using a useful index, and worked with a senior engineer to add an index and adjust the query. The p95 response time went from around 1.8 seconds to about 650 milliseconds. I learned to measure the problem first and check that a performance change helps the real use case.

On the frontend, I have built reusable React components and tried to make workflows clear for users, including accessible form labels and useful loading, empty, and error states. On the backend, I have built REST endpoints with validation, pagination, and consistent error handling. I have also written Jest and React Testing Library tests for important flows and participated in code reviews and sprint planning.

I work best in a team where engineers communicate early with product, design, and QA. When requirements are unclear, I like to write down the user scenario, identify edge cases, and confirm the expected behavior before I get too far into implementation. I try to keep pull requests focused and explain the reasoning behind changes so teammates can review them efficiently.

My strongest skills are React, TypeScript, JavaScript, Node.js, and building REST APIs. I use PostgreSQL regularly and have worked with MongoDB. I use Docker Compose for local development and have contributed to GitHub Actions checks. I have helped with AWS releases, but I have not yet owned cloud infrastructure, production monitoring, or a large-scale system design. Those are areas I want to develop further.

I am looking for a full-stack role where I can own meaningful features, contribute to a reliable SaaS product, and continue improving my backend, cloud, and system design skills. I would bring practical product engineering experience, a collaborative approach, and a willingness to learn from feedback.`;

const jobDescription = `Full-Stack Software Engineer

We are looking for an engineer with 3+ years of experience to build customer-facing features for a SaaS platform.

Responsibilities:
- Build accessible, responsive interfaces using React and TypeScript.
- Design and maintain APIs and services using Node.js.
- Work with PostgreSQL, Docker, and AWS-based deployments.
- Write tests, participate in code reviews, and collaborate across product and design.

Preferred: Experience with CI/CD, cloud monitoring, and scalable system design.`;

module.exports = { resume, selfDescription, jobDescription };
