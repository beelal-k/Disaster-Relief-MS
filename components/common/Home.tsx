"use client"

import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react'
import { api } from '@/lib/api';
import NeedForm from '../forms/NeedForm';


const Map = dynamic(() => import('@/components/common/Map'), {
    ssr: false,
    loading: () => <p>Loading map...</p>
});

const HomeScreen = () => {
    const { user } = useAuthStore();
    const [needs, setNeeds] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const needsRes = await api.get('/needs');
                const resourcesRes = await api.get('/resources');
                setNeeds(needsRes.data);
                setResources(resourcesRes.data);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, []);

    return (
        <>
            {user?.role === 'individual' && <NeedForm />}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <div className='flex justify-between items-center'>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Live Crisis Map</h2>
                    <p>{user?.email}</p>
                </div>
                <Map />
            </div>
        </>
    )
}

export default HomeScreen