import { RepairGuide, HistoryItem } from '../types';

const HISTORY_KEY = 'ai_auto_repair_history';

// The history list only stores metadata to be lightweight.
// Individual guides are stored under their own key.
const GUIDE_KEY_PREFIX = 'repair_guide_';

export const getHistory = (): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Failed to load history from localStorage", error);
    return [];
  }
};

export const saveGuide = (guide: RepairGuide): HistoryItem => {
  const historyItem: HistoryItem = {
    id: guide.id,
    title: guide.title,
    vehicle: guide.vehicle,
    timestamp: Date.now(),
  };

  try {
    // Save the full guide object
    localStorage.setItem(`${GUIDE_KEY_PREFIX}${guide.id}`, JSON.stringify(guide));

    // Update the history list
    const currentHistory = getHistory();
    // Prevent duplicates
    const updatedHistory = currentHistory.filter(item => item.id !== guide.id);
    updatedHistory.unshift(historyItem); // Add new item to the front
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    
    return historyItem;
  } catch (error) {
    console.error("Failed to save guide to localStorage", error);
    // Return the item anyway so the UI can update optimistically
    return historyItem;
  }
};

export const getGuideById = (id: string): RepairGuide | null => {
    try {
        const guideJson = localStorage.getItem(`${GUIDE_KEY_PREFIX}${id}`);
        return guideJson ? JSON.parse(guideJson) : null;
    } catch (error) {
        console.error(`Failed to load guide ${id} from localStorage`, error);
        return null;
    }
};
