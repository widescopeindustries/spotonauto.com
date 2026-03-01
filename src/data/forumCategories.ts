export interface ForumCategory {
    name: string;
    slug: string;
    description: string;
    icon: string;
}

export const FORUM_CATEGORIES: ForumCategory[] = [
    {
        name: 'Oil Changes & Fluids',
        slug: 'oil-changes-fluids',
        description: 'Oil changes, coolant flushes, transmission fluid, brake fluid, and all vehicle fluids',
        icon: 'droplets',
    },
    {
        name: 'Engine & Electrical',
        slug: 'engine-electrical',
        description: 'Engine diagnostics, check engine lights, starters, alternators, batteries, and wiring',
        icon: 'zap',
    },
    {
        name: 'Brakes & Suspension',
        slug: 'brakes-suspension',
        description: 'Brake pads, rotors, calipers, shocks, struts, control arms, and steering',
        icon: 'shield',
    },
    {
        name: 'Tires & Wheels',
        slug: 'tires-wheels',
        description: 'Tire selection, rotation, balancing, alignment, and wheel maintenance',
        icon: 'circle',
    },
    {
        name: 'Body & Interior',
        slug: 'body-interior',
        description: 'Paint repair, dent removal, upholstery, dashboard, and cosmetic fixes',
        icon: 'paintbrush',
    },
    {
        name: 'Heating & Cooling',
        slug: 'heating-cooling',
        description: 'Radiators, thermostats, water pumps, heater cores, and A/C systems',
        icon: 'thermometer',
    },
    {
        name: 'Transmission & Drivetrain',
        slug: 'transmission-drivetrain',
        description: 'Manual and automatic transmissions, clutches, differentials, CV joints, and axles',
        icon: 'cog',
    },
    {
        name: 'General Discussion',
        slug: 'general-discussion',
        description: 'Tool recommendations, shop talk, vehicle buying advice, and anything auto-related',
        icon: 'message-circle',
    },
];

export function getCategoryBySlug(slug: string): ForumCategory | undefined {
    return FORUM_CATEGORIES.find((c) => c.slug === slug);
}
