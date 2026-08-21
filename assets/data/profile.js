// Your identity + work. Edit this freely — it drives the Work view.
export const profile = {
  name: 'Yash Paudel',
  role: 'AI Engineering Lead',
  location: 'Lalitpur, Nepal',
  tagline: 'I build reliable systems — and reach for AI when it makes the work better, not because it is the headline.',
  about: 'AI Engineering Lead at Khalti, working on applied AI and LLM systems for Nepal’s fintech — from adapting models to Nepali language and regulation to the backend that actually ships them. 3+ years building software end to end, from Nepal.',
  links: {
    github: 'https://github.com/h4syy',
    linkedin: 'https://www.linkedin.com/in/yashpaudel/',
    email: 'mailto:yashpaudel10@gmail.com',
  },
};

// Most recent first.
export const experience = [
  {
    role: 'AI Engineering Lead',
    org: 'Khalti',
    period: 'Present',
    summary: 'Leading applied-AI work at one of Nepal’s largest digital wallets — LLM-backed features, AI services, and the engineering to run them reliably inside a regulated fintech product.',
    tags: ['AI / LLMs', 'Backend', 'Fintech'],
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
    name: 'Reading Knowledge Graph',
    year: '2026',
    blurb: 'This site. An on-device-AI graph of how the books I read relate — vanilla JS, no backend, embeddings computed in the browser.',
    href: '#reading',
    tags: ['Canvas', 'On-device AI', 'Vanilla JS'],
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
