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

// Only fetch cars, trucks, and SUVs (no motorcycles, ATVs, trailers, etc.)
const AUTO_VEHICLE_TYPES = [
    'Passenger Car',
    'Truck',
    'Multipurpose Passenger Vehicle (MPV)',
];

export const fetchModels = async (make: string, year?: string): Promise<string[]> => {
    if (!make) return [];
    const cacheKey = `${make}-${year || 'all'}`;

    if (modelCache[cacheKey]) {
        return modelCache[cacheKey];
    }

    try {
        let allModels: string[] = [];

        if (year) {
            // Fetch all 3 vehicle types in parallel to filter out motorcycles/ATVs
            const responses = await Promise.all(
                AUTO_VEHICLE_TYPES.map(type =>
                    fetch(
                        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/${encodeURIComponent(type)}?format=json`
                    ).then(r => r.json()).catch(() => ({ Results: [] }))
                )
            );
            for (const data of responses) {
                if (data.Results) {
                    allModels.push(...data.Results.map((item: any) => item.Model_Name));
                }
            }
        } else {
            const response = await fetch(
                `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`
            );
            const data = await response.json();
            if (data.Results) {
                allModels = data.Results.map((item: any) => item.Model_Name);
            }
        }

        const uniqueModels = Array.from(new Set(allModels)).sort() as string[];
        modelCache[cacheKey] = uniqueModels;
        return uniqueModels;
    } catch (error) {
        console.error("Failed to fetch models", error);
        return [];
    }
};
