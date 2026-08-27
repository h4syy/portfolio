// Your identity + work. Edit this freely; it drives the Work view.
export const profile = {
  name: 'Yash Paudel',
  role: 'AI Engineering Lead',
  location: 'Lalitpur, Nepal',
  tagline: 'I ship production systems in Python, FastAPI and Docker, and the identity, KYC and AI layers fintech runs on.',
  about: 'AI Engineering Lead at Khalti. I build and ship real production systems: Python and FastAPI backends, Dockerised and deployed. My pull is toward the hard fintech edges, biometric KYC and identity, and bringing AI into products where it actually earns its place. 3+ years shipping software end to end. I’m genuinely open to interesting problems, whether that’s production engineering, identity, AI, or something neither of us has seen yet.',
  links: {
    github: 'https://github.com/h4syy',
    linkedin: 'https://www.linkedin.com/in/yashpaudel/',
    email: 'mailto:yashpaudel10@gmail.com',
  },
  stack: ['Python', 'FastAPI', 'Docker', 'Biometrics / KYC', 'LLMs', 'Node.js'],
};

// "Where I can help": the operational substance that does the lead-gen.
export const capabilities = [
  { title: 'Backend & APIs', blurb: 'Python and FastAPI services built to hold up. Clean APIs, sane data flow, typed and tested.' },
  { title: 'Docker & deploy', blurb: 'Containerised with Docker and shipped to production. Getting a service off my machine and running for real.' },
  { title: 'Biometrics & KYC', blurb: 'Where identity meets engineering: liveness and face-match, document checks, and onboarding flows that satisfy compliance without wrecking the UX.' },
  { title: 'Applied AI', blurb: 'Bringing LLMs into real products where they earn their place. The integration, evaluation, and guardrails that make them trustworthy, not a demo.' },
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
