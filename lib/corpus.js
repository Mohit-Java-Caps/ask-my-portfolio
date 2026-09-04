// Knowledge base for the "Ask My Portfolio" RAG chatbot.
// Every chunk here is either lifted verbatim from Mohit's resume-verified
// portfolio content, or was supplied directly by Mohit for recruiter
// logistics questions. Nothing is invented. The bot answers in third person.

export const corpus = [
  {
    id: "identity",
    category: "Identity",
    text: "Mohit Kumar is a Java Full-Stack Engineer with 3+ years of experience, currently an Associate — Full-Stack Engineer at Cognizant, based in India and open to relocation. He specialises in cloud-native microservices, event-driven data pipelines and Gen-AI integration.",
  },
  {
    id: "current-role",
    category: "Current role",
    text: "Mohit currently works at Cognizant on the NextEra Energy (Florida Power & Light), USA account, in the Energy & Utilities domain. He builds cloud-native microservices on Java 17 and Spring Boot 3.x, and event-driven pipelines on AWS. He is comfortable end-to-end: Angular on the frontend, PostgreSQL/MongoDB on the backend, Apache Spark and Kafka in between.",
  },
  {
    id: "stack-backend",
    category: "Tech stack",
    text: "Backend stack: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA, Hibernate, REST APIs, JWT/OAuth 2.0. This is the load-bearing layer for his work — APIs, business logic, authentication and authorization.",
  },
  {
    id: "stack-data",
    category: "Tech stack",
    text: "Data engineering stack: Apache Spark for batch processing, event-driven architecture, AWS SNS and SQS as message queues. Used for turning high-volume raw files into queryable, trustworthy data on a fixed time budget.",
  },
  {
    id: "stack-distributed",
    category: "Tech stack",
    text: "Distributed systems stack: Microservices, Spring Cloud, API Gateway, Circuit Breaker, Saga orchestration, Retry/Resilience patterns. Used to keep independently-deployed services correct when part of the system is slow or down.",
  },
  {
    id: "stack-cloud",
    category: "Tech stack",
    text: "Cloud/AWS stack: EC2, ECS, S3, Lambda, RDS, SNS, SQS. Used to run and scale systems without owning hardware or managing capacity manually.",
  },
  {
    id: "stack-db",
    category: "Tech stack",
    text: "Database stack: PostgreSQL, MySQL, MongoDB, Redis — with a focus on indexing strategy and query performance tuning.",
  },
  {
    id: "stack-ai",
    category: "Tech stack",
    text: "AI/GenAI stack (currently upskilling): AWS Bedrock, RAG, vector databases, embeddings, prompt engineering, MLflow, Databricks. This is being added on top of his backend foundation, not replacing it.",
  },
  {
    id: "case-energy-pipeline",
    category: "Case study",
    text: "Flagship project: Energy Data Pipeline for NextEra Energy (Florida Power & Light), USA. Problem: solar-inverter telemetry arrives as a high volume of files every day and needs to be ingested, transformed and made queryable reliably, without manual reprocessing when something fails partway through. Architecture: S3 for raw file storage, SNS to fan out new-object events, Apache Spark for batch transformation, PostgreSQL/RDS for persistence, SQS to decouple downstream consumers, and a Spring Boot REST API to expose the data. Implementation: Java 17 and Spring Boot 3.x microservices with Factory/Builder patterns on ingestion, Hibernate/JPA with tuned indexing and connection pooling on persistence, ECS for orchestration. Results: 25% query performance gain, 15% AWS cost reduction, 8,300+ files processed per day (35 columns by 1,440 records each), end-to-end batch completion in under 75 minutes.",
  },
  {
    id: "case-energy-decisions",
    category: "Case study",
    text: "Why the Energy Data Pipeline is event-driven: polling S3 for 8,300+ files a day doesn't scale and adds latency, so SNS to SQS means each stage reacts only when there is real work. Why Spark for the batch step: distributing the transform across a cluster keeps a 75-minute SLA achievable as file volume grows. Why tune indexing and connection pooling instead of just scaling RDS: the bottleneck was query shape, not hardware, so indexing and pooling recovered 25% without paying for a bigger instance.",
  },
  {
    id: "case-url-shortener",
    category: "Case study",
    text: "Personal project: URL Shortener Platform. Problem: build a multi-tenant URL shortener with real authorization, not just a redirect table behind an API key. Implementation: Spring Boot 3.x, MVC layered architecture, SOLID principles, a Factory pattern for the URL-encoding strategy (so it stays swappable), JWT plus OAuth 2.0 authentication with role-based access control via Spring Security, documented with Swagger/OpenAPI. Result: sub-50ms API response time after query optimisation. Stack: Java 17, Spring Boot 3.x, Spring Security, JPA/Hibernate, PostgreSQL, Maven.",
  },
  {
    id: "case-calorie-tracker",
    category: "Case study",
    text: "Personal project: AI-Based Calorie Tracker. Problem: manual meal-logging is tedious enough that most people abandon calorie tracking within days. Implementation: Angular frontend, Spring Boot backend, MongoDB, integrating Generative AI/LLM APIs for automated food detection and structured nutrition extraction from a natural-language meal description, with event-driven updates powering a live calorie dashboard. Result: 90%+ food-detection accuracy. This is Mohit's concrete shipped Gen-AI project.",
  },
  {
    id: "case-jvm-internals",
    category: "Case study",
    text: "Personal project: JVM Internals & Microservices Architecture Patterns. Problem: pattern names like Circuit Breaker and Saga are easy to recite and easy to misapply without understanding the failure mode they exist to survive. Implementation: production-grade microservices patterns implemented directly — API Gateway, Circuit Breaker, Saga orchestration, Retry/Resilience — built on Spring Cloud. Stack: Java 17, Spring Cloud, System Design, Distributed Systems.",
  },
  {
    id: "mindset",
    category: "Engineering mindset",
    text: "Mohit's engineering principles: measure before optimizing (the 25% query-performance gain came from profiling and indexing, not guesswork); design for failure (SNS to SQS decoupling, Circuit Breaker and Retry patterns); observability belongs in the architecture (the 15% AWS cost reduction came from being able to see where time and money were going); choose the right abstraction, not the cleverest one (the Factory pattern exists to make one thing swappable, nothing more); AI should solve a problem, not decorate a product; performance is a system property, not one component's job.",
  },
  {
    id: "journey",
    category: "Career journey",
    text: "Career timeline: Java Full-Stack Engineer Trainee at Cognizant, Pune, India (Feb 2023) — built Spring Boot 3.x microservices with an Angular frontend, automated CI/CD with Jenkins and GitHub Actions, cut deployment time by 30% with JUnit 5/Mockito TDD. Promoted to Associate, Full-Stack Engineer at Cognizant, Kolkata, India (Sep 2023) based on delivery, moving onto the NextEra Energy account. Since Sep 2023: event-driven AWS pipeline work, Apache Spark batch processing, PostgreSQL/RDS tuning. In Jul 2026, received the Cognizant 'Raising the Bar' Award for AI Excellence & Continuous Learning, manager-nominated for the Databricks GenAI, Claude Architect Foundation and Agentic AI certifications.",
  },
  {
    id: "problem-solving",
    category: "Problem solving",
    text: "Mohit has solved 800+ DSA problems on LeetCode (4-star rating) and holds GeeksforGeeks Rank #3 out of 2000+. Strong areas: Arrays, Strings, Trees, Graphs, Dynamic Programming, System Design, Java, SQL.",
  },
  {
    id: "certifications",
    category: "Certifications",
    text: "Mohit's certifications: AWS Cloud Practitioner, AWS AI Practitioner, Databricks GenAI Engineer Associate, GitHub Copilot Certified, Claude Certified Architect Foundation (Anthropic). He also holds a Java Full Stack Certification from Cognizant and a SQL Certification from Great Learning.",
  },
  {
    id: "award",
    category: "Awards",
    text: "Mohit received the Cognizant 'Raising the Bar' Award for AI Excellence & Continuous Learning in July 2026. He was manager-nominated for his Databricks GenAI, Claude Architect Foundation and Agentic AI certifications, and recognised for proactive upskilling and delivering impactful AI solutions.",
  },
  {
    id: "logistics-compensation",
    category: "Recruiter logistics",
    text: "Compensation expectations: for product-based or startup companies, Mohit is targeting roughly 12 to 15 LPA. For service-based companies, roughly 9.5 to 13 LPA. He is currently at around 6.84 LPA, so he is primarily looking for a meaningful growth opportunity rather than a small hike. Exact numbers are negotiable depending on role scope and company.",
  },
  {
    id: "logistics-notice",
    category: "Recruiter logistics",
    text: "Notice period: 60 days at his current employer, Cognizant. This is negotiable if the new company can offer a buyout or early-release option.",
  },
  {
    id: "logistics-work-mode",
    category: "Recruiter logistics",
    text: "Work preference: Mohit is open to remote, hybrid and onsite arrangements. Preferred locations are Bangalore, Pune, Hyderabad, Kolkata and Noida, but he is flexible if the opportunity is strong.",
  },
  {
    id: "logistics-employment-type",
    category: "Recruiter logistics",
    text: "Employment type: Mohit prefers full-time, permanent roles. He is open to contract roles only if the contract is for at least 1 year and the opportunity is technically strong.",
  },
  {
    id: "logistics-target-roles",
    category: "Recruiter logistics",
    text: "Target roles: Senior Java Developer, Java Backend Engineer, Software Engineer, Java/Spring Boot Developer, Technical Consultant, Backend/Microservices Engineer. He is targeting roles working with Java, Spring Boot, Microservices, AWS, distributed systems, SQL, Kafka and AI/GenAI technologies.",
  },
  {
    id: "why-moving",
    category: "Recruiter logistics",
    text: "Why Mohit is looking to move: he wants a role with stronger engineering ownership, larger-scale backend systems, cloud-native architecture and more challenging distributed-systems problems. He also wants to combine his Java/AWS backend experience with GenAI and modern AI-assisted engineering. His goal is to grow from his current role into a strong backend/software engineer who can own systems end-to-end, rather than working on individual components.",
  },
  {
    id: "contact",
    category: "Contact",
    text: "Mohit can be reached at mohitlogin72@gmail.com, on LinkedIn at linkedin.com/in/mohit-kumar-dev, or on GitHub at github.com/Mohit-Java-Caps. His full portfolio is at mohit-java-caps.github.io/mohit-portfolio.",
  },
];
