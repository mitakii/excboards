export const googleClientId: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export interface GoogleSignupState {
  idToken: string;
  suggestedUsername: string;
  from?: string;
}
