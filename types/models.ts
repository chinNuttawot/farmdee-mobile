export type Role = 'owner' | 'worker';
export interface User { id: number; email: string; name: string; role: Role; }
export interface Client { id: number; name: string; phone?: string; address?: string; }
export interface Task { id: number; title: string; clientId?: number; startDate?: string; dueDate?: string; price?: number; status: 'todo'|'doing'|'done'; notes?: string; }
export interface Expense { id: number; label: string; amount: number; date: string; }
export interface JobCost { id: number; taskId: number; kind: 'labor'|'material'|'transport'; amount: number; note?: string; date: string; }
export interface Invoice { id: number; clientId: number; taskId?: number; total: number; tax?: number; createdAt: string; pdfPath?: string; }
export interface Points { id: number; userId: number; points: number; reason?: string; createdAt: string; }
