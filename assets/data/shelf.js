export const profile = {
  name: 'Yash Paudel',
  role: 'Software engineer · Nepal',
  tagline: 'I build reliable systems, and I read widely to understand how the ideas connect.',
  about: 'Engineer working across backend, AI, and the messy glue between. Based in Nepal, focused on things that ship and hold up in production. Off the clock I read across engineering, cosmology, philosophy, and the occasional novel — the graph below is how those threads relate.',
  links: {
    github: 'https://github.com/h4syy',
    linkedin: 'https://www.linkedin.com/in/yashpaudel/',
    email: 'mailto:yashpaudel10@gmail.com',
  },
};

// status: 'reading' | 'read' | 'want'. Add rating (1–5)/review/finished when you like.
// isbn (optional) fetches the cover from Open Library; omit it and the card shows a monogram.
export const shelf = [
  // — currently reading —
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781449373320', status: 'reading', tags: ['distributed-systems','databases','engineering'] },
  { title: 'Project Hail Mary', author: 'Andy Weir', isbn: '9780593135204', status: 'reading', tags: ['fiction','sci-fi','space'] },
  { title: 'Co-Intelligence', author: 'Ethan Mollick', isbn: '9780593716717', status: 'reading', tags: ['ai','technology','work'] },
  { title: 'Homo Deus', author: 'Yuval Noah Harari', isbn: '9780062464316', status: 'reading', tags: ['history','future','society'] },
  { title: 'Eat That Frog', author: 'Brian Tracy', isbn: '9781626569416', status: 'reading', tags: ['productivity','self-help'] },
  { title: 'High Output Management', author: 'Andrew S. Grove', isbn: '9780679762881', status: 'reading', tags: ['management','business'] },
  { title: 'Norwegian Wood', author: 'Haruki Murakami', isbn: '9780375704024', status: 'reading', tags: ['fiction','literary'] },
  // — finished —
  { title: 'Meditations', author: 'Marcus Aurelius', isbn: '9780140449334', status: 'read', tags: ['philosophy','stoicism'] },
  { title: 'How to Survive a Black Hole', author: '', status: 'read', tags: ['space','physics','science'] },
  { title: 'The Grand Design', author: 'Stephen Hawking', isbn: '9780553805376', status: 'read', tags: ['physics','cosmology','science'] },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', status: 'read', tags: ['productivity','habits','self-help'] },
  { title: 'The Art of War', author: 'Sun Tzu', isbn: '9780140439199', status: 'read', tags: ['strategy','philosophy'] },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', status: 'read', tags: ['history','society'] },
  { title: 'Ikigai', author: 'Héctor García', isbn: '9780143130727', status: 'read', tags: ['philosophy','life','self-help'] },
  { title: 'The 48 Laws of Power', author: 'Robert Greene', isbn: '9780140280197', status: 'read', tags: ['strategy','power','psychology'] },
  { title: 'Leaders Eat Last', author: 'Simon Sinek', isbn: '9781591848011', status: 'read', tags: ['leadership','management'] },
  { title: 'The Personal MBA', author: 'Josh Kaufman', isbn: '9781591845577', status: 'read', tags: ['business','self-help'] },
  { title: 'Black Holes', author: 'Brian Cox', isbn: '9780008390686', status: 'read', tags: ['physics','cosmology','science'] },
  { title: 'To Infinity and Beyond', author: 'Neil deGrasse Tyson', status: 'read', tags: ['space','cosmology','science'] },
  { title: 'Infinite Cosmos', author: 'Ethan Siegel', status: 'read', tags: ['space','cosmology','science'] },
];
