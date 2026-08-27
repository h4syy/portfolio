// Your identity + work. Edit this freely — it drives the Work view.
export const profile = {
  name: 'Yash Paudel',
  role: 'AI Engineering Lead',
  location: 'Lalitpur, Nepal',
  tagline: 'I ship production systems — Python, FastAPI, Docker — and bring AI in where it earns its place.',
  about: 'AI Engineering Lead at Khalti. I build and ship real production systems — Python / FastAPI backends, Dockerised and deployed — and bring LLMs in where they actually earn their place: adapted to Nepali language, regulation, and users. 3+ years shipping software end to end. I’m genuinely open to interesting problems — production AI, hard backend work, or something neither of us has seen yet.',
  links: {
    github: 'https://github.com/h4syy',
    linkedin: 'https://www.linkedin.com/in/yashpaudel/',
    email: 'mailto:yashpaudel10@gmail.com',
  },
  stack: ['Python', 'FastAPI', 'Docker', 'LLMs / fine-tuning', 'Node.js', 'Production / DevOps', 'Fintech / KYC'],
};

// "Where I can help" — the operational substance that does the lead-gen.
export const capabilities = [
  { title: 'Backend & APIs', blurb: 'Python and FastAPI services built to hold up — clean APIs, sane data flow, typed and tested.' },
  { title: 'Ship & operate', blurb: 'Dockerised, deployed, observable. Getting things into production and keeping them healthy under real load.' },
  { title: 'Production AI & LLMs', blurb: 'Fine-tuning and adapting models to a real domain — plus the evaluation and data work that make them trustworthy.' },
  { title: 'Fintech & KYC', blurb: 'Payments-grade constraints: KYC onboarding, compliance, and the zero-margin-for-error details.' },
];

// The contact call-to-action.
export const cta = {
  headline: 'Open to interesting problems.',
  line: 'To collaborate, I either need to Learn or need to Earn — choose which side you want me on.',
  sub: 'Shipping AI to production, a gnarly backend, or something neither of us has seen yet — I’m easy to reach and up for a conversation.',
};

// Most recent first.
export const experience = [
  {
    role: 'AI Engineering Lead',
    org: 'Khalti',
    period: 'Present',
    summary: 'Leading applied-AI work at one of Nepal’s largest digital wallets — LLM-backed features and the Python/FastAPI services, Docker deployments, and evaluation behind them, running reliably inside a regulated fintech product.',
    tags: ['AI / LLMs', 'Python · FastAPI', 'Docker', 'Production'],
  },
  {
    role: 'AI Research Lead',
    org: 'IME Pay',
    period: 'Previously',
    summary: 'Owned AI projects at a national payment wallet: fine-tuning LLMs to real business use-cases, integrating third-party AI APIs, backend in Node.js, and the architecture for a new KYC onboarding flow.',
    tags: ['LLM fine-tuning', 'Node.js', 'KYC', 'Fintech'],
  },
];

// Things you’ve built.
export const projects = [
  {
    name: 'This site',
    year: '2026',
    blurb: 'A no-backend personal site — vanilla JS, static on Vercel, book covers straight from Open Library. Built to stay simple and fast.',
    href: '#reading',
    tags: ['Vanilla JS', 'Static', 'Vercel'],
  },
  {
    name: 'Domain-adapted LLMs for Nepali fintech',
    year: '2025 — 2026',
    blurb: 'Making general-purpose models trustworthy in a Nepali context — language, regulation, and user behaviour — rather than prompting harder. Written up in FLUX.',
    href: '#flux',
    tags: ['LLMs', 'Fine-tuning', 'NLP'],
  },
  {
    name: 'Mad_Chat',
    year: '',
    blurb: 'A cross-platform chat app built with Flutter.',
    href: 'https://github.com/h4syy/Mad_Chat',
    tags: ['Flutter', 'Mobile'],
  },
];
