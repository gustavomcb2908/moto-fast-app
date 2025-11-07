export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  email_verified: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  documents: {
    id_document?: string;
    driver_license?: string;
    proof_of_address?: string;
    selfie?: string;
  };
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  device?: string;
  revoked_at?: string;
  created_at: string;
}

export interface OneTimeToken {
  id: string;
  user_id: string;
  token_hash: string;
  type: 'verify' | 'reset';
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin';
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target?: string;
  created_at: string;
}

// In-memory fallback store for server runtime
// IMPORTANT: This is a temporary, process-local store. It resets on server restart.
const mem = {
  users: [] as User[],
  refresh_tokens: [] as RefreshToken[],
  onetime_tokens: [] as OneTimeToken[],
  admin_users: [] as AdminUser[],
  audit_logs: [] as AuditLog[],
};

class Database {
  async getUsers(): Promise<User[]> {
    return [...mem.users];
  }

  async setUsers(users: User[]): Promise<void> {
    mem.users = [...users];
  }

  async deleteUser(id: string): Promise<boolean> {
    const before = mem.users.length;
    mem.users = mem.users.filter(u => u.id !== id);
    return mem.users.length !== before;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase();
    return mem.users.find(u => u.email.toLowerCase() === lower) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return mem.users.find(u => u.id === id) || null;
  }

  async createUser(user: User): Promise<User> {
    mem.users.push(user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const idx = mem.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    mem.users[idx] = { ...mem.users[idx], ...updates, updated_at: new Date().toISOString() };
    return mem.users[idx];
  }

  async getRefreshTokens(): Promise<RefreshToken[]> {
    return [...mem.refresh_tokens];
  }

  async setRefreshTokens(tokens: RefreshToken[]): Promise<void> {
    mem.refresh_tokens = [...tokens];
  }

  async createRefreshToken(token: RefreshToken): Promise<RefreshToken> {
    mem.refresh_tokens.push(token);
    return token;
  }

  async getRefreshTokenByHash(hash: string): Promise<RefreshToken | null> {
    return mem.refresh_tokens.find(t => t.token_hash === hash && !t.revoked_at) || null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const idx = mem.refresh_tokens.findIndex(t => t.token_hash === tokenHash);
    if (idx !== -1) mem.refresh_tokens[idx].revoked_at = new Date().toISOString();
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const now = new Date().toISOString();
    mem.refresh_tokens = mem.refresh_tokens.map(t =>
      t.user_id === userId && !t.revoked_at ? { ...t, revoked_at: now } : t
    );
  }

  async getOneTimeTokens(): Promise<OneTimeToken[]> {
    return [...mem.onetime_tokens];
  }

  async setOneTimeTokens(tokens: OneTimeToken[]): Promise<void> {
    mem.onetime_tokens = [...tokens];
  }

  async createOneTimeToken(token: OneTimeToken): Promise<OneTimeToken> {
    mem.onetime_tokens.push(token);
    return token;
  }

  async getOneTimeToken(tokenHash: string, type: 'verify' | 'reset'): Promise<OneTimeToken | null> {
    const now = new Date();
    return (
      mem.onetime_tokens.find(t =>
        t.token_hash === tokenHash && t.type === type && !t.used_at && new Date(t.expires_at) > now
      ) || null
    );
  }

  async markOneTimeTokenUsed(tokenHash: string): Promise<void> {
    const idx = mem.onetime_tokens.findIndex(t => t.token_hash === tokenHash);
    if (idx !== -1) mem.onetime_tokens[idx].used_at = new Date().toISOString();
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    mem.onetime_tokens = mem.onetime_tokens.filter(t => new Date(t.expires_at) > now || t.used_at);
    mem.refresh_tokens = mem.refresh_tokens.filter(t => new Date(t.expires_at) > now || t.revoked_at);
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return [...mem.admin_users];
  }

  async setAdminUsers(admins: AdminUser[]): Promise<void> {
    mem.admin_users = [...admins];
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const lower = email.toLowerCase();
    return mem.admin_users.find(a => a.email.toLowerCase() === lower) || null;
  }

  async createAdminUser(admin: AdminUser): Promise<AdminUser> {
    mem.admin_users.push(admin);
    return admin;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return [...mem.audit_logs];
  }

  async setAuditLogs(logs: AuditLog[]): Promise<void> {
    mem.audit_logs = [...logs];
  }

  async addAuditLog(log: AuditLog): Promise<AuditLog> {
    mem.audit_logs.push(log);
    return log;
  }
}

export const db = new Database();
