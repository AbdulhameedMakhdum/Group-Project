import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseService } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firebaseService.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login: (email, password) => firebaseService.login(email, password),
        register: (email, password) => firebaseService.register(email, password),
        logout: () => firebaseService.logout(),
        googleLogin: () => firebaseService.googleLogin(),
        resetPassword: (email) => firebaseService.resetPassword(email),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
