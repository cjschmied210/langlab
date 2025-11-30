export type UserRole = 'teacher' | 'student';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    createdAt: Date;
}
