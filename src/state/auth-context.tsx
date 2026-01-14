import React, { createContext, useContext, useState } from 'react';
import { auditService } from '../services/audit-service';

export type UserRole = 'TRADER' | 'VIEWER' | 'ADMIN';

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    subscription: 'free' | 'pro' | 'enterprise';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock validation
            if (!email || !password) {
                throw new Error('Please enter both email and password.');
            }

            // Mock Login Success
            // In a real app, we'd validate against backend
            const username = email.split('@')[0];
            const newUser: User = {
                id: `user-${Math.floor(Math.random() * 10000)}`,
                username: username.charAt(0).toUpperCase() + username.slice(1),
                email: email,
                role: 'TRADER',
                subscription: 'pro' // Default to pro for demo
            };
            setUser(newUser);
            auditService.log('LOGIN', { success: true, email }, newUser.id);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            auditService.log('LOGIN_FAILED', { error: err.message }, 'guest');
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (!email || !password || !name) {
                throw new Error('All fields are required.');
            }

            // Mock Signup Success
            const newUser: User = {
                id: `user-${Math.floor(Math.random() * 10000)}`,
                username: name,
                email: email,
                role: 'TRADER',
                subscription: 'free' // New users start free
            };
            setUser(newUser);
            auditService.log('SIGNUP', { success: true, email }, newUser.id);
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        if (user) {
            auditService.log('LOGOUT', { duration: 'session_end' }, user.id);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, signup, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
