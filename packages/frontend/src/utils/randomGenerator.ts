import { SkillType, TaskType } from '@workforce/shared';

// Configuration for random generation
export interface GeneratorConfig {
  staffCount?: number;
  taskCount?: number;
  centerLat?: number;
  centerLng?: number;
  radius?: number; // in degrees, roughly ~0.1 = 11km
}

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Quinn',
  'Avery', 'Blake', 'Cameron', 'Drew', 'Ellis', 'Finley', 'Harper', 'Jamie',
  'Kai', 'Logan', 'Max', 'Noah', 'Parker', 'Reese', 'Sage', 'Skylar'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'White', 'Harris', 'Clark'
];

const SKILLS: SkillType[] = ['medical', 'logistics', 'survey', 'rescue', 'engineering', 'communication'];

const TASK_TYPES: TaskType[] = ['Survey', 'Distribution', 'Medical', 'Rescue', 'Infrastructure'];

// Default config
const DEFAULT_CONFIG: Required<GeneratorConfig> = {
  staffCount: 10,
  taskCount: 15,
  centerLat: 12.9716, // Bangalore, India
  centerLng: 77.5946,
  radius: 0.1,
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function generateRandomLocation(centerLat: number, centerLng: number, radius: number) {
  // Generate random point within circle
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * radius;

  return {
    lat: parseFloat((centerLat + r * Math.cos(angle)).toFixed(4)),
    lng: parseFloat((centerLng + r * Math.sin(angle)).toFixed(4)),
  };
}

export function generateRandomStaff(config: GeneratorConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const staffMembers = [];

  for (let i = 0; i < finalConfig.staffCount; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const skillCount = randomInt(1, 3);
    const skills = randomChoices(SKILLS, skillCount);
    const location = generateRandomLocation(
      finalConfig.centerLat,
      finalConfig.centerLng,
      finalConfig.radius
    );

    staffMembers.push({
      name: `${firstName} ${lastName}`,
      skills,
      location,
      status: 'idle' as const,
      availability: true,
      capacity: randomInt(2, 5),
    });
  }

  return staffMembers;
}

export function generateRandomTasks(config: GeneratorConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const tasks = [];

  for (let i = 0; i < finalConfig.taskCount; i++) {
    const type = randomChoice(TASK_TYPES);
    const skillCount = randomInt(1, 2);
    const requiredSkills = randomChoices(SKILLS, skillCount);
    const location = generateRandomLocation(
      finalConfig.centerLat,
      finalConfig.centerLng,
      finalConfig.radius
    );

    tasks.push({
      type,
      requiredSkills,
      urgency: randomInt(1, 10),
      location,
      estimatedDuration: randomInt(30, 180),
    });
  }

  return tasks;
}
