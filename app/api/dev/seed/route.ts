import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import TalentProfile from '@/models/TalentProfile';
import ScreeningResult from '@/models/ScreeningResult';

// GET /api/dev/seed — development only, wipes & re-seeds the database
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ message: 'Not available in production' }, { status: 403 });
  }

  try {
    await connectDB();

    // Wipe existing data
    await Promise.all([
      Job.deleteMany({}),
      TalentProfile.deleteMany({}),
      ScreeningResult.deleteMany({}),
    ]);

    /* ═══════════════════════════════════════════════════════════════
       JOB 1 — Senior Frontend Developer
    ═══════════════════════════════════════════════════════════════ */
    const job1 = await Job.create({
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      description: 'Lead UI development for our flagship SaaS platform. Own the component library, mentor junior devs, and collaborate with product and design to ship pixel-perfect, performant interfaces.',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
      experienceYears: 3,
      shortlistTarget: 10,
      status: 'active',
      applicantCount: 0,
    });

    const applicants1 = await TalentProfile.insertMany([
      {
        jobId: job1._id,
        firstName: 'Alice', lastName: 'Mugisha',
        email: 'alice.mugisha@email.com', phone: '+250788001001',
        headline: 'Senior Frontend Engineer – React & TypeScript Specialist',
        bio: 'Passionate frontend engineer with 5 years building scalable React applications. Led migration of a legacy jQuery codebase to React at Andela, reducing bundle size by 40%. Strong TypeScript advocate with a focus on performance and accessibility.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'React',        level: 'Expert',        yearsOfExperience: 5 },
          { name: 'TypeScript',   level: 'Expert',        yearsOfExperience: 4 },
          { name: 'Next.js',      level: 'Advanced',      yearsOfExperience: 3 },
          { name: 'Tailwind CSS', level: 'Advanced',      yearsOfExperience: 3 },
          { name: 'GraphQL',      level: 'Intermediate',  yearsOfExperience: 2 },
          { name: 'Redux',        level: 'Advanced',      yearsOfExperience: 4 },
        ],
        languages: [
          { name: 'English', proficiency: 'Fluent' },
          { name: 'Kinyarwanda', proficiency: 'Native' },
        ],
        experience: [
          {
            company: 'Andela', role: 'Frontend Engineer',
            startDate: '2021-03', endDate: 'Present', isCurrent: true,
            description: 'Led the frontend guild, migrated legacy codebase to React, mentored 3 junior engineers.',
            technologies: ['React', 'TypeScript', 'Redux', 'Jest'],
          },
          {
            company: 'Irembo', role: 'Junior Frontend Developer',
            startDate: '2019-06', endDate: '2021-02', isCurrent: false,
            description: 'Built citizen-facing government portals serving 500K+ monthly active users.',
            technologies: ['React', 'JavaScript', 'CSS'],
          },
        ],
        experienceYears: 5, currentRole: 'Frontend Engineer at Andela',
        education: [
          { institution: 'University of Rwanda', degree: 'BSc', fieldOfStudy: 'Computer Science', startYear: 2015, endYear: 2019 },
        ],
        certifications: [
          { name: 'Meta Frontend Developer', issuer: 'Meta / Coursera', issueDate: '2022-04' },
        ],
        projects: [
          {
            name: 'Irembo e-Government Portal',
            description: 'Citizen services platform processing 50K+ daily transactions.',
            technologies: ['React', 'TypeScript', 'REST APIs'],
            role: 'Lead Frontend Engineer',
            startDate: '2020-01', endDate: '2021-01',
          },
        ],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        socialLinks: { linkedin: 'https://linkedin.com/in/alice-mugisha', github: 'https://github.com/alicemugisha' },
        source: 'umurava',
      },
      {
        jobId: job1._id,
        firstName: 'Esther', lastName: 'Uwimana',
        email: 'esther.uwimana@email.com', phone: '+250788001002',
        headline: 'Frontend Lead – Design Systems & Testing Culture',
        bio: 'Frontend lead with deep expertise in the React ecosystem. Built and maintained a design system used by 10+ product teams at Kasha. Strong advocate for testing — 90%+ coverage on all production projects.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'React',            level: 'Expert',       yearsOfExperience: 4 },
          { name: 'TypeScript',       level: 'Expert',       yearsOfExperience: 4 },
          { name: 'Next.js',          level: 'Expert',       yearsOfExperience: 3 },
          { name: 'Tailwind CSS',     level: 'Expert',       yearsOfExperience: 3 },
          { name: 'GraphQL',          level: 'Advanced',     yearsOfExperience: 2 },
          { name: 'Testing Library',  level: 'Expert',       yearsOfExperience: 3 },
          { name: 'Cypress',          level: 'Advanced',     yearsOfExperience: 2 },
        ],
        languages: [
          { name: 'English', proficiency: 'Fluent' },
          { name: 'French',  proficiency: 'Conversational' },
        ],
        experience: [
          {
            company: 'Kasha', role: 'Frontend Lead',
            startDate: '2020-09', endDate: 'Present', isCurrent: true,
            description: 'Built and owned the company-wide design system, led a team of 4 frontend engineers.',
            technologies: ['React', 'TypeScript', 'Storybook', 'Cypress', 'Tailwind CSS'],
          },
        ],
        experienceYears: 4, currentRole: 'Frontend Lead at Kasha',
        education: [
          { institution: 'Carnegie Mellon Africa', degree: 'MSc', fieldOfStudy: 'Software Engineering', startYear: 2018, endYear: 2020 },
        ],
        certifications: [
          { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon', issueDate: '2023-01' },
        ],
        projects: [
          {
            name: 'Kasha Design System',
            description: 'Component library and design token system used across 10 product teams.',
            technologies: ['React', 'TypeScript', 'Storybook', 'Tailwind CSS'],
            role: 'Creator & Maintainer',
            startDate: '2021-03',
          },
        ],
        availability: { status: 'Available', type: 'Full-time' },
        socialLinks: { github: 'https://github.com/estheruaimana', portfolio: 'https://estheruaimana.dev' },
        source: 'umurava',
      },
      {
        jobId: job1._id,
        firstName: 'Frank', lastName: 'Dushimimana',
        email: 'frank.dushimimana@email.com', phone: '+250788001003',
        headline: 'Frontend Developer – React & Firebase | Fintech Focused',
        bio: 'Frontend developer with 3 years at MTN Rwanda building dashboards and real-time customer applications. Good TypeScript skills and hands-on Firebase experience.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'React',        level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'JavaScript',   level: 'Advanced',     yearsOfExperience: 4 },
          { name: 'TypeScript',   level: 'Intermediate', yearsOfExperience: 2 },
          { name: 'Tailwind CSS', level: 'Intermediate', yearsOfExperience: 2 },
          { name: 'Firebase',     level: 'Advanced',     yearsOfExperience: 2 },
        ],
        languages: [{ name: 'English', proficiency: 'Fluent' }],
        experience: [
          {
            company: 'MTN Rwanda', role: 'Frontend Developer',
            startDate: '2021-07', endDate: 'Present', isCurrent: true,
            description: 'Built internal analytics dashboards and customer-facing real-time apps.',
            technologies: ['React', 'TypeScript', 'Firebase', 'Tailwind CSS'],
          },
        ],
        experienceYears: 3, currentRole: 'Frontend Developer at MTN Rwanda',
        education: [
          { institution: 'UR-CST', degree: 'BSc', fieldOfStudy: 'Computer Engineering', startYear: 2017, endYear: 2021 },
        ],
        projects: [
          {
            name: 'MTN Self-Service Dashboard',
            description: 'Customer-facing account management portal with real-time usage stats.',
            technologies: ['React', 'Firebase', 'Tailwind CSS'],
            role: 'Solo Developer',
            startDate: '2022-01', endDate: '2022-06',
          },
        ],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        socialLinks: { github: 'https://github.com/frankdushimimana' },
        source: 'csv',
      },
      {
        jobId: job1._id,
        firstName: 'Brian', lastName: 'Okonkwo',
        email: 'brian.okonkwo@email.com', phone: '+2348012345678',
        headline: 'Junior Frontend Developer – React | Self-taught',
        bio: 'Self-taught frontend developer with 2 years of experience. Built e-commerce UIs with React. Actively learning TypeScript and system design.',
        location: 'Lagos, Nigeria',
        skills: [
          { name: 'React',      level: 'Intermediate', yearsOfExperience: 2 },
          { name: 'JavaScript', level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'CSS',        level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'Vue.js',     level: 'Beginner',     yearsOfExperience: 1 },
        ],
        languages: [{ name: 'English', proficiency: 'Native' }],
        experience: [
          {
            company: 'Freelance', role: 'Frontend Developer',
            startDate: '2022-01', endDate: 'Present', isCurrent: true,
            description: 'Built e-commerce and portfolio sites for local businesses.',
            technologies: ['React', 'JavaScript', 'CSS', 'Figma'],
          },
        ],
        experienceYears: 2, currentRole: 'Freelance Frontend Developer',
        education: [
          { institution: 'University of Lagos', degree: 'BSc', fieldOfStudy: 'Software Engineering', startYear: 2017, endYear: 2021 },
        ],
        projects: [],
        availability: { status: 'Available', type: 'Full-time' },
        source: 'csv',
      },
      {
        jobId: job1._id,
        firstName: 'Henry', lastName: 'Mutabazi',
        email: 'henry.mutabazi@email.com', phone: '+254712345678',
        headline: 'Principal Frontend Engineer – Architecture & Performance',
        bio: '7 years of engineering experience with the last 4 focused on frontend architecture. Led the frontend guild at Equity Bank. Expert in Next.js, performance optimization, and accessibility.',
        location: 'Nairobi, Kenya',
        skills: [
          { name: 'React',        level: 'Expert',   yearsOfExperience: 6 },
          { name: 'TypeScript',   level: 'Expert',   yearsOfExperience: 5 },
          { name: 'Next.js',      level: 'Expert',   yearsOfExperience: 4 },
          { name: 'Tailwind CSS', level: 'Expert',   yearsOfExperience: 4 },
          { name: 'GraphQL',      level: 'Expert',   yearsOfExperience: 3 },
          { name: 'AWS',          level: 'Advanced', yearsOfExperience: 3 },
          { name: 'Docker',       level: 'Advanced', yearsOfExperience: 3 },
        ],
        languages: [
          { name: 'English',    proficiency: 'Native' },
          { name: 'Swahili',    proficiency: 'Native' },
        ],
        experience: [
          {
            company: 'Equity Bank', role: 'Principal Engineer',
            startDate: '2020-01', endDate: 'Present', isCurrent: true,
            description: 'Led frontend architecture for digital banking platform serving 14M+ customers across Africa.',
            technologies: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'AWS'],
          },
          {
            company: 'Safaricom', role: 'Senior Frontend Engineer',
            startDate: '2016-06', endDate: '2019-12', isCurrent: false,
            description: 'Built M-Pesa web interfaces and internal tooling.',
            technologies: ['React', 'JavaScript', 'Redux'],
          },
        ],
        experienceYears: 7, currentRole: 'Principal Engineer at Equity Bank',
        education: [
          { institution: 'University of Nairobi', degree: 'BSc', fieldOfStudy: 'Computer Science', startYear: 2012, endYear: 2016 },
        ],
        certifications: [
          { name: 'AWS Solutions Architect Associate', issuer: 'Amazon', issueDate: '2021-05' },
          { name: 'Google Professional Cloud Architect', issuer: 'Google', issueDate: '2022-03' },
        ],
        projects: [
          {
            name: 'Equity Mobile Web App',
            description: 'PWA for mobile banking with 99.9% uptime across 6 African markets.',
            technologies: ['Next.js', 'TypeScript', 'GraphQL', 'PWA'],
            role: 'Architecture Lead',
            startDate: '2020-04', endDate: '2021-08',
          },
        ],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/henry-mutabazi',
          github: 'https://github.com/henrymutabazi',
          portfolio: 'https://henrymutabazi.io',
        },
        source: 'umurava',
      },
    ]);
    await Job.findByIdAndUpdate(job1._id, { applicantCount: applicants1.length });

    /* ═══════════════════════════════════════════════════════════════
       JOB 2 — Backend Engineer
    ═══════════════════════════════════════════════════════════════ */
    const job2 = await Job.create({
      title: 'Backend Engineer',
      department: 'Engineering',
      description: 'Design and build scalable APIs and microservices that power our talent matching engine. Work closely with data and frontend teams to deliver reliable, fast, and maintainable backend systems.',
      requiredSkills: ['Node.js', 'Python', 'MongoDB', 'REST APIs', 'Docker'],
      experienceYears: 2,
      shortlistTarget: 10,
      status: 'active',
      applicantCount: 0,
    });

    const applicants2 = await TalentProfile.insertMany([
      {
        jobId: job2._id,
        firstName: 'Ibrahim', lastName: 'Sesay',
        email: 'ibrahim.sesay@email.com', phone: '+254701234567',
        headline: 'Backend Engineer – Node.js & MongoDB | High-Traffic APIs',
        bio: '5 years building scalable backend systems at Safaricom. Designed APIs handling 10M+ daily requests. Expert in Node.js microservices and MongoDB aggregation pipelines.',
        location: 'Nairobi, Kenya',
        skills: [
          { name: 'Node.js',    level: 'Expert',       yearsOfExperience: 5 },
          { name: 'Python',     level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'MongoDB',    level: 'Expert',       yearsOfExperience: 5 },
          { name: 'Docker',     level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'REST APIs',  level: 'Expert',       yearsOfExperience: 5 },
          { name: 'AWS',        level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'Redis',      level: 'Advanced',     yearsOfExperience: 3 },
        ],
        languages: [{ name: 'English', proficiency: 'Fluent' }],
        experience: [
          {
            company: 'Safaricom', role: 'Backend Engineer',
            startDate: '2019-04', endDate: 'Present', isCurrent: true,
            description: 'Designed APIs serving 10M+ daily active users. Owned the M-Pesa integration microservice.',
            technologies: ['Node.js', 'MongoDB', 'Redis', 'AWS', 'Docker'],
          },
        ],
        experienceYears: 5, currentRole: 'Backend Engineer at Safaricom',
        education: [
          { institution: 'University of Nairobi', degree: 'BSc', fieldOfStudy: 'Computer Science', startYear: 2014, endYear: 2018 },
        ],
        certifications: [
          { name: 'MongoDB Certified Developer', issuer: 'MongoDB', issueDate: '2021-08' },
        ],
        projects: [
          {
            name: 'M-Pesa Integration Service',
            description: 'Payment processing microservice handling 10M+ daily transactions.',
            technologies: ['Node.js', 'MongoDB', 'Redis', 'Docker'],
            role: 'Lead Engineer',
            startDate: '2020-06', endDate: '2021-06',
          },
        ],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        socialLinks: { github: 'https://github.com/ibrahimsesay', linkedin: 'https://linkedin.com/in/ibrahim-sesay' },
        source: 'umurava',
      },
      {
        jobId: job2._id,
        firstName: 'Omar', lastName: 'Habimana',
        email: 'omar.habimana@email.com', phone: '+250788002001',
        headline: 'Lead Backend Engineer – Node.js, TypeScript & Distributed Systems',
        bio: 'Lead backend engineer with 6 years designing distributed systems at mPharma. Deep expertise in Node.js, TypeScript, caching strategies, and search. Mentors a team of 4 engineers.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'Node.js',       level: 'Expert',   yearsOfExperience: 6 },
          { name: 'TypeScript',    level: 'Expert',   yearsOfExperience: 5 },
          { name: 'MongoDB',       level: 'Expert',   yearsOfExperience: 5 },
          { name: 'REST APIs',     level: 'Expert',   yearsOfExperience: 6 },
          { name: 'Docker',        level: 'Expert',   yearsOfExperience: 4 },
          { name: 'Redis',         level: 'Advanced', yearsOfExperience: 4 },
          { name: 'Elasticsearch', level: 'Advanced', yearsOfExperience: 3 },
          { name: 'Python',        level: 'Intermediate', yearsOfExperience: 2 },
        ],
        languages: [
          { name: 'English',     proficiency: 'Fluent' },
          { name: 'Kinyarwanda', proficiency: 'Native' },
          { name: 'French',      proficiency: 'Conversational' },
        ],
        experience: [
          {
            company: 'mPharma', role: 'Lead Backend Engineer',
            startDate: '2019-01', endDate: 'Present', isCurrent: true,
            description: 'Led backend architecture for pharmacy supply chain platform operating in 8 African countries.',
            technologies: ['Node.js', 'TypeScript', 'MongoDB', 'Redis', 'Docker', 'Elasticsearch'],
          },
          {
            company: 'BK TechHouse', role: 'Backend Developer',
            startDate: '2017-05', endDate: '2018-12', isCurrent: false,
            description: 'Built banking APIs serving thousands of daily transactions with high security requirements.',
            technologies: ['Node.js', 'MongoDB', 'REST APIs'],
          },
        ],
        experienceYears: 6, currentRole: 'Lead Backend Engineer at mPharma',
        education: [
          { institution: 'African Leadership University', degree: 'MSc', fieldOfStudy: 'Distributed Systems', startYear: 2015, endYear: 2017 },
        ],
        certifications: [
          { name: 'AWS Certified Developer Associate', issuer: 'Amazon', issueDate: '2020-11' },
          { name: 'Docker Certified Associate', issuer: 'Docker', issueDate: '2021-06' },
        ],
        projects: [
          {
            name: 'Pharmacy Supply Chain Platform',
            description: 'Distributed backend serving 8 African markets with sub-100ms p99 latency.',
            technologies: ['Node.js', 'TypeScript', 'MongoDB', 'Redis', 'Elasticsearch'],
            role: 'Lead Architect',
            startDate: '2019-03', endDate: '2021-12',
            link: 'https://mpharma.com',
          },
        ],
        availability: { status: 'Available', type: 'Full-time' },
        socialLinks: {
          github: 'https://github.com/omarhabimana',
          linkedin: 'https://linkedin.com/in/omar-habimana',
          portfolio: 'https://omarhabimana.dev',
        },
        source: 'umurava',
      },
      {
        jobId: job2._id,
        firstName: 'Kevin', lastName: 'Rurangwa',
        email: 'kevin.rurangwa@email.com', phone: '+250788002002',
        headline: 'Backend Developer – Node.js & Banking APIs',
        bio: '4 years at BK TechHouse building secure banking APIs. Strong in Node.js, MongoDB, JWT security, and CI/CD pipelines.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'Node.js',   level: 'Advanced',     yearsOfExperience: 4 },
          { name: 'Express',   level: 'Advanced',     yearsOfExperience: 4 },
          { name: 'MongoDB',   level: 'Advanced',     yearsOfExperience: 4 },
          { name: 'REST APIs', level: 'Advanced',     yearsOfExperience: 4 },
          { name: 'Docker',    level: 'Intermediate', yearsOfExperience: 2 },
          { name: 'Python',    level: 'Beginner',     yearsOfExperience: 1 },
          { name: 'CI/CD',     level: 'Intermediate', yearsOfExperience: 2 },
        ],
        languages: [{ name: 'English', proficiency: 'Fluent' }],
        experience: [
          {
            company: 'BK TechHouse', role: 'Backend Developer',
            startDate: '2020-03', endDate: 'Present', isCurrent: true,
            description: 'Built and maintained secure banking APIs for Bank of Kigali digital products.',
            technologies: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Docker'],
          },
        ],
        experienceYears: 4, currentRole: 'Backend Developer at BK TechHouse',
        education: [
          { institution: 'INES-Ruhengeri', degree: 'BSc', fieldOfStudy: 'Information Technology', startYear: 2015, endYear: 2019 },
        ],
        projects: [],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        source: 'csv',
      },
      {
        jobId: job2._id,
        firstName: 'Moses', lastName: 'Ndahiro',
        email: 'moses.ndahiro@email.com', phone: '+250788002003',
        headline: 'Senior Backend Engineer – Node.js, Python & Kubernetes',
        bio: 'Full stack-leaning backend engineer at Zipline Rwanda. 5 years building logistics and drone dispatch APIs. Expert in Docker/Kubernetes and excellent systems design.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'Node.js',    level: 'Expert',   yearsOfExperience: 5 },
          { name: 'Python',     level: 'Expert',   yearsOfExperience: 5 },
          { name: 'MongoDB',    level: 'Expert',   yearsOfExperience: 5 },
          { name: 'GraphQL',    level: 'Advanced', yearsOfExperience: 3 },
          { name: 'Docker',     level: 'Expert',   yearsOfExperience: 4 },
          { name: 'Kubernetes', level: 'Advanced', yearsOfExperience: 3 },
          { name: 'REST APIs',  level: 'Expert',   yearsOfExperience: 5 },
          { name: 'AWS',        level: 'Advanced', yearsOfExperience: 3 },
        ],
        languages: [
          { name: 'English',     proficiency: 'Fluent' },
          { name: 'Kinyarwanda', proficiency: 'Native' },
        ],
        experience: [
          {
            company: 'Zipline', role: 'Senior Backend Engineer',
            startDate: '2020-07', endDate: 'Present', isCurrent: true,
            description: 'Engineered dispatch and logistics APIs powering drone delivery in Rwanda and Ghana.',
            technologies: ['Node.js', 'Python', 'MongoDB', 'Docker', 'Kubernetes', 'AWS'],
          },
        ],
        experienceYears: 5, currentRole: 'Senior Backend Engineer at Zipline',
        education: [
          { institution: 'Carnegie Mellon Africa', degree: 'BSc', fieldOfStudy: 'Computer Science', startYear: 2014, endYear: 2018 },
        ],
        certifications: [
          { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', issueDate: '2022-09' },
        ],
        projects: [
          {
            name: 'Drone Dispatch Optimization Engine',
            description: 'Real-time route optimization API reducing delivery time by 30%.',
            technologies: ['Python', 'Node.js', 'MongoDB', 'Kubernetes'],
            role: 'Backend Lead',
            startDate: '2021-01', endDate: '2022-01',
          },
        ],
        availability: { status: 'Available', type: 'Full-time' },
        socialLinks: { github: 'https://github.com/mosesndahiro', linkedin: 'https://linkedin.com/in/moses-ndahiro' },
        source: 'umurava',
      },
      {
        jobId: job2._id,
        firstName: 'Janet', lastName: 'Nakato',
        email: 'janet.nakato@email.com', phone: '+256701234567',
        headline: 'Python Backend Developer – Django & REST APIs',
        bio: '3 years developing government digital services with Python/Django at KCCA. Solid REST API design skills. Transitioning into Node.js.',
        location: 'Kampala, Uganda',
        skills: [
          { name: 'Python',     level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'Django',     level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'REST APIs',  level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'Docker',     level: 'Intermediate', yearsOfExperience: 1 },
          { name: 'MongoDB',    level: 'Beginner',     yearsOfExperience: 1 },
          { name: 'Node.js',    level: 'Beginner',     yearsOfExperience: 0 },
        ],
        languages: [
          { name: 'English', proficiency: 'Fluent' },
          { name: 'Luganda', proficiency: 'Native' },
        ],
        experience: [
          {
            company: 'KCCA', role: 'Python Developer',
            startDate: '2021-05', endDate: 'Present', isCurrent: true,
            description: 'Built digital service APIs for Kampala Capital City Authority serving 1.5M residents.',
            technologies: ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
          },
        ],
        experienceYears: 3, currentRole: 'Python Developer at KCCA',
        education: [
          { institution: 'Makerere University', degree: 'BSc', fieldOfStudy: 'Software Engineering', startYear: 2017, endYear: 2021 },
        ],
        projects: [],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        source: 'csv',
      },
    ]);
    await Job.findByIdAndUpdate(job2._id, { applicantCount: applicants2.length });

    /* ═══════════════════════════════════════════════════════════════
       JOB 3 — Data Analyst
    ═══════════════════════════════════════════════════════════════ */
    const job3 = await Job.create({
      title: 'Data Analyst',
      department: 'Data & Analytics',
      description: 'Transform raw talent and hiring data into actionable insights. Build dashboards, run cohort analyses, and support strategic decisions with clean, well-communicated data stories.',
      requiredSkills: ['Python', 'SQL', 'Tableau', 'Excel', 'Statistics'],
      experienceYears: 2,
      shortlistTarget: 10,
      status: 'active',
      applicantCount: 0,
    });

    const applicants3 = await TalentProfile.insertMany([
      {
        jobId: job3._id,
        firstName: 'Patricia', lastName: 'Uwase',
        email: 'patricia.uwase@email.com', phone: '+250788003001',
        headline: 'Senior Data Analyst – Python, Tableau & Government Data',
        bio: '4 years analysing economic and demographic data at Rwanda Development Board. Expert in the Python data stack (pandas, numpy, matplotlib). Built Tableau dashboards used by Ministry stakeholders.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'Python',    level: 'Expert',   yearsOfExperience: 4 },
          { name: 'SQL',       level: 'Expert',   yearsOfExperience: 4 },
          { name: 'Tableau',   level: 'Expert',   yearsOfExperience: 3 },
          { name: 'Excel',     level: 'Expert',   yearsOfExperience: 5 },
          { name: 'Statistics',level: 'Advanced', yearsOfExperience: 4 },
          { name: 'Power BI',  level: 'Advanced', yearsOfExperience: 2 },
          { name: 'R',         level: 'Intermediate', yearsOfExperience: 2 },
        ],
        languages: [
          { name: 'English',     proficiency: 'Fluent' },
          { name: 'Kinyarwanda', proficiency: 'Native' },
          { name: 'French',      proficiency: 'Fluent' },
        ],
        experience: [
          {
            company: 'Rwanda Development Board', role: 'Data Analyst',
            startDate: '2020-02', endDate: 'Present', isCurrent: true,
            description: 'Built economic performance dashboards and investment tracking models used by the Cabinet.',
            technologies: ['Python', 'SQL', 'Tableau', 'Excel'],
          },
        ],
        experienceYears: 4, currentRole: 'Data Analyst at Rwanda Development Board',
        education: [
          { institution: 'University of Rwanda', degree: 'BSc', fieldOfStudy: 'Statistics', startYear: 2015, endYear: 2019 },
        ],
        certifications: [
          { name: 'Tableau Desktop Specialist', issuer: 'Tableau', issueDate: '2021-07' },
          { name: 'Google Data Analytics Certificate', issuer: 'Google', issueDate: '2022-02' },
        ],
        projects: [
          {
            name: 'Rwanda Investment Dashboard',
            description: 'Interactive Tableau dashboard tracking FDI flows used in Cabinet meetings.',
            technologies: ['Tableau', 'Python', 'SQL'],
            role: 'Lead Analyst',
            startDate: '2020-06', endDate: '2021-03',
          },
        ],
        availability: { status: 'Available', type: 'Full-time' },
        socialLinks: { linkedin: 'https://linkedin.com/in/patricia-uwase' },
        source: 'umurava',
      },
      {
        jobId: job3._id,
        firstName: 'Rachel', lastName: 'Kamau',
        email: 'rachel.kamau@email.com', phone: '+254723456789',
        headline: 'Senior Data Analyst & Data Scientist – Safaricom',
        bio: '5 years of data analysis and data science at Safaricom. Built churn prediction models and customer segmentation pipelines. Expert in Tableau and Python ML libraries.',
        location: 'Nairobi, Kenya',
        skills: [
          { name: 'Python',          level: 'Expert',   yearsOfExperience: 5 },
          { name: 'SQL',             level: 'Expert',   yearsOfExperience: 5 },
          { name: 'Tableau',         level: 'Expert',   yearsOfExperience: 4 },
          { name: 'Statistics',      level: 'Expert',   yearsOfExperience: 5 },
          { name: 'Machine Learning',level: 'Advanced', yearsOfExperience: 3 },
          { name: 'Apache Spark',    level: 'Intermediate', yearsOfExperience: 2 },
          { name: 'Excel',           level: 'Expert',   yearsOfExperience: 6 },
        ],
        languages: [
          { name: 'English', proficiency: 'Native' },
          { name: 'Swahili', proficiency: 'Fluent' },
        ],
        experience: [
          {
            company: 'Safaricom', role: 'Senior Data Analyst',
            startDate: '2018-09', endDate: 'Present', isCurrent: true,
            description: 'Led churn modelling and customer LTV segmentation for 40M+ subscriber base.',
            technologies: ['Python', 'SQL', 'Tableau', 'Spark', 'ML'],
          },
        ],
        experienceYears: 5, currentRole: 'Senior Data Analyst at Safaricom',
        education: [
          { institution: 'University of Nairobi', degree: 'MSc', fieldOfStudy: 'Data Science', startYear: 2016, endYear: 2018 },
          { institution: 'Strathmore University', degree: 'BSc', fieldOfStudy: 'Actuarial Science', startYear: 2012, endYear: 2016 },
        ],
        certifications: [
          { name: 'Microsoft Certified: Data Analyst Associate', issuer: 'Microsoft', issueDate: '2021-11' },
        ],
        projects: [
          {
            name: 'Customer Churn Prediction Model',
            description: 'ML model reducing subscriber churn by 18% through proactive retention campaigns.',
            technologies: ['Python', 'Scikit-learn', 'SQL', 'Tableau'],
            role: 'Data Science Lead',
            startDate: '2020-01', endDate: '2020-09',
          },
        ],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        socialLinks: { linkedin: 'https://linkedin.com/in/rachel-kamau', portfolio: 'https://rachelkamau.io' },
        source: 'umurava',
      },
      {
        jobId: job3._id,
        firstName: 'Uche', lastName: 'Obi',
        email: 'uche.obi@email.com', phone: '+2348023456789',
        headline: 'Analytics Engineer – dbt, Snowflake & Tableau',
        bio: 'Analytics engineer bridging data engineering and analysis at Interswitch. 4 years building data pipelines with dbt and Snowflake. Excellent Tableau dashboards and Python analysis.',
        location: 'Lagos, Nigeria',
        skills: [
          { name: 'Python',   level: 'Advanced',     yearsOfExperience: 4 },
          { name: 'SQL',      level: 'Expert',       yearsOfExperience: 4 },
          { name: 'Tableau',  level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'Excel',    level: 'Advanced',     yearsOfExperience: 5 },
          { name: 'Statistics',level: 'Intermediate',yearsOfExperience: 3 },
          { name: 'dbt',      level: 'Advanced',     yearsOfExperience: 2 },
          { name: 'Snowflake',level: 'Advanced',     yearsOfExperience: 2 },
        ],
        languages: [{ name: 'English', proficiency: 'Native' }],
        experience: [
          {
            company: 'Interswitch', role: 'Analytics Engineer',
            startDate: '2020-09', endDate: 'Present', isCurrent: true,
            description: 'Built payment analytics pipelines using dbt and Snowflake; owned executive dashboards.',
            technologies: ['dbt', 'Snowflake', 'SQL', 'Tableau', 'Python'],
          },
        ],
        experienceYears: 4, currentRole: 'Analytics Engineer at Interswitch',
        education: [
          { institution: 'University of Nigeria Nsukka', degree: 'BSc', fieldOfStudy: 'Computer Science', startYear: 2016, endYear: 2020 },
        ],
        projects: [
          {
            name: 'Payment Analytics Data Warehouse',
            description: 'End-to-end dbt/Snowflake pipeline replacing manual Excel reports for finance team.',
            technologies: ['dbt', 'Snowflake', 'SQL', 'Python'],
            role: 'Lead Engineer',
            startDate: '2021-04', endDate: '2022-01',
          },
        ],
        availability: { status: 'Open to Opportunities', type: 'Full-time' },
        socialLinks: { github: 'https://github.com/ucheobi', linkedin: 'https://linkedin.com/in/uche-obi' },
        source: 'csv',
      },
      {
        jobId: job3._id,
        firstName: 'Samuel', lastName: 'Byiringiro',
        email: 'samuel.byiringiro@email.com', phone: '+250788003002',
        headline: 'Data Analyst – Finance & Investment Analytics',
        bio: '3 years analysing loan performance and portfolio data at BRD Rwanda. Good Python and SQL skills with a solid statistics background from an applied mathematics degree.',
        location: 'Kigali, Rwanda',
        skills: [
          { name: 'Python',    level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'SQL',       level: 'Advanced',     yearsOfExperience: 3 },
          { name: 'Excel',     level: 'Expert',       yearsOfExperience: 4 },
          { name: 'Statistics',level: 'Advanced',     yearsOfExperience: 4 },
          { name: 'Tableau',   level: 'Intermediate', yearsOfExperience: 1 },
        ],
        languages: [
          { name: 'English',     proficiency: 'Fluent' },
          { name: 'Kinyarwanda', proficiency: 'Native' },
        ],
        experience: [
          {
            company: 'Rwanda Development Bank (BRD)', role: 'Data Analyst',
            startDate: '2021-03', endDate: 'Present', isCurrent: true,
            description: 'Analysed loan portfolio risk and produced quarterly performance reports for the Board.',
            technologies: ['Python', 'SQL', 'Excel'],
          },
        ],
        experienceYears: 3, currentRole: 'Data Analyst at BRD Rwanda',
        education: [
          { institution: 'UR-CMHS', degree: 'BSc', fieldOfStudy: 'Applied Mathematics', startYear: 2017, endYear: 2021 },
        ],
        projects: [],
        availability: { status: 'Available', type: 'Full-time' },
        source: 'csv',
      },
    ]);
    await Job.findByIdAndUpdate(job3._id, { applicantCount: applicants3.length });

    return NextResponse.json({
      message: '✅ Database seeded successfully with full Talent Profile Schema!',
      seeded: {
        jobs: 3,
        applicants: applicants1.length + applicants2.length + applicants3.length,
        breakdown: [
          { job: job1.title, applicants: applicants1.length },
          { job: job2.title, applicants: applicants2.length },
          { job: job3.title, applicants: applicants3.length },
        ],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// POST /api/dev/seed — adds more sample job postings without wiping existing data
export async function POST() {
  try {
    await connectDB();

    const sampleJobs = [
      {
        title: 'DevOps / Cloud Engineer',
        department: 'Infrastructure',
        description: 'Own our CI/CD pipelines, container infrastructure, and cloud costs. Drive reliability, observability, and developer experience across engineering.',
        requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
        niceToHaveSkills: ['Helm', 'Prometheus', 'Grafana', 'GitHub Actions'],
        location: 'Remote',
        experienceYears: 3,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'Machine Learning Engineer',
        department: 'AI / ML',
        description: 'Build and deploy ML models for candidate ranking, job matching, and resume parsing. Collaborate with the data team to bring predictive features into production.',
        requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'MLOps'],
        niceToHaveSkills: ['LLM', 'NLP', 'scikit-learn', 'Pandas', 'NumPy'],
        location: 'Remote',
        experienceYears: 3,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'Product Manager',
        department: 'Product',
        description: 'Define the roadmap for our AI screening product. Work with engineering, design, and customers to prioritise features that reduce time-to-hire and improve candidate quality.',
        requiredSkills: ['Product Strategy', 'User Research', 'Agile', 'Data Analysis', 'Roadmapping'],
        niceToHaveSkills: ['SQL', 'Figma', 'Mixpanel', 'Jira'],
        location: 'Kigali, Rwanda',
        experienceYears: 3,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'UX / UI Designer',
        department: 'Design',
        description: 'Shape the visual language and interaction patterns of UmuravaHire AI. Run user research, prototype rapidly, and deliver pixel-perfect designs that delight both recruiters and candidates.',
        requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Interaction Design'],
        niceToHaveSkills: ['Framer', 'Webflow', 'Motion Design', 'Accessibility'],
        location: 'Kigali, Rwanda',
        experienceYears: 2,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'Mobile Developer (React Native)',
        department: 'Mobile',
        description: 'Build and ship the UmuravaHire mobile app for iOS and Android. Own the candidate-facing experience from job browsing to application submission.',
        requiredSkills: ['React Native', 'TypeScript', 'Expo', 'iOS', 'Android'],
        niceToHaveSkills: ['Redux', 'Firebase', 'REST', 'GraphQL', 'Push Notifications'],
        location: 'Remote',
        experienceYears: 2,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'Full Stack Developer',
        department: 'Engineering',
        description: 'Work across the entire stack — from database schema design to polished React UI. Own features end-to-end in a fast-moving team.',
        requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'REST APIs'],
        niceToHaveSkills: ['Next.js', 'GraphQL', 'Docker', 'AWS', 'Tailwind CSS'],
        location: 'Remote',
        experienceYears: 2,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'Cybersecurity Analyst',
        department: 'Security',
        description: 'Protect our platform and customer data. Run penetration tests, assess vulnerabilities, and build the security culture across engineering teams.',
        requiredSkills: ['Penetration Testing', 'Network Security', 'SIEM', 'Vulnerability Assessment', 'Linux'],
        niceToHaveSkills: ['AWS Security', 'OWASP', 'Python', 'Splunk', 'ISO 27001'],
        location: 'Kigali, Rwanda',
        experienceYears: 3,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'Business Analyst',
        department: 'Operations',
        description: 'Bridge business requirements and technical execution. Gather and document requirements, map processes, and ensure product decisions are backed by solid analysis.',
        requiredSkills: ['Requirements Analysis', 'Process Mapping', 'SQL', 'Excel', 'Stakeholder Management'],
        niceToHaveSkills: ['Jira', 'Confluence', 'Power BI', 'Agile', 'Tableau'],
        location: 'Kigali, Rwanda',
        experienceYears: 2,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'Technical Writer',
        department: 'Documentation',
        description: 'Create clear, accurate technical documentation for our APIs, developer tools, and help center. Make complex features approachable for both technical and non-technical audiences.',
        requiredSkills: ['Technical Writing', 'API Documentation', 'Markdown', 'English', 'Developer Experience'],
        niceToHaveSkills: ['OpenAPI / Swagger', 'Git', 'HTML', 'Notion', 'Docusaurus'],
        location: 'Remote',
        experienceYears: 2,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
      {
        title: 'QA Engineer',
        department: 'Engineering',
        description: 'Ensure product quality through automated and manual testing. Build and maintain test suites, define QA processes, and champion a quality-first culture.',
        requiredSkills: ['Test Automation', 'Cypress', 'Jest', 'REST API Testing', 'Bug Tracking'],
        niceToHaveSkills: ['Playwright', 'Selenium', 'Python', 'Postman', 'CI/CD'],
        location: 'Remote',
        experienceYears: 2,
        shortlistTarget: 10,
        status: 'active',
        applicantCount: 0,
      },
    ];

    const created = await Job.insertMany(sampleJobs);

    return NextResponse.json({
      message: `✅ ${created.length} sample jobs added`,
      jobs: created.map((j: any) => ({ _id: j._id, title: j.title, department: j.department })),
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
