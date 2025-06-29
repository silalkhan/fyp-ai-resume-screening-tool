import {
  Resume,
  Education,
  Experience,
  Project,
  ProcessedData,
} from "../types";

/**
 * Cleans and processes resume data to ensure it's ready for display
 * Removes invalid entries, calculates total experience, etc.
 */
export const processResumeData = (resume: Resume): Resume => {
  if (!resume) {
    return resume;
  }

  // Add debugging for match score
  console.log("processResumeData - Original matchScore:", resume.matchScore);

  const processedResume = { ...resume };

  // Handle processing state
  if (processedResume.processing) {
    processedResume.processed = false;
    processedResume.processingError = null;
    return processedResume;
  }

  // Make sure we have a taskId
  if (!processedResume.taskId && processedResume._id) {
    processedResume.taskId = processedResume._id;
  }

  // Check if we are still processing or don't have processed data
  if (!processedResume.processedData || processedResume.processing) {
    processedResume.processing = true;
    processedResume.processed = false;
    processedResume.processingError = null;
    return processedResume;
  }

  // Make sure processed flag is set and processing is false when we have data
  if (processedResume.processedData || processedResume.matchScore) {
    processedResume.processed = true;
    processedResume.processing = false;
  }

  // Ensure matchScore is preserved
  if (resume.matchScore !== undefined && resume.matchScore !== null) {
    processedResume.matchScore = resume.matchScore;
  } else if (!processedResume.matchScore) {
    // If no match score is available, set a default
    console.warn("No match score found in resume data, using default");
    processedResume.matchScore = 0;
  }

  // Create empty processedData if missing but we have a matchScore
  if (!processedResume.processedData && processedResume.matchScore) {
    console.log(
      "Creating minimal processedData structure for resume with matchScore"
    );
    processedResume.processedData = {
      skills: [],
      education: [],
      experience: [],
      projects: [],
    };
  }

  const originalProcessedData = processedResume.processedData;

  const processedData: ProcessedData = {
    skills: [...(originalProcessedData.skills || [])],
    education: [...(originalProcessedData.education || [])],
    experience: [...(originalProcessedData.experience || [])],
    projects: [...(originalProcessedData.projects || [])],
  };

  // Clean education data
  processedData.education = cleanEducationData(processedData.education);

  // Clean experience data and calculate total years
  processedData.experience = cleanExperienceData(processedData.experience);

  // Clean projects data
  if (processedData.projects) {
    processedData.projects = cleanProjectsData(processedData.projects);
  }

  // Clean skills data
  processedData.skills = cleanSkillsData(processedData.skills);

  // Update the processed resume with cleaned data
  processedResume.processedData = processedData;
  processedResume.processed = true;
  processedResume.processing = false;
  processedResume.processingError = null;

  // Final debugging for match score
  console.log(
    "processResumeData - Final matchScore:",
    processedResume.matchScore
  );

  return processedResume;
};

/**
 * Cleans education data by removing invalid entries
 */
const cleanEducationData = (education: Education[]): Education[] => {
  if (!education || !Array.isArray(education)) {
    return [];
  }

  return education.filter((edu) => {
    // Check if the institution is valid (not a skill, programming language, etc.)
    const invalidInstitutions = [
      "javascript",
      "python",
      "java",
      "react",
      "node.js",
      "typescript",
      "tensorflow",
      "pytorch",
      "ai",
      "ml",
      "ci",
      "cd",
    ];

    const isInvalidInstitution =
      !edu.institution ||
      invalidInstitutions.some((invalid) =>
        edu.institution.toLowerCase().includes(invalid.toLowerCase())
      );

    // Entry must have institution and at least one other field
    const hasRequiredFields =
      edu.institution && (edu.degree || edu.field || edu.year);

    return !isInvalidInstitution && hasRequiredFields;
  });
};

/**
 * Cleans experience data and ensures all required fields are present
 */
const cleanExperienceData = (experience: Experience[]): Experience[] => {
  if (!experience || !Array.isArray(experience)) {
    return [];
  }

  return experience.filter((exp) => {
    // Must have at least company and position
    return exp.company && exp.position;
  });
};

/**
 * Cleans projects data
 */
const cleanProjectsData = (projects: Project[]): Project[] => {
  if (!projects || !Array.isArray(projects)) {
    return [];
  }

  return projects.filter((project) => {
    // Must have at least a title
    return project.title && project.title.trim().length > 0;
  });
};

/**
 * Cleans skills data by removing duplicates and normalizing
 */
const cleanSkillsData = (skills: string[]): string[] => {
  if (!skills || !Array.isArray(skills)) {
    return [];
  }

  // Remove duplicates and normalize
  const normalizedSkills = new Set<string>();

  skills.forEach((skill) => {
    if (skill && typeof skill === "string") {
      // Normalize skill (first letter uppercase, rest lowercase)
      const normalizedSkill = skill.trim();
      if (normalizedSkill) {
        normalizedSkills.add(normalizedSkill);
      }
    }
  });

  return Array.from(normalizedSkills);
};

/**
 * Calculates total years of experience from experience entries
 */
export const calculateTotalExperience = (resume: Resume): number => {
  if (
    !resume ||
    !resume.processedData?.experience ||
    resume.processedData.experience.length === 0
  ) {
    return 0;
  }

  const currentYear = new Date().getFullYear();
  let totalYears = 0;

  resume.processedData.experience.forEach((exp) => {
    if (!exp.duration) return;

    const duration = exp.duration.toLowerCase();

    // Case 1: Explicit years mentioned (e.g., "3 years")
    const yearsMatch = duration.match(/(\d+)\s*(?:year|yr)s?/i);
    if (yearsMatch) {
      totalYears += parseInt(yearsMatch[1]);
      return;
    }

    // Case 2: Date range with full years (e.g., "2018-2022" or "2018-Present")
    const yearRangeMatch = duration.match(
      /(\d{4})\s*[-–—]\s*(\d{4}|present|current|now)/i
    );
    if (yearRangeMatch) {
      const startYear = parseInt(yearRangeMatch[1]);
      const endYear = yearRangeMatch[2]
        .toLowerCase()
        .match(/present|current|now/i)
        ? currentYear
        : parseInt(yearRangeMatch[2]);

      if (startYear && endYear && endYear >= startYear) {
        totalYears += endYear - startYear;
      }
      return;
    }

    // Case 3: Month/Year format (e.g., "Jan 2018 - Dec 2020" or "January 2018 - Present")
    const monthYearPattern =
      /(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)[,\s]+)?(\d{4})\s*[-–—]\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)[,\s]+)?(\d{4}|present|current|now)/i;

    const monthYearMatch = duration.match(monthYearPattern);
    if (monthYearMatch) {
      const startYear = parseInt(monthYearMatch[2]);
      const endYear = monthYearMatch[4]
        .toLowerCase()
        .match(/present|current|now/i)
        ? currentYear
        : parseInt(monthYearMatch[4]);

      if (startYear && endYear && endYear >= startYear) {
        // Calculate years and months if both months are specified
        if (
          monthYearMatch[1] &&
          monthYearMatch[3] &&
          !monthYearMatch[4].toLowerCase().match(/present|current|now/i)
        ) {
          const startMonth = getMonthNumber(monthYearMatch[1]);
          const endMonth = getMonthNumber(monthYearMatch[3]);

          if (startMonth !== -1 && endMonth !== -1) {
            const yearDiff = endYear - startYear;
            const monthDiff = endMonth - startMonth;
            const totalMonths = yearDiff * 12 + monthDiff;
            totalYears += totalMonths / 12;
            return;
          }
        }

        // If we can't calculate months precisely, just use years
        totalYears += endYear - startYear;
      }
      return;
    }

    // Case 4: MM/YYYY format (e.g., "06/2018 - 07/2020")
    const mmyyyyPattern =
      /(\d{1,2})\/(\d{4})\s*[-–—]\s*(?:(\d{1,2})\/(\d{4})|present|current|now)/i;
    const mmyyyyMatch = duration.match(mmyyyyPattern);

    if (mmyyyyMatch) {
      const startYear = parseInt(mmyyyyMatch[2]);
      const endYear = mmyyyyMatch[4] ? parseInt(mmyyyyMatch[4]) : currentYear;

      if (startYear && endYear && endYear >= startYear) {
        // If we have both start and end months
        if (mmyyyyMatch[1] && mmyyyyMatch[3] && mmyyyyMatch[4]) {
          const startMonth = parseInt(mmyyyyMatch[1]);
          const endMonth = parseInt(mmyyyyMatch[3]);

          if (
            startMonth >= 1 &&
            startMonth <= 12 &&
            endMonth >= 1 &&
            endMonth <= 12
          ) {
            const yearDiff = endYear - startYear;
            const monthDiff = endMonth - startMonth;
            const totalMonths = yearDiff * 12 + monthDiff;
            totalYears += totalMonths / 12;
            return;
          }
        }

        // If we can't calculate months precisely, just use years
        totalYears += endYear - startYear;
      }
    }
  });

  // Round to 1 decimal place
  return Math.round(totalYears * 10) / 10;
};

/**
 * Helper function to convert month name to number (0-11)
 */
const getMonthNumber = (monthName: string): number => {
  const months: { [key: string]: number } = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  return months[monthName.toLowerCase()] ?? -1;
};

// Common skill synonyms and abbreviations for better matching
const SKILL_SYNONYMS: { [key: string]: string[] } = {
  // Programming Languages
  javascript: [
    "js",
    "es6",
    "es2015",
    "es2016",
    "es2017",
    "es2018",
    "es2019",
    "es2020",
    "ecmascript",
    "vanilla javascript",
    "node.js",
    "nodejs",
  ],
  typescript: ["ts", "tsc", "typed javascript", "typescript language"],
  python: ["py", "python2", "python3", "python programming", "django", "flask"],
  java: [
    "j2ee",
    "jdk",
    "jre",
    "java ee",
    "java se",
    "core java",
    "advanced java",
  ],
  "c#": ["csharp", "c sharp", ".net", "dotnet", "asp.net", "net core"],
  "c++": ["cpp", "cplusplus", "c plus plus", "gcc", "g++"],
  php: ["php7", "php8", "laravel", "symfony", "php frameworks"],
  ruby: ["rb", "ruby on rails", "rails", "ror"],
  rust: ["rustc", "cargo", "rust lang"],
  golang: ["go", "go lang"],

  // Frontend
  react: [
    "reactjs",
    "react.js",
    "react native",
    "react hooks",
    "redux",
    "next.js",
    "nextjs",
  ],
  angular: [
    "angularjs",
    "angular.js",
    "ng",
    "angular 2+",
    "angular cli",
    "angular material",
  ],
  vue: ["vuejs", "vue.js", "vue3", "vuex", "nuxt.js", "nuxtjs"],
  jquery: ["jq", "jquery ui", "jquery mobile"],
  css: [
    "css3",
    "scss",
    "sass",
    "less",
    "stylesheets",
    "styled components",
    "css modules",
    "tailwind",
    "bootstrap",
  ],
  html: ["html5", "markup", "semantic html", "web components"],
  frontend: ["front end", "front-end", "client side", "ui development"],

  // Backend
  backend: ["back end", "back-end", "server side"],
  node: ["nodejs", "node.js", "express", "nestjs", "node backend"],
  express: ["expressjs", "express.js", "express framework"],
  django: ["django rest framework", "drf", "django orm"],
  flask: ["flask-restful", "flask api", "flask framework"],
  spring: [
    "spring boot",
    "spring mvc",
    "spring framework",
    "spring cloud",
    "spring security",
  ],

  // Databases
  sql: [
    "mysql",
    "postgresql",
    "postgres",
    "oracle",
    "sql server",
    "tsql",
    "plsql",
    "rdbms",
    "relational databases",
    "sqlite",
  ],
  nosql: [
    "mongodb",
    "mongo",
    "dynamodb",
    "cassandra",
    "couchdb",
    "firebase",
    "non-relational databases",
  ],
  redis: ["redis cache", "redis cluster", "redis pub/sub"],

  // DevOps & Cloud
  devops: [
    "devsecops",
    "devops engineering",
    "ci/cd",
    "continuous integration",
    "continuous deployment",
  ],
  aws: [
    "amazon web services",
    "ec2",
    "s3",
    "lambda",
    "aws cloud",
    "aws services",
    "amazon cloud",
  ],
  azure: ["microsoft azure", "azure cloud", "azure devops", "azure services"],
  gcp: [
    "google cloud",
    "google cloud platform",
    "gcloud",
    "google cloud services",
  ],
  docker: ["containerization", "containers", "docker compose", "docker swarm"],
  kubernetes: [
    "k8s",
    "k8",
    "kube",
    "kubernetes cluster",
    "container orchestration",
  ],
  jenkins: ["jenkins pipeline", "jenkins ci", "continuous integration"],
  git: [
    "github",
    "gitlab",
    "bitbucket",
    "version control",
    "source control",
    "git flow",
  ],

  // Data Science & ML
  "machine learning": [
    "ml",
    "artificial intelligence",
    "ai",
    "machine learning algorithms",
    "predictive modeling",
  ],
  "deep learning": [
    "dl",
    "neural networks",
    "cnn",
    "rnn",
    "lstm",
    "transformers",
  ],
  nlp: [
    "natural language processing",
    "text processing",
    "language models",
    "text analysis",
  ],
  tensorflow: ["tf", "keras", "tensorflow 2.0", "deep learning framework"],
  pytorch: ["torch", "deep learning framework", "pytorch lightning"],
  pandas: ["pd", "data analysis", "data manipulation", "data processing"],
  numpy: ["np", "numerical computing", "scientific computing"],

  // Mobile
  android: ["android development", "android studio", "kotlin", "android sdk"],
  ios: [
    "swift",
    "objective-c",
    "xcode",
    "ios development",
    "cocoa",
    "uikit",
    "swiftui",
  ],
  "react native": ["rn", "react-native", "mobile development"],
  flutter: ["dart", "flutter sdk", "flutter widgets", "cross platform"],

  // Testing
  testing: ["qa", "quality assurance", "software testing", "test automation"],
  jest: ["testing library", "react testing", "unit testing", "js testing"],
  selenium: ["webdriver", "selenium webdriver", "browser automation"],
  junit: ["testng", "java testing", "unit testing"],
  cypress: ["e2e testing", "end to end testing", "cypress.io"],

  // Methodologies & Concepts
  agile: [
    "scrum",
    "kanban",
    "agile methodology",
    "sprint planning",
    "agile development",
  ],
  "design patterns": [
    "solid principles",
    "oop",
    "object oriented",
    "software architecture",
  ],
  microservices: [
    "distributed systems",
    "service oriented",
    "api design",
    "microservice architecture",
  ],

  // Tools & Others
  jira: ["atlassian", "project management", "issue tracking"],
  rest: ["restful", "rest api", "api development", "web services"],
  graphql: ["graph ql", "apollo", "api query language"],
  webpack: ["bundler", "module bundler", "build tool"],
  linux: ["unix", "bash", "shell scripting", "command line"],
  nginx: ["web server", "reverse proxy", "load balancer"],
};

/**
 * Categorizes skills into matched and unmatched based on job description
 * Uses improved matching with synonyms, fuzzy matching, and partial matching
 */
export const categorizeSkills = (
  resume: Resume
): { matchedSkills: string[]; unmatchedSkills: string[] } => {
  if (!resume || !resume.processedData?.skills) {
    return {
      matchedSkills: [],
      unmatchedSkills: resume?.processedData?.skills || [],
    };
  }

  // Extract required skills from either the jobDescription object or directly from resume properties
  let requiredSkills: string[] = [];

  // First try to get skills from the jobDescription object
  if (resume.jobDescription?.requiredSkills) {
    requiredSkills = resume.jobDescription.requiredSkills;
    console.log("Using skills from jobDescription object:", requiredSkills);
  }
  // If no skills found, try to extract from other potential properties
  else if (resume.jobDescriptionId) {
    console.log(
      "No job description object found, but have jobDescriptionId:",
      resume.jobDescriptionId
    );
    // At this point, we don't have required skills, but we'll use the detected skills for display
    return {
      matchedSkills: resume.processedData.skills,
      unmatchedSkills: [],
    };
  }

  if (requiredSkills.length === 0) {
    console.log(
      "No required skills found in job description, showing all skills as matched"
    );
    return {
      matchedSkills: resume.processedData.skills,
      unmatchedSkills: [],
    };
  }

  // Normalize all skills for comparison
  const normalizedResumeSkills = resume.processedData.skills.map((skill) => ({
    original: skill,
    normalized: normalizeSkill(skill),
  }));

  const normalizedRequiredSkills = requiredSkills.map((skill) => ({
    original: skill,
    normalized: normalizeSkill(skill),
  }));

  // Create an array of required skills and their variations
  const requiredSkillVariations: Array<{
    original: string;
    variations: string[];
  }> = normalizedRequiredSkills.map(({ original, normalized }) => {
    const variations = [normalized];

    // Add synonyms and their normalized forms
    findSynonyms(normalized).forEach((synonym) => {
      variations.push(normalizeSkill(synonym));
    });

    return { original, variations };
  });

  const matchedSkills: string[] = [];
  const unmatchedSkills: string[] = [];

  // Process each resume skill
  normalizedResumeSkills.forEach(({ original, normalized }) => {
    let foundMatch = false;
    const synonyms = findSynonyms(normalized);

    for (const { variations } of requiredSkillVariations) {
      // Check exact matches
      if (variations.includes(normalized)) {
        matchedSkills.push(original);
        foundMatch = true;
        break;
      }

      // Check synonym matches
      if (synonyms.some((syn) => variations.includes(normalizeSkill(syn)))) {
        matchedSkills.push(original);
        foundMatch = true;
        break;
      }

      // Check partial matches (e.g. "JavaScript ES6" matches required "JavaScript")
      if (
        variations.some(
          (req) =>
            normalized.includes(req) ||
            req.includes(normalized) ||
            calculateSimilarity(normalized, req) > 0.85
        )
      ) {
        matchedSkills.push(original);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      unmatchedSkills.push(original);
    }
  });

  return { matchedSkills, unmatchedSkills };
};

/**
 * Normalize a skill name for comparison
 * Handles special characters, plural forms, and common variations
 */
const normalizeSkill = (skill: string): string => {
  const normalized = skill
    .toLowerCase()
    .trim()
    // Replace special characters with spaces
    .replace(/[-_./\\]/g, " ")
    // Remove common suffixes
    .replace(/(ing|ed|er|or)s?$/, "")
    // Remove version numbers
    .replace(/\s*\d+(\.\d+)*\s*/g, " ")
    // Remove common prefixes
    .replace(/^(jr|sr|senior|junior|lead|principal)\s+/, "")
    // Remove parentheses and their contents
    .replace(/\([^)]*\)/g, "")
    // Remove common words that don't affect meaning
    .replace(/\b(and|or|in|with|using|for|the|a|an)\b/g, "")
    // Replace multiple spaces with a single space
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
};

/**
 * Find synonyms for a given skill
 * Also checks for fuzzy matches in the synonym dictionary
 */
const findSynonyms = (skill: string): string[] => {
  const normalized = normalizeSkill(skill);
  const synonyms = new Set<string>();

  // Direct lookup in synonyms dictionary
  for (const [key, values] of Object.entries(SKILL_SYNONYMS)) {
    if (key === normalized) {
      values.forEach((s) => synonyms.add(s));
      break;
    }

    // Check if this skill is a known synonym
    if (values.includes(normalized)) {
      synonyms.add(key);
      values.filter((s) => s !== normalized).forEach((s) => synonyms.add(s));
      break;
    }

    // Check for fuzzy matches with high similarity
    const keySimScore = calculateSimilarity(normalized, key);
    if (keySimScore > 0.85) {
      values.forEach((s) => synonyms.add(s));
      continue;
    }

    // Check similarity with each synonym
    for (const syn of values) {
      const simScore = calculateSimilarity(normalized, syn);
      if (simScore > 0.85) {
        synonyms.add(key);
        values.forEach((s) => synonyms.add(s));
        break;
      }
    }
  }

  return Array.from(synonyms);
};

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;
  if (shorter.length === 0) return 0.0;

  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) costs[i] = i;

  for (let i = 1; i <= longer.length; i++) {
    let nw = i - 1;
    costs[0] = i;

    for (let j = 1; j <= shorter.length; j++) {
      const cj = Math.min(
        1 + Math.min(costs[j], costs[j - 1]),
        longer[i - 1] === shorter[j - 1] ? nw : nw + 1
      );
      nw = costs[j];
      costs[j] = cj;
    }
  }

  return (longer.length - costs[shorter.length]) / longer.length;
};
