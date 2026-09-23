/**
 * Facts about me that more than one page shows. The home page, the CV and the
 * command palette all read from here, so they cannot drift apart.
 */

export const profile = {
  name: "Akshay Gujjula",
  fullName: "Akshay Reddy Gujjula",
  location: "London, UK",
  email: "akshayreddyg07@gmail.com",
  summary:
    "Second-year Computer Science student at UCL, graduating 2028, building full-stack, AI and performance-sensitive systems.",
  links: {
    github: "https://github.com/AkshayReddyGujjula",
    linkedin: "https://www.linkedin.com/in/akshayreddygujjula/",
  },
} as const;

export interface Education {
  school: string;
  qualification: string;
  period: string;
  details: string[];
}

export const education: Education[] = [
  {
    school: "University College London",
    qualification: "BSc Computer Science",
    period: "Sept 2025 – June 2028",
    details: [
      "Modules: Discrete Mathematics, Theory of Computation, Object-Oriented Programming (Java), Functional Programming (Haskell), Algorithms, Principles of Programming (C).",
    ],
  },
  {
    school: "Southend High School for Boys",
    qualification: "A-levels",
    period: "Sept 2023 – June 2025",
    details: [
      "A*AA: Mathematics (A*), Further Mathematics (A), Computer Science (A).",
      "Senior Maths Challenge Gold Award, best in school.",
    ],
  },
];

export const experience = [
  {
    role: "Private Tutor",
    subject: "A-level Mathematics, A-level Computer Science (OCR), Python",
    period: "Sept 2024 – present",
    details: [
      "Tutor 7 A-level students. I design lessons on programming fundamentals, algorithms and OCR NEA preparation against published mark schemes, and teach recursion and abstraction from first principles through live debugging.",
    ],
  },
];

export const skills: Record<string, string[]> = {
  Languages: ["Python", "TypeScript", "JavaScript", "Java", "C", "Haskell", "SQL"],
  "Frameworks and libraries": [
    "React",
    "Next.js",
    "FastAPI",
    "Flask",
    "LangGraph",
    "pandas",
    "scikit-learn",
    "ONNX Runtime Web",
  ],
  "Tools, infrastructure and APIs": [
    "Git and GitHub",
    "GitHub Actions",
    "Docker",
    "SQLite",
    "Vercel",
    "WebAssembly (WASM SIMD)",
    "Web Workers",
    "Claude API",
    "Gemini API",
    "REST APIs",
    "A2A, A2UI and AG-UI",
    "Chrome Extensions API",
  ],
};

/** Shown in the About section. */
export const about = {
  paragraphs: [
    "I'm a second-year Computer Science student at UCL, graduating in 2028. Alongside my degree I tutor seven A-level students in Maths, Computer Science and Python, mostly by debugging live with them until the idea clicks.",
    "Away from the keyboard I'm usually watching Formula 1 or cricket. Both come down to small margins, and so does my favourite kind of programming: getting something to use fewer tokens, fewer steps and less time than it did yesterday.",
  ],
};
