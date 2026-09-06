// Your identity + work. Edit this freely; it drives the Work view.
export const profile = {
  name: 'Yash Paudel',
  role: 'AI Engineering Lead',
  location: 'Lalitpur, Nepal',
  tagline: 'I build intelligent systems for the real world.',
  about: 'Three years working in KYC and biometrics have shaped how I think about engineering. Identity is the front door of a fintech: a mistake at entry can become a much bigger problem downstream. That responsibility stays with me as I build systems that can converse, use tools, and act.',
  links: {
    github: 'https://github.com/h4syy',
    linkedin: 'https://www.linkedin.com/in/yashpaudel/',
    email: 'mailto:yashpaudel10@gmail.com',
  },
  stack: ['KYC & biometrics', 'Agentic systems', 'Full-duplex voice'],
};

// "Where I can help": the operational substance that does the lead-gen.
export const capabilities = [
  { title: 'Data harnessing', blurb: 'The foundation beneath AI systems: preparing, connecting, and evaluating the data that models and agents depend on.' },
  { title: 'Full-duplex voice AI', blurb: 'My current focus: engineering autonomous voice AI with full-duplex interaction, without a human operator in the loop.' },
  { title: 'Agentic harness engineering', blurb: 'Over the last six months, my work has expanded into the engineering around agents: building the systems that let AI use tools and act.' },
];

// The contact call-to-action.
export const cta = {
  headline: 'Open to interesting problems.',
  line: 'To collaborate, I either need to Learn or need to Earn. Choose which side you want me on.',
  sub: 'Production AI, a gnarly backend, identity and KYC systems, or something neither of us has seen yet. I’m easy to reach and up for a conversation.',
};

// Most recent first.
export const experience = [
  {
    role: 'AI Engineering Lead',
    org: 'Khalti',
    period: 'Present',
    summary: 'Leading applied-AI and identity work at one of Nepal’s largest digital wallets: the Python and FastAPI services, Docker deployments, KYC and identity flows, and evaluation behind features that run reliably inside a regulated fintech product.',
    tags: ['Python · FastAPI', 'Docker', 'KYC / Identity', 'Applied AI'],
  },
  {
    role: 'AI Research Lead',
    org: 'IME Pay',
    period: 'Previously',
    summary: 'Owned AI and identity projects at a national payment wallet: the architecture for a new biometric KYC onboarding flow, adapting LLMs to real business use-cases, third-party AI integration, and backend in Node.js.',
    tags: ['Biometric KYC', 'Applied LLMs', 'Node.js', 'Fintech'],
  },
];

// Things you’ve built.
export const projects = [
  {
    name: 'This site',
    year: '2026',
    blurb: 'A no-backend personal site: vanilla JS, static on Vercel, book covers straight from Open Library. Built to stay simple and fast.',
    href: '#reading',
    tags: ['Vanilla JS', 'Static', 'Vercel'],
  },
  {
    name: 'AI that holds up in Nepali fintech',
    year: '2025–2026',
    blurb: 'Getting general-purpose models to actually work in a Nepali context (language, regulation, and users), plus the evaluation to trust them in production. Written up in FLUX.',
    href: '#flux',
    tags: ['Applied AI', 'NLP', 'Evaluation'],
  },
  {
    name: 'Mad_Chat',
    year: '',
    blurb: 'A cross-platform chat app built with Flutter.',
    href: 'https://github.com/h4syy/Mad_Chat',
    tags: ['Flutter', 'Mobile'],
  },
];
