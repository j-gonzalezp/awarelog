export type UserIdentity = {
    id: string;
    user_id: string;
    identity_data?: { [key: string]: any };
    provider: string;
    last_sign_in_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };

  export type AppMetadata = {
    provider?: string;
    providers?: string[];
    [key: string]: any;
  };

  export type UserMetadata = {
    [key: string]: any;
  };

  export type SupabaseAuthUser = {
    id: string;
    aud: string;
    role?: string;
    email?: string | null;
    email_confirmed_at?: string | null;
    phone?: string | null;
    phone_confirmed_at?: string | null;
    confirmed_at?: string | null;
    last_sign_in_at?: string | null;
    app_metadata: AppMetadata;
    user_metadata: UserMetadata;
    identities?: UserIdentity[];
    created_at: string;
    updated_at: string;
    is_anonymous?: boolean;
  };

  export type AppUser = SupabaseAuthUser;