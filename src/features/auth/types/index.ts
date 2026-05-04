export type UserRole =
    | 'Super-Admin'
    | 'Marketing'
    | 'Studio'
    | 'Gudang'
    | 'Produksi'
    | 'Keuangan'
    | 'Quality Control'
    | 'PPIC'
    | 'Client'; // External

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: string; // Flattened role string from API
    role_id?: number;
    divisi?: string; // Division name
    divisi_id?: number;
    roles?: { name: string }[]; // Backward compatibility
    roles_list?: string[];
    avatar_url?: string;
    // External specific
    client_id?: number | null;
    // ACL fields
    client_categories?: string[];
    permissions?: string[];
    account_status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
    rejection_reason?: string | null;
    approved_at?: string | null;
    created_at?: string;
}

// 1. Standard Success Response (Token Received)
export interface AuthSuccessResponse {
    status: 'success';
    message: string;
    data: {
        access_token: string;
        token_type: string;
        user: User;
    };
}

// 2. 2FA Required Response (No Token yet)
export interface TwoFactorRequiredResponse {
    status: 'success';
    message: string;
    data: {
        requires_2fa: true;
        user_id: number;
        channel: 'email' | 'whatsapp';
    };
}

// Union Type for Login
export type LoginResponse = AuthSuccessResponse | TwoFactorRequiredResponse;

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface TwoFactorVerifyRequest {
    user_id: number;
    otp: string;
}

export interface RegisterInternalRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    divisi?: string;
}

export interface RegisterExternalRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    client_id: number;
    category_ids?: number[];
}
