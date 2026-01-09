import React, { createContext, useContext, useState } from 'react';
import { auditService } from '../services/audit-service';

export type UserRole = 'TRADER' | 'VIEWER' | 'ADMIN';

export interface User {
    id: string;
    username: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (username: string) => {
        // Mock Login Logic
        const newUser: User = {
            id: `user-${Math.floor(Math.random() * 1000)}`,
            username,
            role: 'TRADER' // Default role for now
        };
        setUser(newUser);
        auditService.log('LOGIN', { success: true }, newUser.id);
    };

    const logout = () => {
        if (user) {
            auditService.log('LOGOUT', { duration: 'session_end' }, user.id);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
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
