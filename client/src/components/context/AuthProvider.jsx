import { createContext, useContext, useEffect, useState } from "react";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";

export const AuthContext = createContext();

export const useAuthContext = () => {
    return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [isslider, setIsslider] = useState(false);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            setLoadingUser(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoadingUser(false);
                    return;
                }

                const response = await fetch(API_ENDPOINTS.currentUser, {
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setAuthUser(userData);
                } else {
                    // Token invalid or expired, clear it
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    setAuthUser(null);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
            } finally {
                setLoadingUser(false);
            }
        };

        fetchCurrentUser();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setAuthUser(null);
    };

    return (
        <AuthContext.Provider value={{ authUser, setAuthUser, loadingUser, isslider, setIsslider, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
