
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryDisplay from '../components/HistoryDisplay';
import { getHistory, getGuideById } from '../services/storageService';
import { HistoryItem } from '../types';
import SEOHead from '../components/seo/SEOHead';
import { useAuth } from '../contexts/AuthContext';

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const navigate = useNavigate();
    const { user } = useAuth(); // Ensure we react to auth changes

    useEffect(() => {
        if (user) {
            setHistory(getHistory());
        } else {
            setHistory([]);
        }
    }, [user]);

    const handleViewHistoryItem = (id: string) => {
        // We need to reconstruct the URL from the saved guide to navigate there
        const guide = getGuideById(id);
        if (guide) {
            // Assume ID format matches URL slug format or guide has fields
            // Guide object has vehicle "Year Make Model".
            // ID is "year-make-model-task-slug"
            // We can just use the ID components if we saved them well, 
            // OR better: navigate to the guide URL if we can reconstruct it.
            // Actually, the storage Service saves the full guide.
            // We can just pass the state or rely on ID.
            // The ID format in `geminiService` is `${year}-${make}-${model}-${title}`.
            // Let's parse the ID or clean the title?
            // Simpler: Just allow the GuidePage to load from ID if we passed a specific route?
            // No, keep SEO URLs.
            // Parse the guide's vehicle string: "2010 Honda Civic"
            const parts = guide.vehicle.split(' ');
            const year = parts[0];
            const make = parts[1]; // What if make is "Land Rover"?
            // This is the issue with simple split.
            // Ideally we save structured data.
            // For now, let's just use the guide ID which IS the slug!
            // The generated ID in geminiService line 204: 
            // `${vehicle.year}-${vehicle.make}-${vehicle.model}-${textData.title}`.toLowerCase().replace(/\s+/g, '-')
            // This is `year-make-model-task`.
            // My route is `/repair/:year/:make/:model/:task`.
            // I need to split the ID.
            // Or I can change the route to `/guide/:guideId`? 
            // No, SEO wants keywords.

            // Hack for now: navigate to a generic loader with state?
            // Or just Try to parse.
            // Let's navigate to `/repair/saved/${id}`? Start simple.
            // Wait, I can just use the structured data in `guide` object if I have it.
            // I have `guide.vehicle` and `guide.title`.
            // I'll format them.
            const v = guide.vehicle.toLowerCase().replace(/\s+/g, '-'); // 2010-honda-civic
            const t = guide.title.toLowerCase().replace(/\s+/g, '-');
            // This isn't perfect for `year/make/model` route.
            // I'll update App router to ALSO accept `/repair/:slug` as a fallback?
            // Or just redirect to the dash-separated URL and handle it in GuidePage?
            // Let's use `/repair/saved/${id}` and have GuidePage handle that?
            // No, stick to the plan.

            // Reconstruct manually:
            // Guide doesn't store separate make/model.
            // I will use regex to split "YYYY Make Model".
            const match = guide.vehicle.match(/^(\d{4})\s+(.+?)\s+(.+)$/);
            if (match) {
                const [_, y, mk, md] = match;
                const mkSlug = mk.toLowerCase().replace(/\s+/g, '-');
                const mdSlug = md.toLowerCase().replace(/\s+/g, '-');
                const tSlug = guide.title.toLowerCase().replace(/\s+/g, '-');
                navigate(`/repair/${y}/${mkSlug}/${mdSlug}/${tSlug}`);
            } else {
                // Fallback
                navigate('/');
            }
        }
    };

    return (
        <>
            <SEOHead title="Repair History | AI Auto Repair" description="Your saved repair guides." />
            <div className="p-4 md:p-8 flex justify-center w-full">
                <HistoryDisplay history={history} onViewItem={handleViewHistoryItem} onBack={() => navigate('/')} />
            </div>
        </>
    );
};

export default HistoryPage;
