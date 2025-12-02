export interface Class {
    id: string;
    name: string;
    teacherId: string;
    teacherName?: string;
    joinCode: string;
    studentIds: string[];
    createdAt: any; // Firestore Timestamp
    description?: string;
}

export interface Assignment {
    id: string;
    classId: string;
    title: string;
    author?: string; // <--- Added this field
    dueDate: any;
    status: 'active' | 'draft' | 'archived';
    content: string;
    createdAt: any;
}
