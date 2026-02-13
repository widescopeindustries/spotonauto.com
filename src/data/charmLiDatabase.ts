// AUTO-GENERATED from charm.li scrape
// Run: node scripts/scrape-charm-li.js to generate the full database
// This is a placeholder - replace with actual scraped data

export interface CharmLiVehicle {
    years: number[];
    path: string;
}

// Placeholder data - replace with actual scrape results
export const CHARM_LI_DATABASE: Record<string, Record<string, CharmLiVehicle>> = {
    "Ford": {
        "Explorer": { 
            years: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Ford/1991/" 
        },
        "Escape": { 
            years: [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Ford/2001/" 
        },
        "Fusion": { 
            years: [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Ford/2006/" 
        },
        "F-150": { 
            years: [1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Ford/1982/" 
        },
    },
    "Toyota": {
        "Camry": { 
            years: [1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Toyota/1983/" 
        },
        "Corolla": { 
            years: [1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Toyota/1982/" 
        },
        "Prius": { 
            years: [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Toyota/2001/" 
        },
    },
    "Honda": {
        "Civic": { 
            years: [1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Honda/1982/" 
        },
        "Accord": { 
            years: [1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Honda/1982/" 
        },
    },
    "BMW": {
        "3 Series": { 
            years: [1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/BMW/1982/" 
        },
        "X5": { 
            years: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/BMW/2000/" 
        },
    },
    "Subaru": {
        "Outback": { 
            years: [1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013], 
            path: "/Subaru/1995/" 
        },
        "Crosstrek": { 
            years: [2013], 
            path: "/Subaru/2013/" 
        },
    },
};

// Helper to check if a specific year/make/model exists in charm.li
export function isInCharmLi(year: number, make: string, model: string): boolean {
    const makeData = CHARM_LI_DATABASE[make];
    if (!makeData) return false;
    
    const modelData = makeData[model];
    if (!modelData) return false;
    
    return modelData.years.includes(year);
}

// Get all available makes
export function getCharmLiMakes(): string[] {
    return Object.keys(CHARM_LI_DATABASE).sort();
}

// Get all models for a make
export function getCharmLiModels(make: string): string[] {
    const makeData = CHARM_LI_DATABASE[make];
    return makeData ? Object.keys(makeData).sort() : [];
}

// Get all years for a specific make/model
export function getCharmLiYears(make: string, model: string): number[] {
    const makeData = CHARM_LI_DATABASE[make];
    if (!makeData) return [];
    
    const modelData = makeData[model];
    return modelData ? modelData.years : [];
}
