/** Questions techies, founders and the walk-in recruiter ask. `answer` is the index of the right option. */
export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export const TECH_QUIZ: QuizQuestion[] = [
  { q: 'Quick one: what does HTTP status 404 mean?', options: ['Not found', 'Server exploded', 'Payment required', 'Too many chais'], answer: 0, why: 'The page is not there. Like the auto when it rains.' },
  { q: 'Which data structure is first-in, first-out?', options: ['Stack', 'Queue', 'Tree', 'Hash map'], answer: 1, why: 'A queue. Exactly like the Rameshwaram Cafe line, minus the dose.' },
  { q: 'Which git command fetches and merges the latest changes?', options: ['git push', 'git pull', 'git commit', 'git chai'], answer: 1, why: 'git pull. git chai is still in beta.' },
  { q: 'Time complexity of binary search on a sorted array?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], answer: 1, why: 'O(log n): halve it every step.' },
  { q: 'In JavaScript, what is typeof null?', options: ["'null'", "'object'", "'undefined'", "'number'"], answer: 1, why: "'object'. A 1995 bug that can never be fixed now." },
  { q: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Question Logic', 'Sprint Queue List', 'Swalpa Query Language'], answer: 0, why: 'Structured Query Language. Swalpa Query Language is the Bengaluru fork.' },
  { q: 'Which of these is not a programming language?', options: ['Python', 'Java', 'HTML', 'Go'], answer: 2, why: 'HTML is markup. Debate continues at SOCIAL every Friday.' },
  { q: 'In CI/CD, what does CI stand for?', options: ['Code Inspection', 'Continuous Integration', 'Chai Interval', 'Critical Incident'], answer: 1, why: 'Continuous Integration. Chai Interval is a close second.' },
  { q: 'Which HTTP method usually creates a new resource?', options: ['GET', 'POST', 'DELETE', 'HEAD'], answer: 1, why: 'POST.' },
  { q: 'What is 2 to the power 10?', options: ['1000', '1024', '512', '2048'], answer: 1, why: '1024. Every techie knows it, nobody knows why they remember it.' },
  { q: 'Which keyword declares a constant in JavaScript?', options: ['var', 'let', 'const', 'static'], answer: 2, why: 'const. Like the traffic on Silk Board.' },
  { q: 'Average cost of looking up a key in a hash map?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], answer: 0, why: 'O(1) on average.' },
  { q: 'What does DNS do?', options: ['Speeds up WiFi', 'Turns names into IP addresses', 'Deletes cookies', 'Deploys on Sunday'], answer: 1, why: 'It turns names into addresses. Like a good auto driver.' },
  { q: 'Which one is a NoSQL database?', options: ['PostgreSQL', 'MySQL', 'MongoDB', 'Oracle'], answer: 2, why: 'MongoDB.' },
  { q: 'Which command creates a new git branch and switches to it?', options: ['git checkout -b', 'git merge', 'git stash', 'git log'], answer: 0, why: 'git checkout -b (or git switch -c).' },
  { q: 'What does API stand for?', options: ['Advanced Python Instruction', 'Application Programming Interface', 'Automated Process Integration', 'Apple Pie Index'], answer: 1, why: 'Application Programming Interface.' },
  { q: 'Recursion with no base case leads to…', options: ['Faster code', 'A promotion', 'A stack overflow', 'Free lunch'], answer: 2, why: 'A stack overflow. The promotion also never comes.' },
  { q: 'Default port for HTTPS?', options: ['80', '443', '22', '8080'], answer: 1, why: '443.' },
  { q: 'What does UPI stand for?', options: ['Unified Payments Interface', 'Universal Pay ID', 'United Payment India', 'Ultra Pay Instant'], answer: 0, why: 'Unified Payments Interface. Even the coconut seller has a QR.' },
  { q: 'In Python, what does len([1, 2, 3]) return?', options: ['2', '3', '6', 'An error'], answer: 1, why: '3.' },
];
