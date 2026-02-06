'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface AuthWrapperProps {
    publicContent: ReactNode;
    authenticatedContent: ReactNode;
}

export function AuthWrapper({ publicContent, authenticatedContent }: AuthWrapperProps) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
            </div>
        );
    }

    if (isAuthenticated && user) {
        return <>{authenticatedContent}</>;
    }

    return <>{publicContent}</>;
}
