export const links = {
  email: 'hbavaskar6@gmail.com',
  github: 'https://github.com/HarshBavaskar',
  linkedin: 'https://linkedin.com/in/harsh-bavaskar',
  // shown on the contact card and in its vCard when set, e.g. '+91 98765 43210'
  phone: '+91 92846 25970',
};

export const early = [
  { href: 'tux/', label: 'TUX OS early access', color: '#000000', ink: '#FFFFFF', wipe: 'TUX' },
  { href: 'desk/', label: 'Desk testing', color: '#F3F1EC', ink: '#1D1C1A', wipe: 'Desk' },
];

export const chapters = [
  { id: 'top', n: '00', title: 'Index' },
  { id: 'rover', n: '01', title: 'The Rover' },
  { id: 'about', n: '02', title: 'About' },
  { id: 'path', n: '03', title: 'Path' },
  { id: 'work', n: '04', title: 'Work' },
  { id: 'toolkit', n: '05', title: 'Toolkit' },
  { id: 'record', n: '06', title: 'Record' },
  { id: 'contact', n: '07', title: 'Contact' },
];

export const subsystems = [
  { n: '01', name: 'Chassis', text: 'The structural spine. Every load path starts here.' },
  { n: '02', name: 'Drivetrain', text: 'Motors and gearing, sized for torque at crawl speed.' },
  { n: '03', name: 'Suspension', text: 'Articulation that keeps every wheel planted on broken ground.' },
  { n: '04', name: 'Wheels', text: 'Traction on sand, gravel and the obstacle course.' },
  { n: '05', name: 'Electronics', text: 'Power, motor drivers and sensors, mated to the structure.' },
  { n: '06', name: 'Controls', text: 'The teleoperation stack and LiDAR navigation.' },
];

export const stats = [
  { value: 18, suffix: '', label: 'Person build team led for NASA HERC' },
  { value: 6, suffix: '', label: 'Person dev team led at House of Hiranandani' },
  { value: 40, suffix: '+', label: 'Students mentored as Head of Robotics' },
  { value: 900, suffix: '+', label: 'Tables unified into one Snowflake platform' },
];

export const path = [
  {
    period: 'Jul 2024',
    org: 'Atlas Skilltech University',
    role: 'BTech, Computer Science (AI & ML)',
    place: 'Mumbai',
    points: ['Started a degree in AI and machine learning, and immediately went looking for something with wheels.'],
    tags: ['Class of 2028'],
  },
  {
    period: 'Sep 2024 to Apr 2025',
    org: 'Team Mushak',
    role: 'Rover Construction Lead',
    place: 'NASA HERC · RC Division',
    points: [
      "Directed the 18-member build team behind India's first and only entry in NASA's HERC RC category, across six subsystems and a 12-month cycle.",
      'Integrated the mechanical and electrical systems, from structure to motor drivers, sensors and the teleoperation stack.',
      'Cleared every mission task, from the mobility course to sample collection and LiDAR navigation.',
    ],
    tags: ['5th globally', '18 people', '6 subsystems'],
  },
  {
    period: 'Oct 2025 to Jul 2026',
    org: 'SPARC Society',
    role: 'Head of Robotics Department',
    place: 'Atlas Skilltech University',
    points: [
      "Founded the department's technical programme.",
      'Ran university-level competitions and workshops, and mentored 40+ students through robotics and research projects.',
    ],
    tags: ['40+ students', 'Founding head'],
  },
  {
    period: 'May 2026 to Present',
    org: 'House of Hiranandani',
    role: 'AI Intern · Lead Developer & Project Architect',
    place: 'Mumbai',
    points: [
      'Sole developer of the IB Diploma student information system for Hiranandani Upscale School: nine role-based modules in Next.js and TypeScript, now in daily use.',
      'Passwordless WhatsApp authentication with a four-role permission matrix, and an import pipeline that turns ManageBac gradebooks into live predictions.',
      'Leads a 6-person team under the CTO on the MIS used by the C-suite: 900+ tables from six systems in one Snowflake medallion architecture, plus a workflow orchestration engine written from scratch.',
    ],
    tags: ['9 modules', '900+ tables', '6 systems'],
  },
];

export const projects = [
  {
    id: 'desk',
    name: 'Desk',
    year: '2026',
    fresh: true,
    kind: 'Product · Web app',
    line: "Every subject's Google Classroom, on one desk.",
    text: 'Google Classroom gives every subject its own island. Desk joins them up: every deadline on one list, AI study notes written from the professor’s own lecture, exam countdowns with a revision timetable, and for faculty, a whole subject’s submissions at a glance.',
    role: 'Co-built with Anisa D’souza',
    stack: ['Installable PWA', 'Google Classroom API', 'Google Drive', 'AI study notes'],
    metric: ['2', 'roles: students and faculty, one app'],
    href: 'https://github.com/HarshBavaskar/Desk',
    hint: 'Product screens',
    early: { href: 'desk/', label: 'Join the Desk test', color: '#F3F1EC', ink: '#1D1C1A', wipe: 'Desk' },
    screens: [
      ['home', 'Home'], ['assignments', 'Tasks'], ['study-note', 'Notes'], ['exams', 'Exams'], ['faculty', 'Faculty'],
    ].map(([f, label]) => ({ type: 'img', src: `work/desk/${f}.webp`, label })),
    auto: 3400,
  },
  {
    id: 'tux',
    name: 'TUX OS',
    year: '2026',
    fresh: true,
    kind: 'AI desktop · Windows',
    line: 'A private, AI-first autonomous desktop.',
    text: 'A fullscreen shell on top of Windows: a living avatar, one command bar, and seven specialist agents sharing a single thread. A local model on your own GPU answers first and Claude takes the builds. Autopilot reads the screen as structure, and every action it takes carries a single-use permission grant.',
    role: 'Creator',
    stack: ['Python host', 'Claude Agent SDK', 'Local LLM', 'Vanilla JS shell', 'Native perception'],
    metric: ['7', 'specialist agents, one conversation'],
    hint: 'Product screens · private repo',
    early: { href: 'tux/', label: 'Get early access', color: '#000000', ink: '#FFFFFF', wipe: 'TUX' },
    screens: [
      { type: 'img', src: 'work/tux/desktop.webp', label: 'Desktop' },
      { type: 'img', src: 'work/tux/focus.webp', label: 'Focus' },
      { type: 'img', src: 'work/tux/notebook.webp', label: 'Notebook', fit: 'contain' },
      { type: 'img', src: 'work/tux/academics.webp', label: 'Academics', fit: 'contain' },
    ],
    tone: 'dark',
    auto: 3400,
  },
  {
    id: 'natlang',
    name: 'NatLang',
    year: '2026',
    kind: 'Developer tool · VS Code',
    line: 'Plain English in, idiomatic code out.',
    text: 'A VS Code transpilation engine that treats pseudocode as a first-class language. Tokens stream straight into the editor, a Java agentic backend validates structure and complexity, and providers swap between local Ollama and the cloud.',
    role: 'Systems architect',
    stack: ['TypeScript', 'VS Code API', 'Java', 'Ollama', 'SSE streaming'],
    metric: ['30+', 'target languages'],
    href: 'https://github.com/HarshBavaskar/Natlang-Extension',
  },
  {
    id: 'polaris',
    name: 'Polaris',
    year: '2026',
    kind: 'AI · Early warning',
    line: 'Seeing a cloudburst before it lands.',
    text: 'A real-time, hyperlocal cloudburst early-warning and decision system. A CNN reads the sky, an LSTM models how it is escalating, citizen reports are fused in, and authorities keep the final override. Alerts go out to phones the moment risk turns.',
    role: 'Lead AI engineer',
    stack: ['PyTorch CNN + LSTM', 'FastAPI', 'MongoDB', 'Flutter', 'Firebase alerts'],
    metric: ['2 apps', 'authority dashboard and citizen app'],
    href: 'https://github.com/HarshBavaskar/Polaris',
    hint: 'Live model · dashboard · citizen app',
    screens: [
      { type: 'demo', id: 'polaris', label: 'Model' },
      { type: 'video', label: 'Dashboard', src: 'work/polaris/dashboard.webm', poster: 'work/polaris/dashboard.webp' },
      { type: 'video', label: 'Citizen', src: 'work/polaris/citizen.webm', poster: 'work/polaris/citizen.webp', phone: true },
    ],
    tone: 'dark',
  },
  {
    id: 'airo',
    name: 'AIRO Bot',
    year: '2024',
    kind: 'Robotics · Autonomy',
    line: 'An autonomous home assistant robot.',
    text: 'A mobile robot on an Arduino Nano and ESP32 stack, with face recognition, voice control, ultrasonic obstacle avoidance and line following, and the control firmware and operator interface built alongside.',
    role: 'Lead developer',
    stack: ['ESP32', 'Arduino Nano', 'Embedded C++', 'Ultrasonic', 'Face recognition'],
    metric: ['<10 cm', 'detection error in live navigation'],
    hint: 'Move to drop obstacles',
  },
  {
    id: 'ballot',
    name: 'BlockBallot',
    year: '2026',
    kind: 'Security · Full stack',
    line: 'Votes you can prove were never touched.',
    text: 'A digital election platform on a custom in-memory blockchain. Proof-of-work mining, Merkle trees and a five-layer hash pipeline keep every ballot tamper-evident, served by Spring Boot.',
    role: 'Full-stack engineer',
    stack: ['Java', 'Spring Boot', 'Merkle trees', 'Proof of work', 'WebGL UI'],
    metric: ['5-layer', 'hash pipeline'],
    href: 'https://github.com/HarshBavaskar/BlockBallot',
    hint: 'Click to cast a vote',
  },
  {
    id: 'footfall',
    name: 'Footfall Counter',
    year: '2025',
    kind: 'Computer vision',
    line: 'Counting people, one ID at a time.',
    text: 'YOLOv8 detects every person in frame, DeepSORT keeps their identity across frames, and a virtual line counts entries and exits: analytics for malls, offices and public spaces.',
    role: 'Developer',
    stack: ['YOLOv8', 'DeepSORT', 'OpenCV', 'Python'],
    metric: ['Real-time', 'multi-object tracking'],
    href: 'https://github.com/HarshBavaskar/AI-Based-Footfall-Counter',
    hint: 'You are being tracked',
  },
  {
    id: 'prism',
    name: 'PRISMRx',
    year: '2025',
    kind: 'Healthcare AI',
    line: 'Catching the interaction before the prescription.',
    text: 'A clinical decision-support tool that predicts drug–drug interactions and side effects across a patient’s whole medication list, surfacing the risky pairs first.',
    role: 'Lead developer',
    stack: ['Machine learning', 'Python', 'Flask', 'React'],
    metric: ['Polypharmacy', 'interaction analysis'],
    href: 'https://github.com/HarshBavaskar/PrismRX-AI',
    hint: 'Hover a medicine',
  },
];

export const alsoBuilt = [
  ['ALRA', 'A self-contained Raspberry Pi assistant: camera, microphone and battery running live OpenCV vision.'],
];

// Industry names for what the work actually shows; every note points at where.
export const toolkit = [
  {
    cat: 'AI · ML',
    keys: [
      ['PyTorch', 'Polaris: a CNN reads the sky, an LSTM models escalation.'],
      ['Computer Vision', 'OpenCV pipelines in Footfall Counter and ALRA.'],
      ['Object Detection', 'YOLOv8 people detection, Footfall Counter.'],
      ['Object Tracking', 'DeepSORT keeps identities across frames, Footfall Counter.'],
      ['Image Classification', 'MobileNetV2 sky classification, Polaris.'],
      ['Time Series', 'LSTM escalation modelling, Polaris.'],
      ['Predictive Models', 'Drug-interaction risk prediction, PRISMRx.'],
      ['Real-time Inference', 'Real-time inference and model retraining.'],
    ],
  },
  {
    cat: 'GenAI',
    keys: [
      ['LLM Apps', 'TUX OS and NatLang, built around language models.'],
      ['AI Agents', 'Seven specialist agents in TUX OS; an agentic Java backend in NatLang.'],
      ['Claude Agent SDK', 'TUX OS hands its builds to Claude.'],
      ['Local LLMs', 'Ollama in NatLang; a model on your own GPU in TUX OS.'],
      ['Streaming', 'Server-sent events stream tokens into the editor, NatLang.'],
      ['AI Summaries', 'Desk writes study notes from the professor’s own lecture.'],
    ],
  },
  {
    cat: 'Software',
    keys: [
      ['Python', 'Polaris, Footfall Counter, PRISMRx, the TUX host.'],
      ['TypeScript', 'NatLang, the Hiranandani SIS.'],
      ['React', 'Interfaces, this site included.'],
      ['Next.js', 'Hiranandani SIS: nine role-based modules in daily use.'],
      ['Java', 'NatLang backend, BlockBallot.'],
      ['Spring Boot', 'BlockBallot services.'],
      ['FastAPI', 'Polaris APIs.'],
      ['Flutter', 'Polaris citizen app.'],
      ['Auth · RBAC', 'Passwordless WhatsApp sign-in and a four-role permission matrix.'],
      ['Blockchain', 'Proof of work and Merkle trees, BlockBallot.'],
    ],
  },
  {
    cat: 'Data · Cloud',
    keys: [
      ['Snowflake', '900+ tables from six systems in one platform.'],
      ['Data Pipelines', 'A medallion architecture; ManageBac gradebooks into live predictions.'],
      ['Orchestration', 'A workflow orchestration engine, written from scratch.'],
      ['SQL', 'Relational modelling in Snowflake and PostgreSQL.'],
      ['MongoDB', 'Polaris data.'],
      ['Redis', 'Caching and queues.'],
      ['Firebase', 'Polaris push alerts.'],
      ['Azure', 'Cloud deployments.'],
    ],
  },
  {
    cat: 'Embedded',
    keys: [
      ['Embedded C++', 'Control firmware for AIRO Bot and rover subsystems.'],
      ['ESP32', 'AIRO Bot control stack.'],
      ['Arduino', 'AIRO Bot and rover subsystems.'],
      ['Raspberry Pi', 'ALRA vision assistant.'],
      ['UART · I2C · SPI', 'The buses between boards and sensors.'],
      ['Motor Control', 'Motor drivers on the rover and AIRO Bot.'],
      ['Sensors', 'Ultrasonic, LiDAR and camera integration.'],
    ],
  },
  {
    cat: 'Robotics · CAD',
    keys: [
      ['Systems Integration', 'Mechanical and electrical integration of the NASA HERC rover.'],
      ['Autonomy', 'LiDAR navigation, obstacle avoidance and line following.'],
      ['Sensor Fusion', 'Fusing sensors for navigation.'],
      ['Teleoperation', 'The HERC rover’s teleoperation stack.'],
      ['SolidWorks', 'Assemblies and mechanical design.'],
      ['Fusion 360', 'Parametric CAD.'],
      ['3D Printing', 'FDM and SLA prototyping.'],
      ['DFM', 'Design for manufacture.'],
      ['Leadership', 'Led an 18-person build team and a 6-person dev team.'],
    ],
  },
];

export const record = [
  { k: 'Award', v: '5th global rank', d: 'RC Division, NASA Human Exploration Rover Challenge', y: '2025' },
  { k: 'Award', v: 'Social Media Award', d: 'University Division, NASA HERC', y: '2025' },
  { k: 'Languages', v: 'English, Hindi, Marathi', d: 'Professional · Native · Native', y: '' },
];
