import axios from 'axios';


const authApiInstance = axios.create({
    baseURL: "https://delivery-routing-system.onrender.com",
    withCredentials: true,
})

export async function register({username,password,email,role,work_location,address}){
    try {
        const response = await authApiInstance.post('/user/Signup',{
            username,
            password,
            email,
            role,
            work_location,
            address
        })
        return response.data;
    } catch (error) {
        throw error;
    }
}
export async function login({username,password}){
    try {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        
        const response = await authApiInstance.post('/user/Login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}   

export async function logout() {
    await authApiInstance.post("/user/Logout", {}, {
        withCredentials: true
    });
    return {
        message: "Logged out successfully",
        success: true,
        user: null
    }
}