import { axiosInstance } from "@/lib/axios";
import {
    LoginCredentials,
    LoginResponse,
    User,
    TwoFactorVerifyRequest,
    AuthSuccessResponse,
    RegisterInternalRequest,
    RegisterExternalRequest
} from "../types";

export const authService = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const { data } = await axiosInstance.post<LoginResponse>('/login', credentials);
        return data;
    },

    verify2FA: async (payload: TwoFactorVerifyRequest): Promise<AuthSuccessResponse> => {
        const { data } = await axiosInstance.post<AuthSuccessResponse>('/2fa/verify', payload);
        return data;
    },

    logout: async () => {
        return axiosInstance.post('/logout');
    },

    getProfile: async (): Promise<{ data: User }> => {
        const { data } = await axiosInstance.get<{ data: User }>('/user');
        return data;
    },

    registerInternal: async (payload: RegisterInternalRequest) => {
        const { data } = await axiosInstance.post('/internal/register', payload);
        return data;
    },

    registerExternal: async (payload: RegisterExternalRequest) => {
        const { data } = await axiosInstance.post('/external/register', payload);
        return data;
    }
};
