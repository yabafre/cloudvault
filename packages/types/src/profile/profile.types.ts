export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface UpdateProfileInput {
  displayName: string;
}
