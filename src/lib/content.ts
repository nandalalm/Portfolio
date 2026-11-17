export type Layer = { name: string; detail: string };

export type Project = {
  id: string;
  kind: string;
  title: string;
  description: string;
  /** One-line technical highlight */
  highlight: string;
  tags: string[];
  /** Brand colour, used to tint the project's visuals */
  color: string;
  /** Request path, shown as the architecture in dev mode */
  architecture: string[];
  stats?: { value: string; label: string }[];
  links?: { label: string; href: string }[];
  featured?: boolean;
  /** Looping screen recordings in /public (for example "/videos/edusolve.mp4"). A drawn stand-in plays until these are set. */
  video?: string;
  videoPhone?: string;
  caseStudy: {
    summary: string;
    role: string;
    built: string[];
    hard: { title: string; text: string }[];
    /** Top to bottom: what a request passes through */
    layers: Layer[];
  };
};

export const site = {
  name: "Nandalal M",
  shortName: "Nandalal",
  domainLabel: "nandalal.dev",
  role: "Full-stack developer: web, mobile and AI.",
  statement:
    "I build web and mobile products that work hard and feel effortless, from the database to the Play Store.",
  email: "nandalalm1729@gmail.com",
  links: [
    { label: "GitHub", href: "https://github.com/nandalalm" },
    { label: "LinkedIn", href: "https://linkedin.com/in/nandalalm" },
  ],
  /** Set to a path in /public (for example "/resume.pdf") to show the button */
  resumeUrl: null as string | null,
};

export const projects: Project[] = [
  {
    id: "edusolve",
    featured: true,
    kind: "Client · web + mobile",
    title: "EduSolve",
    description:
      "A marketing site and a full-stack learning app for an online tuition company serving Gulf families.",
    highlight:
      "Every rule that matters runs on the server: Row Level Security, grading in SQL functions, signed-URL storage.",
    tags: ["Next.js", "React Native", "Expo", "Supabase", "PostgreSQL", "TypeScript"],
    color: "#e24b4a",
    architecture: [
      "Expo app",
      "Supabase Auth",
      "Postgres + RLS",
      "SQL / Edge functions",
      "Signed storage",
    ],
    stats: [
      { value: "4.6★", label: "Google Play rating" },
      { value: "500+", label: "downloads" },
    ],
    links: [{ label: "Live site", href: "https://edusolvelearn.com/" }],
    caseStudy: {
      summary:
        "EduSolve teaches children of Gulf families one-on-one, online, and runs two learning centres in Kozhikode. They needed a site that turns visiting parents into demo-class bookings, and an app students can learn from between classes.",
      role: "Website and mobile app, end to end",
      built: [
        "A static marketing site in Next.js: fast, cheap to host and nothing to maintain. Demo bookings reach staff through EmailJS, and Meta Pixel tracks the tutor-recruitment ads.",
        "A learning app in React Native with Expo, one codebase for Android and iPhone: recorded lessons, study notes, a question bank and chat with experts.",
        "A notes editor and reader that handles formulas, tables and photos, built with Tiptap and KaTeX inside a WebView.",
        "A Supabase backend: PostgreSQL, Auth, Storage, Realtime and Edge Functions, with emails sent through Resend.",
      ],
      hard: [
        {
          title: "Rules live on the server",
          text: "Grading, progress and access checks run as SQL functions, and Row Level Security limits each role to its own data. Nothing important depends on the app being honest.",
        },
        {
          title: "Secrets stay off the phone",
          text: "Creating accounts, email codes and password changes run in Edge Functions, using a key that never ships inside the app.",
        },
        {
          title: "Private files stay private",
          text: "Question images and note photos sit in private buckets and open only through short-lived signed links.",
        },
        {
          title: "Two people, one note",
          text: "A Realtime banner warns staff when someone else is already editing the same content.",
        },
      ],
      layers: [
        { name: "Expo app", detail: "React Native, Expo Router, NativeWind, TanStack Query" },
        { name: "Supabase Auth", detail: "Username sign-in, sessions, sign out everywhere" },
        { name: "Postgres + RLS", detail: "All data; each role sees only what it is allowed to" },
        { name: "SQL and Edge functions", detail: "Grading, progress, access checks, account creation" },
        { name: "Storage", detail: "Private buckets, short-lived signed links" },
      ],
    },
  },
  {
    id: "fixeify",
    kind: "Full-stack · booking platform",
    title: "Fixeify",
    description:
      "A handyman booking platform with three roles, location-based provider discovery and real-time chat.",
    highlight:
      "Redis and BullMQ release held slots automatically; Stripe webhooks confirm bookings.",
    tags: ["MERN", "TypeScript", "Redis", "BullMQ", "Stripe", "Socket.IO", "Docker"],
    color: "#1d9e75",
    architecture: ["React", "Express", "Redis / BullMQ", "MongoDB", "Stripe webhook", "Socket.IO"],
    caseStudy: {
      summary:
        "Fixeify lets customers find a nearby handyman, book a time slot and pay online, while providers manage their availability and admins oversee the platform.",
      role: "Solo full-stack build",
      built: [
        "Three user levels (user, provider and admin) with role-based access, JWT authentication and OTP verification.",
        "Booking slot management, with the Google Maps API for finding providers by location and choosing service areas.",
        "Stripe payments, with webhook listeners that validate payment events and confirm bookings.",
        "Real-time notifications and in-app chat over Socket.IO.",
        "Production deployment with Docker, CI/CD pipelines and a Google Cloud VM behind an Nginx reverse proxy.",
      ],
      hard: [
        {
          title: "Slots that never get stuck",
          text: "Redis and BullMQ run background jobs that release held slots and clean up stale bookings, so an abandoned checkout never blocks a provider's calendar.",
        },
        {
          title: "Payments you can trust",
          text: "A booking is confirmed only when Stripe's webhook says the payment happened, not when the browser says so.",
        },
        {
          title: "A codebase that stays tidy",
          text: "TypeScript throughout, SOLID principles, DTO mapping and a repository layer keep the business logic separate from the database.",
        },
      ],
      layers: [
        { name: "React client", detail: "Redux Toolkit, Tailwind, Google Maps" },
        { name: "Express API", detail: "JWT, role-based access, DTO mapping" },
        { name: "Redis + BullMQ", detail: "Held slots, release and cleanup jobs" },
        { name: "MongoDB", detail: "Behind a repository layer" },
        { name: "Stripe + Socket.IO", detail: "Payment webhooks, live chat and notifications" },
      ],
    },
  },
  {
    id: "subtlety",
    kind: "Full-stack · e-commerce",
    title: "Subtlety",
    description:
      "An anime merchandise store with a wallet, referrals and a flexible checkout.",
    highlight:
      "A coupon and offer engine with conditional, category-specific discounts.",
    tags: ["Node.js", "Express", "MongoDB", "EJS", "Razorpay", "Cloudinary"],
    color: "#d4537e",
    architecture: ["EJS", "Express", "MongoDB", "Razorpay", "Cloudinary"],
    caseStudy: {
      summary:
        "Subtlety is a full e-commerce store for anime merchandise: a paginated catalogue, a cart and checkout, a wallet, and the admin tools behind them.",
      role: "Solo full-stack build",
      built: [
        "A product catalogue that scales, with efficient pagination.",
        "Sign-in with OTP email verification and Google OAuth 2.0 through Passport.js.",
        "A Refer and Earn system that pays wallet credits for successful referrals.",
        "Secure image uploads through Cloudinary.",
        "Checkout with Razorpay, cash on delivery or wallet balance.",
        "Deployment on a Google Cloud VM behind an Nginx reverse proxy.",
      ],
      hard: [
        {
          title: "Discounts with conditions",
          text: "The coupon and offer engine supports conditional, category-specific and promotional discounts, all resolved at checkout.",
        },
        {
          title: "Returning one item out of many",
          text: "Customers can return or cancel a single product inside a multi-item order, without touching the rest of it.",
        },
        {
          title: "Three ways to pay",
          text: "Razorpay, cash on delivery and wallet payments share one checkout flow.",
        },
      ],
      layers: [
        { name: "EJS views", detail: "Server-rendered storefront and admin" },
        { name: "Express", detail: "Passport.js, OTP email, Google OAuth 2.0" },
        { name: "Offer and order engine", detail: "Coupons, wallet, per-item returns" },
        { name: "MongoDB", detail: "Catalogue, orders, wallets" },
        { name: "Razorpay + Cloudinary", detail: "Payments and image storage" },
      ],
    },
  },
  {
    id: "sortmytickets",
    kind: "AI · support triage",
    title: "SortMyTickets",
    description:
      "Classifies support tickets, sets priority and drafts multilingual replies using RAG over help articles.",
    highlight:
      "PII masking before every AI call, prompt-injection handling, 87 unit tests and a live eval suite.",
    tags: ["Next.js", "TypeScript", "Gemini API", "RAG", "GitHub Actions"],
    color: "#ef9f27",
    architecture: ["Next.js", "PII mask", "Gemini + RAG", "Human review rule", "Eval suite"],
    caseStudy: {
      summary:
        "SortMyTickets reads an incoming support ticket, works out what it is about and how urgent it is, and drafts a reply grounded in the help articles, in the customer's language.",
      role: "Solo build",
      built: [
        "Ticket classification and priority setting with the Gemini API.",
        "Multilingual draft replies using RAG: embeddings over the help articles, so answers come from real documentation.",
        "A Next.js and TypeScript app around it.",
        "87 unit tests, a live eval suite and GitHub Actions CI.",
      ],
      hard: [
        {
          title: "Private data stays private",
          text: "Personal information is masked before any text is sent to the model.",
        },
        {
          title: "A human in the loop",
          text: "A rule written in code, not left to the model, decides which tickets must go to a person for review.",
        },
        {
          title: "Hostile input",
          text: "Tickets are untrusted text, so the app handles prompt-injection attempts instead of obeying them.",
        },
        {
          title: "Proof it works",
          text: "A live eval suite measures the model's answers, alongside 87 unit tests running in CI.",
        },
      ],
      layers: [
        { name: "Next.js app", detail: "Ticket inbox and review screens" },
        { name: "PII masking", detail: "Runs before every AI call" },
        { name: "Retrieval", detail: "Embeddings over help articles" },
        { name: "Gemini", detail: "Classify, prioritise, draft the reply" },
        { name: "Review rule + evals", detail: "Human review, eval suite, CI" },
      ],
    },
  },
  {
    id: "rubiks-master",
    kind: "Web · computer vision",
    title: "Rubik's Master",
    description:
      "Scan a cube with your camera and get an optimal, step-by-step solution.",
    highlight: "Real-time HSV colour detection feeding the Kociemba algorithm.",
    tags: ["Next.js", "TypeScript", "HSV detection", "Kociemba"],
    color: "#378add",
    architecture: ["Camera", "HSV detection", "Cube validation", "Kociemba solver", "Step player"],
    caseStudy: {
      summary:
        "Rubik's Master solves a real cube. Point your camera at each face, fix any colour it misread, and follow the moves one at a time.",
      role: "Solo build",
      built: [
        "Real-time camera scanning of each face, with HSV colour detection.",
        "A manual 2D editor for correcting or entering a cube by hand.",
        "Validation that the scanned cube is a possible one.",
        "The Kociemba algorithm for an optimal solution, shown as step-by-step instructions.",
        "A responsive interface in Next.js and TypeScript.",
      ],
      hard: [
        {
          title: "Colours under real light",
          text: "Stickers look different in every room, so detection works in HSV colour space rather than on raw RGB values.",
        },
        {
          title: "Impossible cubes",
          text: "A single misread sticker makes a cube unsolvable. The cube state is validated before the solver ever runs.",
        },
        {
          title: "The shortest way out",
          text: "Kociemba's two-phase algorithm finds a short solution fast enough to feel instant.",
        },
      ],
      layers: [
        { name: "Camera feed", detail: "Live video from the browser" },
        { name: "HSV detection", detail: "Reads the nine stickers on a face" },
        { name: "Editor + validation", detail: "Fix mistakes, reject impossible cubes" },
        { name: "Kociemba solver", detail: "Two-phase optimal solution" },
        { name: "Step player", detail: "One move at a time" },
      ],
    },
  },
];

export const stack = [
  { group: "Interfaces", items: ["React", "Next.js", "React Native", "Expo", "Redux Toolkit", "Tailwind CSS"] },
  { group: "Systems", items: ["Node.js", "Express", "Supabase", "PostgreSQL", "MongoDB", "Redis", "Socket.IO"] },
  { group: "Shipping", items: ["Docker", "AWS (EC2, S3)", "Google Cloud", "GitHub Actions", "Nginx", "EAS"] },
  { group: "AI", items: ["Gemini API", "RAG", "Embeddings", "Evals"] },
];

export const journey = [
  { when: "2020–23", title: "BSc Botany", text: "Studied how complex living systems work." },
  { when: "2024–26", title: "Brototype, MERN stack", text: "Switched to building software systems, full time." },
  { when: "Client", title: "EduSolve, web and app", text: "First client. A marketing site and a learning app, live on Google Play." },
  { when: "Shipped", title: "Fixeify and Subtlety", text: "Two full-stack apps running in production on Google Cloud." },
  { when: "Now", title: "Web, mobile and AI", text: "Open to roles and freelance work." },
];

/**
 * Leave as null until there is a real quote, approved by the person quoted.
 * The Testimonial section renders nothing while this is null.
 */
export const testimonial = null as null | {
  quote: string;
  name: string;
  title: string;
};

export const about = {
  /** Path in /public (for example "/me.jpg"); initials are shown until it is set */
  photo: null as string | null,
  paragraphs: [
    "I'm Nandalal, a full-stack developer from Kerala, India. I studied botany before I wrote my first line of code, and I still think in systems: how the parts depend on each other, and what happens under load.",
    "I like work where the interface feels effortless and the hard rules live safely on the server. Lately that means web apps, a React Native app on the Play Store, and AI features with real guardrails.",
  ],
};
