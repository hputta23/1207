import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface UserProfile {
    id: string;
    nickname: string;
    avatarUrl: string;
    joinedAt: number;
    balance: number;
    theme: 'dark' | 'light';
}

interface UserProfileState {
    profile: UserProfile;
    updateProfile: (data: Partial<UserProfile>) => void;
    updateBalance: (amount: number) => void;
    resetProfile: () => void;
}

const DEFAULT_BALANCE = 100000; // $100k starting paper money

const generateDefaultProfile = (): UserProfile => {
    const id = uuidv4();
    const shortId = id.slice(0, 8);
    return {
        id,
        nickname: `Trader ${shortId}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shortId}`,
        joinedAt: Date.now(),
        balance: DEFAULT_BALANCE,
        theme: 'dark',
    };
};

export const useUserProfileStore = create<UserProfileState>()(
    persist(
        (set, get) => ({
            profile: generateDefaultProfile(),

            updateProfile: (data) => {
                const { profile } = get();
                const newProfile = { ...profile, ...data };

                // If nickname changes, update avatar automatically if it wasn't manually set
                // (Optional logic, for now let's just keep avatar sync logic simple in UI or here)
                if (data.nickname && !data.avatarUrl) {
                    newProfile.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nickname}`;
                }

                set({ profile: newProfile });
            },

            updateBalance: (amount) => {
                const { profile } = get();
                set({
                    profile: {
                        ...profile,
                        balance: profile.balance + amount,
                    },
                });
            },

            resetProfile: () => {
                set({ profile: generateDefaultProfile() });
            },
        }),
        {
            name: 'terminal-pro-profile',
        }
    )
);

// Helper for non-hook usage if needed (similar to watchlist service)
export const userProfileService = {
    getState: () => useUserProfileStore.getState(),
    updateProfile: (data: Partial<UserProfile>) => useUserProfileStore.getState().updateProfile(data),
    reset: () => useUserProfileStore.getState().resetProfile(),
};
