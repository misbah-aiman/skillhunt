import "dotenv/config";
import { supabase } from "./lib/supabase.js";
import type { Difficulty, ResourceType } from "./lib/types.js";

interface TopicSeed {
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  prerequisites: string[];
  tags: string[];
}

// 75 topics across 8 categories. Prerequisites reference other topic
// titles in this list (free text, not a foreign key — see the Topic
// model's supabase/migrations file for why).
const topics: TopicSeed[] = [
  // Web Development
  {
    title: "HTML Fundamentals",
    description: "Learn the building blocks of every web page: elements, semantics, and document structure.",
    category: "Web Development",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["html", "markup", "fundamentals"],
  },
  {
    title: "CSS Fundamentals",
    description: "Style HTML with selectors, the box model, and basic layout techniques.",
    category: "Web Development",
    difficulty: "beginner",
    prerequisites: ["HTML Fundamentals"],
    tags: ["css", "styling", "fundamentals"],
  },
  {
    title: "CSS Flexbox & Grid",
    description: "Build responsive layouts using CSS Flexbox and Grid without relying on floats.",
    category: "Web Development",
    difficulty: "beginner",
    prerequisites: ["CSS Fundamentals"],
    tags: ["css", "layout", "responsive"],
  },
  {
    title: "JavaScript Fundamentals",
    description: "Learn variables, functions, control flow, and the basics of programming in JavaScript.",
    category: "Web Development",
    difficulty: "beginner",
    prerequisites: ["HTML Fundamentals"],
    tags: ["javascript", "fundamentals", "programming"],
  },
  {
    title: "Modern JavaScript (ES6+)",
    description: "Use arrow functions, destructuring, modules, and async/await to write modern JavaScript.",
    category: "Web Development",
    difficulty: "intermediate",
    prerequisites: ["JavaScript Fundamentals"],
    tags: ["javascript", "es6", "async"],
  },
  {
    title: "DOM Manipulation",
    description: "Select, update, and respond to events on the DOM to build interactive pages.",
    category: "Web Development",
    difficulty: "intermediate",
    prerequisites: ["JavaScript Fundamentals"],
    tags: ["javascript", "dom", "events"],
  },
  {
    title: "TypeScript Fundamentals",
    description: "Add static types to JavaScript to catch bugs before they hit production.",
    category: "Web Development",
    difficulty: "intermediate",
    prerequisites: ["Modern JavaScript (ES6+)"],
    tags: ["typescript", "types", "javascript"],
  },
  {
    title: "React Fundamentals",
    description: "Build component-based user interfaces with React, props, and state.",
    category: "Web Development",
    difficulty: "intermediate",
    prerequisites: ["Modern JavaScript (ES6+)", "DOM Manipulation"],
    tags: ["react", "components", "frontend"],
  },
  {
    title: "React State Management",
    description: "Manage complex application state in React with context, reducers, and external stores.",
    category: "Web Development",
    difficulty: "advanced",
    prerequisites: ["React Fundamentals"],
    tags: ["react", "state", "architecture"],
  },
  {
    title: "Node.js & Express",
    description: "Build server-side applications and APIs with Node.js and the Express framework.",
    category: "Web Development",
    difficulty: "intermediate",
    prerequisites: ["Modern JavaScript (ES6+)"],
    tags: ["node", "express", "backend"],
  },
  {
    title: "REST API Design",
    description: "Design predictable, well-structured HTTP APIs following REST conventions.",
    category: "Web Development",
    difficulty: "intermediate",
    prerequisites: ["Node.js & Express"],
    tags: ["api", "rest", "backend"],
  },
  {
    title: "Web Accessibility",
    description: "Make web applications usable for people relying on assistive technology.",
    category: "Web Development",
    difficulty: "intermediate",
    prerequisites: ["HTML Fundamentals"],
    tags: ["accessibility", "a11y", "ux"],
  },
  {
    title: "Web Performance Optimization",
    description: "Diagnose and fix slow page loads with profiling, caching, and bundling techniques.",
    category: "Web Development",
    difficulty: "advanced",
    prerequisites: ["React Fundamentals"],
    tags: ["performance", "optimization", "web"],
  },
  {
    title: "Progressive Web Apps",
    description: "Turn a web app into an installable, offline-capable experience with service workers.",
    category: "Web Development",
    difficulty: "advanced",
    prerequisites: ["Web Performance Optimization"],
    tags: ["pwa", "service-workers", "offline"],
  },

  // Data Science
  {
    title: "Python for Data Science",
    description: "Learn Python syntax and the libraries commonly used for data analysis.",
    category: "Data Science",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["python", "fundamentals", "data"],
  },
  {
    title: "Statistics Fundamentals",
    description: "Understand descriptive statistics, probability, and distributions used in data analysis.",
    category: "Data Science",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["statistics", "probability", "fundamentals"],
  },
  {
    title: "SQL for Data Analysis",
    description: "Query, filter, and aggregate relational data using SQL.",
    category: "Data Science",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["sql", "databases", "querying"],
  },
  {
    title: "Data Cleaning & Wrangling",
    description: "Handle missing values, duplicates, and messy formats to prepare data for analysis.",
    category: "Data Science",
    difficulty: "beginner",
    prerequisites: ["Python for Data Science"],
    tags: ["data-cleaning", "pandas", "etl"],
  },
  {
    title: "Pandas & NumPy",
    description: "Manipulate tabular and numerical data efficiently with Pandas and NumPy.",
    category: "Data Science",
    difficulty: "intermediate",
    prerequisites: ["Python for Data Science"],
    tags: ["pandas", "numpy", "python"],
  },
  {
    title: "Data Visualization",
    description: "Communicate insights clearly using charts built with Matplotlib and Seaborn.",
    category: "Data Science",
    difficulty: "intermediate",
    prerequisites: ["Pandas & NumPy"],
    tags: ["visualization", "matplotlib", "charts"],
  },
  {
    title: "Exploratory Data Analysis",
    description: "Summarize and visualize datasets to uncover patterns before modeling.",
    category: "Data Science",
    difficulty: "intermediate",
    prerequisites: ["Data Visualization", "Statistics Fundamentals"],
    tags: ["eda", "statistics", "analysis"],
  },
  {
    title: "Machine Learning Fundamentals",
    description: "Train and evaluate basic supervised and unsupervised models with scikit-learn.",
    category: "Data Science",
    difficulty: "intermediate",
    prerequisites: ["Exploratory Data Analysis"],
    tags: ["machine-learning", "scikit-learn", "modeling"],
  },
  {
    title: "Feature Engineering",
    description: "Transform raw data into features that improve model performance.",
    category: "Data Science",
    difficulty: "advanced",
    prerequisites: ["Machine Learning Fundamentals"],
    tags: ["feature-engineering", "machine-learning"],
  },
  {
    title: "A/B Testing & Experimentation",
    description: "Design and analyze controlled experiments to measure product changes.",
    category: "Data Science",
    difficulty: "advanced",
    prerequisites: ["Statistics Fundamentals"],
    tags: ["ab-testing", "statistics", "experimentation"],
  },
  {
    title: "Time Series Analysis",
    description: "Model and forecast data that changes over time, from trends to seasonality.",
    category: "Data Science",
    difficulty: "advanced",
    prerequisites: ["Machine Learning Fundamentals"],
    tags: ["time-series", "forecasting", "statistics"],
  },

  // Design
  {
    title: "Design Fundamentals",
    description: "Learn the core principles of visual design: balance, contrast, and hierarchy.",
    category: "Design",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["design", "fundamentals", "visual-design"],
  },
  {
    title: "Typography Basics",
    description: "Choose and pair typefaces, and use type to guide the reader's eye.",
    category: "Design",
    difficulty: "beginner",
    prerequisites: ["Design Fundamentals"],
    tags: ["typography", "design"],
  },
  {
    title: "Color Theory",
    description: "Use color relationships and palettes to create mood and hierarchy in a design.",
    category: "Design",
    difficulty: "beginner",
    prerequisites: ["Design Fundamentals"],
    tags: ["color", "design"],
  },
  {
    title: "Figma Essentials",
    description: "Create and organize design files, components, and prototypes in Figma.",
    category: "Design",
    difficulty: "beginner",
    prerequisites: ["Design Fundamentals"],
    tags: ["figma", "tools", "prototyping"],
  },
  {
    title: "UI Design Principles",
    description: "Design clear, consistent interfaces using layout, spacing, and visual hierarchy.",
    category: "Design",
    difficulty: "intermediate",
    prerequisites: ["Typography Basics", "Color Theory"],
    tags: ["ui", "interface-design"],
  },
  {
    title: "UX Research Methods",
    description: "Plan and run interviews, surveys, and usability tests to understand users.",
    category: "Design",
    difficulty: "intermediate",
    prerequisites: ["Design Fundamentals"],
    tags: ["ux", "research", "usability"],
  },
  {
    title: "Wireframing & Prototyping",
    description: "Sketch low-fidelity wireframes and build interactive prototypes.",
    category: "Design",
    difficulty: "intermediate",
    prerequisites: ["Figma Essentials"],
    tags: ["wireframing", "prototyping", "ux"],
  },
  {
    title: "Accessibility in Design",
    description: "Design with color contrast, focus states, and readable type for all users.",
    category: "Design",
    difficulty: "intermediate",
    prerequisites: ["UI Design Principles"],
    tags: ["accessibility", "design", "inclusive-design"],
  },
  {
    title: "Design Systems",
    description: "Build a reusable library of components, tokens, and guidelines for consistent design.",
    category: "Design",
    difficulty: "advanced",
    prerequisites: ["UI Design Principles"],
    tags: ["design-systems", "components"],
  },
  {
    title: "Interaction Design",
    description: "Design motion, transitions, and micro-interactions that feel responsive.",
    category: "Design",
    difficulty: "advanced",
    prerequisites: ["Wireframing & Prototyping"],
    tags: ["interaction-design", "motion", "ux"],
  },

  // Mobile Development
  {
    title: "Mobile Development Basics",
    description: "Understand the platforms, tools, and constraints of building mobile apps.",
    category: "Mobile Development",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["mobile", "fundamentals"],
  },
  {
    title: "Swift Fundamentals",
    description: "Learn Swift syntax and core language features for iOS development.",
    category: "Mobile Development",
    difficulty: "beginner",
    prerequisites: ["Mobile Development Basics"],
    tags: ["swift", "ios", "fundamentals"],
  },
  {
    title: "SwiftUI Essentials",
    description: "Build declarative iOS interfaces with SwiftUI views, state, and layout.",
    category: "Mobile Development",
    difficulty: "intermediate",
    prerequisites: ["Swift Fundamentals"],
    tags: ["swiftui", "ios"],
  },
  {
    title: "Kotlin Fundamentals",
    description: "Learn Kotlin syntax and core language features for Android development.",
    category: "Mobile Development",
    difficulty: "beginner",
    prerequisites: ["Mobile Development Basics"],
    tags: ["kotlin", "android", "fundamentals"],
  },
  {
    title: "Jetpack Compose",
    description: "Build declarative Android interfaces with Jetpack Compose.",
    category: "Mobile Development",
    difficulty: "intermediate",
    prerequisites: ["Kotlin Fundamentals"],
    tags: ["jetpack-compose", "android"],
  },
  {
    title: "React Native Fundamentals",
    description: "Build cross-platform mobile apps with React Native and JavaScript.",
    category: "Mobile Development",
    difficulty: "intermediate",
    prerequisites: ["Mobile Development Basics"],
    tags: ["react-native", "mobile", "javascript"],
  },
  {
    title: "Mobile App Architecture",
    description: "Structure mobile codebases for testability, navigation, and state management.",
    category: "Mobile Development",
    difficulty: "advanced",
    prerequisites: ["SwiftUI Essentials", "Jetpack Compose"],
    tags: ["architecture", "mobile"],
  },
  {
    title: "App Store Deployment",
    description: "Prepare, sign, and submit mobile apps to the App Store and Play Store.",
    category: "Mobile Development",
    difficulty: "intermediate",
    prerequisites: ["Mobile Development Basics"],
    tags: ["deployment", "app-store", "play-store"],
  },

  // Machine Learning & AI
  {
    title: "Prompt Engineering",
    description: "Write effective prompts to get reliable results from large language models.",
    category: "Machine Learning & AI",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["llm", "prompting", "ai"],
  },
  {
    title: "Linear Algebra for ML",
    description: "Learn the vectors, matrices, and operations that underpin machine learning models.",
    category: "Machine Learning & AI",
    difficulty: "intermediate",
    prerequisites: [],
    tags: ["linear-algebra", "math", "ml"],
  },
  {
    title: "Neural Networks Fundamentals",
    description: "Understand how neurons, layers, and backpropagation combine to train models.",
    category: "Machine Learning & AI",
    difficulty: "intermediate",
    prerequisites: ["Linear Algebra for ML"],
    tags: ["neural-networks", "deep-learning"],
  },
  {
    title: "Deep Learning with PyTorch",
    description: "Build and train deep learning models using PyTorch's tensors and autograd.",
    category: "Machine Learning & AI",
    difficulty: "advanced",
    prerequisites: ["Neural Networks Fundamentals"],
    tags: ["pytorch", "deep-learning"],
  },
  {
    title: "Natural Language Processing",
    description: "Process and model text data, from tokenization to transformer architectures.",
    category: "Machine Learning & AI",
    difficulty: "advanced",
    prerequisites: ["Deep Learning with PyTorch"],
    tags: ["nlp", "transformers", "text"],
  },
  {
    title: "Computer Vision Basics",
    description: "Classify and detect objects in images using convolutional neural networks.",
    category: "Machine Learning & AI",
    difficulty: "advanced",
    prerequisites: ["Deep Learning with PyTorch"],
    tags: ["computer-vision", "cnn"],
  },
  {
    title: "Model Evaluation & Tuning",
    description: "Measure model performance and tune hyperparameters to improve results.",
    category: "Machine Learning & AI",
    difficulty: "intermediate",
    prerequisites: ["Neural Networks Fundamentals"],
    tags: ["evaluation", "hyperparameters", "ml"],
  },
  {
    title: "MLOps Fundamentals",
    description: "Package, deploy, and monitor machine learning models in production.",
    category: "Machine Learning & AI",
    difficulty: "advanced",
    prerequisites: ["Model Evaluation & Tuning"],
    tags: ["mlops", "deployment", "ml"],
  },
  {
    title: "Reinforcement Learning Basics",
    description: "Train agents to make decisions through reward-driven trial and error.",
    category: "Machine Learning & AI",
    difficulty: "advanced",
    prerequisites: ["Neural Networks Fundamentals"],
    tags: ["reinforcement-learning", "ai"],
  },

  // DevOps & Cloud
  {
    title: "Linux Command Line Basics",
    description: "Navigate the filesystem, manage processes, and script basic tasks in the shell.",
    category: "DevOps & Cloud",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["linux", "cli", "fundamentals"],
  },
  {
    title: "Git & Version Control",
    description: "Track changes, branch, and collaborate on code using Git.",
    category: "DevOps & Cloud",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["git", "version-control"],
  },
  {
    title: "Docker Fundamentals",
    description: "Package applications into containers with Docker images and volumes.",
    category: "DevOps & Cloud",
    difficulty: "intermediate",
    prerequisites: ["Linux Command Line Basics"],
    tags: ["docker", "containers"],
  },
  {
    title: "AWS Fundamentals",
    description: "Learn the core AWS services for compute, storage, and networking.",
    category: "DevOps & Cloud",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["aws", "cloud", "fundamentals"],
  },
  {
    title: "CI/CD Pipelines",
    description: "Automate testing and deployment with continuous integration and delivery pipelines.",
    category: "DevOps & Cloud",
    difficulty: "intermediate",
    prerequisites: ["Git & Version Control"],
    tags: ["ci-cd", "automation", "devops"],
  },
  {
    title: "Kubernetes Basics",
    description: "Deploy and scale containerized applications with Kubernetes pods and services.",
    category: "DevOps & Cloud",
    difficulty: "advanced",
    prerequisites: ["Docker Fundamentals"],
    tags: ["kubernetes", "containers", "orchestration"],
  },
  {
    title: "Infrastructure as Code",
    description: "Define and provision cloud infrastructure declaratively with tools like Terraform.",
    category: "DevOps & Cloud",
    difficulty: "advanced",
    prerequisites: ["AWS Fundamentals"],
    tags: ["iac", "terraform", "cloud"],
  },
  {
    title: "Monitoring & Observability",
    description: "Track metrics, logs, and traces to understand system health in production.",
    category: "DevOps & Cloud",
    difficulty: "advanced",
    prerequisites: ["CI/CD Pipelines"],
    tags: ["monitoring", "observability", "devops"],
  },
  {
    title: "Cloud Security Basics",
    description: "Apply identity, network, and data protection best practices in the cloud.",
    category: "DevOps & Cloud",
    difficulty: "intermediate",
    prerequisites: ["AWS Fundamentals"],
    tags: ["cloud", "security"],
  },

  // Cybersecurity
  {
    title: "Cybersecurity Fundamentals",
    description: "Understand common threats, attack types, and core security principles.",
    category: "Cybersecurity",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["security", "fundamentals"],
  },
  {
    title: "Network Security Basics",
    description: "Secure networks against common attacks using firewalls, VPNs, and segmentation.",
    category: "Cybersecurity",
    difficulty: "intermediate",
    prerequisites: ["Cybersecurity Fundamentals"],
    tags: ["network-security", "security"],
  },
  {
    title: "Web Application Security",
    description: "Identify and prevent common web vulnerabilities like XSS and SQL injection.",
    category: "Cybersecurity",
    difficulty: "intermediate",
    prerequisites: ["Cybersecurity Fundamentals"],
    tags: ["web-security", "owasp"],
  },
  {
    title: "Identity & Access Management",
    description: "Control who can access what using authentication and authorization patterns.",
    category: "Cybersecurity",
    difficulty: "intermediate",
    prerequisites: ["Cybersecurity Fundamentals"],
    tags: ["iam", "authentication", "security"],
  },
  {
    title: "Ethical Hacking Fundamentals",
    description: "Learn penetration testing methodology to find vulnerabilities legally and safely.",
    category: "Cybersecurity",
    difficulty: "intermediate",
    prerequisites: ["Network Security Basics", "Web Application Security"],
    tags: ["pentesting", "ethical-hacking"],
  },
  {
    title: "Cryptography Basics",
    description: "Understand encryption, hashing, and the math that secures modern systems.",
    category: "Cybersecurity",
    difficulty: "advanced",
    prerequisites: ["Cybersecurity Fundamentals"],
    tags: ["cryptography", "security"],
  },
  {
    title: "Security Auditing",
    description: "Assess systems and processes against security standards and compliance frameworks.",
    category: "Cybersecurity",
    difficulty: "advanced",
    prerequisites: ["Ethical Hacking Fundamentals"],
    tags: ["auditing", "compliance", "security"],
  },

  // Product & Business
  {
    title: "Product Management Fundamentals",
    description: "Learn the core responsibilities of a product manager, from discovery to delivery.",
    category: "Product & Business",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["product-management", "fundamentals"],
  },
  {
    title: "Agile & Scrum Basics",
    description: "Run sprints, stand-ups, and retrospectives using the Scrum framework.",
    category: "Product & Business",
    difficulty: "beginner",
    prerequisites: [],
    tags: ["agile", "scrum"],
  },
  {
    title: "User Story Writing",
    description: "Write clear, testable user stories that capture what and why, not how.",
    category: "Product & Business",
    difficulty: "beginner",
    prerequisites: ["Agile & Scrum Basics"],
    tags: ["user-stories", "agile"],
  },
  {
    title: "Roadmapping & Prioritization",
    description: "Sequence product work using frameworks like RICE and now-next-later roadmaps.",
    category: "Product & Business",
    difficulty: "intermediate",
    prerequisites: ["Product Management Fundamentals"],
    tags: ["roadmapping", "prioritization"],
  },
  {
    title: "Product Analytics",
    description: "Define metrics and analyze usage data to understand product performance.",
    category: "Product & Business",
    difficulty: "intermediate",
    prerequisites: ["Product Management Fundamentals"],
    tags: ["analytics", "metrics", "product"],
  },
  {
    title: "Stakeholder Management",
    description: "Align cross-functional stakeholders and communicate decisions effectively.",
    category: "Product & Business",
    difficulty: "intermediate",
    prerequisites: ["Product Management Fundamentals"],
    tags: ["stakeholders", "communication"],
  },
  {
    title: "Go-to-Market Strategy",
    description: "Plan positioning, pricing, and launch activities for a new product.",
    category: "Product & Business",
    difficulty: "advanced",
    prerequisites: ["Roadmapping & Prioritization"],
    tags: ["gtm", "strategy", "marketing"],
  },
];

interface ResourceSeed {
  title: string;
  url: string;
  type: ResourceType;
  provider: string;
}

const articleProviders: { name: string; url: (q: string) => string }[] = [
  { name: "Medium", url: (q) => `https://medium.com/search?q=${q}` },
  { name: "freeCodeCamp", url: (q) => `https://www.freecodecamp.org/news/search/?query=${q}` },
];

const courseProviders: { name: string; url: (q: string) => string }[] = [
  { name: "Coursera", url: (q) => `https://www.coursera.org/search?query=${q}` },
  { name: "Udemy", url: (q) => `https://www.udemy.com/courses/search/?q=${q}` },
  { name: "Codecademy", url: (q) => `https://www.codecademy.com/search?query=${q}` },
  { name: "Pluralsight", url: (q) => `https://www.pluralsight.com/search?q=${q}` },
  { name: "edX", url: (q) => `https://www.edx.org/search?q=${q}` },
];

// Every resource points at a real search page on its provider (rather
// than a specific, unverifiable article/video URL) so the seeded links
// actually resolve to something relevant.
function buildResources(title: string, index: number): ResourceSeed[] {
  const q = encodeURIComponent(title);
  const article = articleProviders[index % articleProviders.length];
  const course = courseProviders[index % courseProviders.length];

  return [
    {
      title: `${title} — Video Walkthrough`,
      url: `https://www.youtube.com/results?search_query=${q}`,
      type: "video",
      provider: "YouTube",
    },
    {
      title: `${title}: Guide`,
      url: article.url(q),
      type: "article",
      provider: article.name,
    },
    {
      title: `${title} Course`,
      url: course.url(q),
      type: "course",
      provider: course.name,
    },
  ];
}

async function seed() {
  console.log(`Seeding ${topics.length} topics...`);

  const topicRows = topics.map((t) => ({
    title: t.title,
    description: t.description,
    category: t.category,
    difficulty: t.difficulty,
    prerequisites: t.prerequisites,
    tags: t.tags,
  }));

  const { data: insertedTopics, error: topicsError } = await supabase
    .from("topics")
    .upsert(topicRows, { onConflict: "title" })
    .select("id, title");

  if (topicsError || !insertedTopics) {
    console.error("Failed to seed topics:", topicsError?.message);
    process.exit(1);
  }

  console.log(`Seeded ${insertedTopics.length} topics.`);

  const topicIdByTitle = new Map<string, string>(
    insertedTopics.map((t: { id: string; title: string }) => [t.title, t.id]),
  );

  const resourceRows = topics.flatMap((topic, index) => {
    const topicId = topicIdByTitle.get(topic.title);
    if (!topicId) return [];

    return buildResources(topic.title, index).map((r) => ({
      topic_id: topicId,
      title: r.title,
      url: r.url,
      type: r.type,
      provider: r.provider,
    }));
  });

  console.log(`Seeding ${resourceRows.length} resources...`);

  const { error: resourcesError } = await supabase
    .from("resources")
    .upsert(resourceRows, { onConflict: "topic_id,url" });

  if (resourcesError) {
    console.error("Failed to seed resources:", resourcesError.message);
    process.exit(1);
  }

  console.log("Done.");
}

seed();
