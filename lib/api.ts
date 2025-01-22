import axios from 'axios';
import { NextRequest } from 'next/server';
// @ts-ignore
import jwt from 'jsonwebtoken';

export const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export async function getToken(req: NextRequest) {
    const bearer = req.headers.get('authorization');
    if (!bearer) throw new Error('Unauthorized. No token provided.');

    const token = bearer.split(' ')[1];
    if (!token) throw new Error('Unauthorized. No token provided.');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) throw new Error('Unauthorized. Invalid token.');

    return decoded;
}

// Auth functions
export async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.user;
}

export async function signup(email: string, password: string, role: string) {
    const { data } = await api.post('/auth/signup', { email, password, role });
    localStorage.setItem('token', data.token);
    return data.user;
}

export async function logout() {
    localStorage.removeItem('token');
}

// Need functions
export async function createNeed(need: {
    type: string;
    description: string;
    urgency: string;
    location: { lat: number; lng: number };
}) {
    const { data } = await api.post('/needs', need);
    return data;
}

export async function updateNeedStatus(needId: string, status: string) {
    const { data } = await api.patch(`/needs/${needId}`, { status });
    return data;
}

// Resource functions
export async function createResource(resource: {
    type: string;
    quantity: number;
    status: string;
    location: { lat: number; lng: number };
}) {
    const { data } = await api.post('/resources', resource);
    return data;
}

export async function updateResourceStatus(resourceId: string, status: string) {
    const { data } = await api.patch(`/resources/${resourceId}`, { status });
    return data;
}

// Dashboard functions
export async function getNeedsAndResources() {
    const [needsRes, resourcesRes] = await Promise.all([
        api.get('/needs'),
        api.get('/resources')
    ]);
    return {
        needs: needsRes.data,
        resources: resourcesRes.data
    };
}

// Organization functions
export async function getOrganizations() {
    const { data } = await api.get('/organizations');
    return data;
}

export async function joinOrganization(organizationId: string) {
    const { data } = await api.post(`/organizations/${organizationId}/join`);
    return data;
}

// Admin functions
export async function getUsers() {
    const { data } = await api.get('/users');
    return data;
}

export async function updateUserRole(userId: string, role: string) {
    const { data } = await api.patch(`/users/${userId}`, { role });
    return data;
}

// Helper function to get current user from token
export function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}