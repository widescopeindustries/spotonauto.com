export interface ForumPostSeed {
  id: string;
  body: string;
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface ForumThreadSeed {
  id: string;
  slug: string;
  categorySlug: string;
  title: string;
  body: string;
  created_at: string;
  view_count: number;
  reply_count: number;
  isPinned: boolean;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  author: {
    display_name: string;
    avatar_url: string | null;
  };
  posts: ForumPostSeed[];
}

const STARTER_THREADS: ForumThreadSeed[] = [
  {
    id: 'thr-oil-1',
    slug: 'best-interval-for-synthetic-oil-changes',
    categorySlug: 'oil-changes-fluids',
    title: 'Best interval for synthetic oil changes on daily drivers?',
    body: 'I run mostly city miles. Manual says 10,000 miles but I am considering 6,000-7,000 for peace of mind. Curious what everyone here is doing and why.',
    created_at: '2026-04-18T14:20:00.000Z',
    view_count: 284,
    reply_count: 2,
    isPinned: true,
    vehicle_year: 2020,
    vehicle_make: 'Toyota',
    vehicle_model: 'Camry',
    author: { display_name: 'Mike T', avatar_url: null },
    posts: [
      {
        id: 'post-oil-1',
        body: 'If mostly short trips, 6k-7k is a smart middle ground. Keep records and use a quality filter.',
        created_at: '2026-04-18T17:12:00.000Z',
        author: { display_name: 'GarageVet', avatar_url: null },
      },
      {
        id: 'post-oil-2',
        body: 'I do 7,500 on my fleet sedans with oil analysis every other interval. Wear metals have stayed low.',
        created_at: '2026-04-19T01:42:00.000Z',
        author: { display_name: 'FleetOpsDan', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-oil-2',
    slug: 'coolant-flush-interval-high-mileage',
    categorySlug: 'oil-changes-fluids',
    title: 'Coolant flush interval for high-mileage SUV',
    body: '2016 Explorer with 142k miles. Coolant looks clean but service history is incomplete. Flush now or test first?',
    created_at: '2026-04-17T09:45:00.000Z',
    view_count: 196,
    reply_count: 1,
    isPinned: false,
    vehicle_year: 2016,
    vehicle_make: 'Ford',
    vehicle_model: 'Explorer',
    author: { display_name: 'Sabrina K', avatar_url: null },
    posts: [
      {
        id: 'post-oil-3',
        body: 'I would test freeze point and pH first, but with unknown history I usually flush and reset the maintenance baseline.',
        created_at: '2026-04-17T12:02:00.000Z',
        author: { display_name: 'TechLuis', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-elec-1',
    slug: 'battery-light-on-new-battery',
    categorySlug: 'engine-electrical',
    title: 'Battery light still on after new battery',
    body: 'Installed a new AGM battery yesterday but the battery warning light comes back after 5-10 minutes of driving.',
    created_at: '2026-04-19T11:30:00.000Z',
    view_count: 332,
    reply_count: 2,
    isPinned: true,
    vehicle_year: 2019,
    vehicle_make: 'Honda',
    vehicle_model: 'Accord',
    author: { display_name: 'Rico M', avatar_url: null },
    posts: [
      {
        id: 'post-elec-1',
        body: 'Check charging voltage first. If you are below 13.5V at idle with accessories off, alternator or regulator is likely the issue.',
        created_at: '2026-04-19T13:21:00.000Z',
        author: { display_name: 'VoltDoctor', avatar_url: null },
      },
      {
        id: 'post-elec-2',
        body: 'Also inspect belt tension and cable grounds. A loose ground can mimic alternator failure.',
        created_at: '2026-04-19T15:09:00.000Z',
        author: { display_name: 'Mechanic AJ', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-elec-2',
    slug: 'p0300-random-misfire-start-point',
    categorySlug: 'engine-electrical',
    title: 'P0300 random misfire - best starting point?',
    body: 'Trying not to parts-cannon this one. Would you start with plugs/coils or fuel trim analysis first?',
    created_at: '2026-04-16T21:08:00.000Z',
    view_count: 241,
    reply_count: 1,
    isPinned: false,
    vehicle_year: 2015,
    vehicle_make: 'Chevrolet',
    vehicle_model: 'Impala',
    author: { display_name: 'Chris D', avatar_url: null },
    posts: [
      {
        id: 'post-elec-3',
        body: 'Scan live data first, then quick ignition inspection. If trims are wildly positive, chase vacuum/fuel before replacing ignition parts.',
        created_at: '2026-04-16T22:40:00.000Z',
        author: { display_name: 'MasterTech R', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-brake-1',
    slug: 'pad-slap-vs-new-rotors',
    categorySlug: 'brakes-suspension',
    title: 'Pad slap vs replacing rotors together',
    body: 'Front pads are low but rotors are above min thickness. Worth replacing pads only or do full pad+rotor?',
    created_at: '2026-04-20T08:33:00.000Z',
    view_count: 417,
    reply_count: 2,
    isPinned: true,
    vehicle_year: 2018,
    vehicle_make: 'Nissan',
    vehicle_model: 'Altima',
    author: { display_name: 'Evan B', avatar_url: null },
    posts: [
      {
        id: 'post-brake-1',
        body: 'If rotors are smooth and true you can do pads only, but measure runout and clean/lube hardware properly.',
        created_at: '2026-04-20T09:45:00.000Z',
        author: { display_name: 'BrakeGuru', avatar_url: null },
      },
      {
        id: 'post-brake-2',
        body: 'For daily drivers I like fresh rotors with pads when close to limit. Better pedal feel and less comeback risk.',
        created_at: '2026-04-20T11:05:00.000Z',
        author: { display_name: 'ShopForeman T', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-brake-2',
    slug: 'front-strut-replacement-diy-safety-checklist',
    categorySlug: 'brakes-suspension',
    title: 'Front strut replacement DIY safety checklist',
    body: 'What is your non-negotiable safety checklist before compressing springs at home?',
    created_at: '2026-04-15T18:50:00.000Z',
    view_count: 189,
    reply_count: 1,
    isPinned: false,
    vehicle_year: 2014,
    vehicle_make: 'Mazda',
    vehicle_model: 'Mazda3',
    author: { display_name: 'Jen P', avatar_url: null },
    posts: [
      {
        id: 'post-brake-3',
        body: 'If spring seats are rusted or compressor quality is questionable, I outsource that step. Not worth the risk.',
        created_at: '2026-04-15T19:16:00.000Z',
        author: { display_name: 'SuspensionSam', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-cool-1',
    slug: 'overheating-in-traffic-but-fine-highway',
    categorySlug: 'heating-cooling',
    title: 'Overheating in traffic, normal temp on highway',
    body: 'Need help narrowing this down. Happens at long lights, drops back to normal once moving.',
    created_at: '2026-04-21T07:22:00.000Z',
    view_count: 273,
    reply_count: 1,
    isPinned: false,
    vehicle_year: 2017,
    vehicle_make: 'Jeep',
    vehicle_model: 'Grand Cherokee',
    author: { display_name: 'Paul R', avatar_url: null },
    posts: [
      {
        id: 'post-cool-1',
        body: 'Classic fan airflow issue. Confirm fan speed command and check for debris between condenser and radiator.',
        created_at: '2026-04-21T09:10:00.000Z',
        author: { display_name: 'CoolingTech', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-trans-1',
    slug: 'drain-and-fill-vs-full-transmission-flush',
    categorySlug: 'transmission-drivetrain',
    title: 'Drain-and-fill vs full transmission flush',
    body: 'Shop is pushing a flush service. Vehicle has 98k miles and shifts fine. Looking for unbiased advice.',
    created_at: '2026-04-18T04:38:00.000Z',
    view_count: 257,
    reply_count: 1,
    isPinned: false,
    vehicle_year: 2017,
    vehicle_make: 'Toyota',
    vehicle_model: 'RAV4',
    author: { display_name: 'Alyssa W', avatar_url: null },
    posts: [
      {
        id: 'post-trans-1',
        body: 'If service history is unknown, gradual drain-and-fill cycles are usually safer than aggressive flushes.',
        created_at: '2026-04-18T06:20:00.000Z',
        author: { display_name: 'TransmissionTom', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-tire-1',
    slug: 'uneven-inner-tire-wear-after-alignment',
    categorySlug: 'tires-wheels',
    title: 'Uneven inner tire wear after alignment',
    body: 'Had alignment done 2 months ago and still seeing inner wear. What else should I inspect?',
    created_at: '2026-04-14T15:11:00.000Z',
    view_count: 148,
    reply_count: 1,
    isPinned: false,
    vehicle_year: 2013,
    vehicle_make: 'Subaru',
    vehicle_model: 'Outback',
    author: { display_name: 'Noah C', avatar_url: null },
    posts: [
      {
        id: 'post-tire-1',
        body: 'Check for worn control arm bushings or tie-rod play. Alignment numbers can drift quickly with loose components.',
        created_at: '2026-04-14T16:05:00.000Z',
        author: { display_name: 'AlignPro', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-body-1',
    slug: 'best-way-to-remove-cloudy-headlight-haze',
    categorySlug: 'body-interior',
    title: 'Best way to remove cloudy headlight haze',
    body: 'Looking for a restoration method that actually lasts more than a few months.',
    created_at: '2026-04-13T19:02:00.000Z',
    view_count: 121,
    reply_count: 1,
    isPinned: false,
    vehicle_year: 2012,
    vehicle_make: 'Honda',
    vehicle_model: 'CR-V',
    author: { display_name: 'Mia H', avatar_url: null },
    posts: [
      {
        id: 'post-body-1',
        body: 'Key is UV sealant after sanding/polish. Without UV coat, haze returns quickly.',
        created_at: '2026-04-13T20:10:00.000Z',
        author: { display_name: 'DetailDean', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-general-1',
    slug: 'must-have-tools-for-first-time-diyers',
    categorySlug: 'general-discussion',
    title: 'Must-have tools for first-time DIYers',
    body: 'If someone had $300 total for tools, what would you prioritize first?',
    created_at: '2026-04-20T19:40:00.000Z',
    view_count: 305,
    reply_count: 2,
    isPinned: true,
    vehicle_year: null,
    vehicle_make: null,
    vehicle_model: null,
    author: { display_name: 'Admin', avatar_url: null },
    posts: [
      {
        id: 'post-general-1',
        body: 'Socket set, torque wrench, jack/stands, multimeter, trim tools. Add specialty tools only when needed.',
        created_at: '2026-04-20T20:05:00.000Z',
        author: { display_name: 'ToolNerd', avatar_url: null },
      },
      {
        id: 'post-general-2',
        body: 'Good work light and gloves are underrated. Visibility and safety matter as much as sockets.',
        created_at: '2026-04-20T20:54:00.000Z',
        author: { display_name: 'Sarah L', avatar_url: null },
      },
    ],
  },
  {
    id: 'thr-general-2',
    slug: 'forum-rules-read-before-posting',
    categorySlug: 'general-discussion',
    title: 'Forum rules: read before posting',
    body: 'Welcome to the SpotOnAuto community. Keep posts respectful, include vehicle details, and avoid dangerous advice without warnings.',
    created_at: '2026-04-12T08:00:00.000Z',
    view_count: 512,
    reply_count: 1,
    isPinned: true,
    vehicle_year: null,
    vehicle_make: null,
    vehicle_model: null,
    author: { display_name: 'Moderator', avatar_url: null },
    posts: [
      {
        id: 'post-general-3',
        body: 'Moderation note: repeated spam, unsafe instructions, or abusive behavior will be removed.',
        created_at: '2026-04-12T08:25:00.000Z',
        author: { display_name: 'Moderator', avatar_url: null },
      },
    ],
  },
];

function sortByPinnedAndDate(left: ForumThreadSeed, right: ForumThreadSeed) {
  if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
}

export function getThreadsByCategory(categorySlug: string): ForumThreadSeed[] {
  return STARTER_THREADS
    .filter((thread) => thread.categorySlug === categorySlug)
    .sort(sortByPinnedAndDate);
}

export function getThreadByCategoryAndSlug(categorySlug: string, slug: string): ForumThreadSeed | null {
  return STARTER_THREADS.find((thread) => thread.categorySlug === categorySlug && thread.slug === slug) || null;
}

export function getRecentThreads(limit = 6): ForumThreadSeed[] {
  return [...STARTER_THREADS]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, limit);
}

export function getForumCategoryCounts(categorySlug: string): { threadCount: number; postCount: number } {
  const threads = STARTER_THREADS.filter((thread) => thread.categorySlug === categorySlug);
  const postCount = threads.reduce((total, thread) => total + thread.posts.length, 0);
  return {
    threadCount: threads.length,
    postCount,
  };
}
