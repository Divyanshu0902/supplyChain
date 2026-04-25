import { useDispatch } from "react-redux";
import { setUser, setLoading, setError } from "../state/auth.slice.js";
import { register, login, logout } from "../service/auth.api.js";

export function useAuth() {
    const dispatch = useDispatch();

    const handleRegister = async ({username,password,email,role,work_location,address}) => {
        dispatch(setLoading(true));
        try {
            const response = await register({username,password,email,role,work_location,address});
            dispatch(setUser(response.user));
            dispatch(setLoading(false));
            return response;
        } catch (error) {
            dispatch(setLoading(false));
            dispatch(setError(error.message));
            throw error;
        }
    }
    const handleLogin = async ({username,password}) => {
        dispatch(setLoading(true));
        try {
            const response = await login({username,password});
            dispatch(setUser(response.user));
            dispatch(setLoading(false));
            return response;
        } catch (error) {
            dispatch(setLoading(false));
            dispatch(setError(error.message));
            throw error;
        }
    }   

    const handleLogout = async () => {
        dispatch(setLoading(true));
        try {
            const response = await logout();
            dispatch(setUser(null));
            dispatch(setLoading(false));
            return response;
        } catch (error) {
            dispatch(setLoading(false));
            dispatch(setError(error.message));
            throw error;
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleLogout
    }
}