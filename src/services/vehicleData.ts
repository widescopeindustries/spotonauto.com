export const COMMON_MAKES = [
    "Acura", "Alfa Romeo", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
    "Dodge", "Fiat", "Ford", "GMC", "Genesis", "Honda", "Hyundai", "Infiniti", "Jaguar",
    "Jeep", "Kia", "Land Rover", "Lexus", "Lincoln", "Lucid", "Maserati", "Mazda",
    "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Polestar", "Porsche", "Ram",
    "Rivian", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

export const getYears = () => {
    const currentYear = new Date().getFullYear() + 1;
    const years = [];
    for (let i = currentYear; i >= 1980; i--) {
        years.push(i.toString());
    }
    return years;
};

// Simple cache for models to avoid repetitive API calls
const modelCache: Record<string, string[]> = {};

export const fetchModels = async (make: string, year?: string): Promise<string[]> => {
    if (!make) return [];
    const cacheKey = `${make}-${year || 'all'}`;

    if (modelCache[cacheKey]) {
        return modelCache[cacheKey];
    }

    try {
        // NHTSA API to get models for a make
        // If year is provided, it's more accurate, but 'getmodelsformake' is simpler/faster for general lists.
        // Let's use getmodelsformakeyear if year exists, else getmodelsformake
        let url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`;

        if (year) {
            url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.Results) {
            const models = data.Results.map((item: any) => item.Model_Name).sort();
            // Deduplicate
            const uniqueModels = Array.from(new Set(models)) as string[];
            modelCache[cacheKey] = uniqueModels;
            return uniqueModels;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch models", error);
        return [];
    }
};
