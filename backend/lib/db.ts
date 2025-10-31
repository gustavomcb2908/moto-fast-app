import AsyncStorage from '@react-native-async-storage/async-storage';

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

const DB_PREFIX = 'motofast_db_';

class Database {
  async getUsers(): Promise<User[]> {
    try {
      const data = await AsyncStorage.getItem(DB_PREFIX + 'users');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('DB getUsers error:', error);
      return [];
    }
  }

  async setUsers(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_PREFIX + 'users', JSON.stringify(users));
    } catch (error) {
      console.error('DB setUsers error:', error);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  async createUser(user: User): Promise<User> {
    const users = await this.getUsers();
    users.push(user);
    await this.setUsers(users);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
    await this.setUsers(users);
    return users[index];
  }

  async getRefreshTokens(): Promise<RefreshToken[]> {
    try {
      const data = await AsyncStorage.getItem(DB_PREFIX + 'refresh_tokens');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('DB getRefreshTokens error:', error);
      return [];
    }
  }

  async setRefreshTokens(tokens: RefreshToken[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_PREFIX + 'refresh_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('DB setRefreshTokens error:', error);
    }
  }

  async createRefreshToken(token: RefreshToken): Promise<RefreshToken> {
    const tokens = await this.getRefreshTokens();
    tokens.push(token);
    await this.setRefreshTokens(tokens);
    return token;
  }

  async getRefreshTokenByHash(hash: string): Promise<RefreshToken | null> {
    const tokens = await this.getRefreshTokens();
    return tokens.find(t => t.token_hash === hash && !t.revoked_at) || null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const tokens = await this.getRefreshTokens();
    const index = tokens.findIndex(t => t.token_hash === tokenHash);
    if (index !== -1) {
      tokens[index].revoked_at = new Date().toISOString();
      await this.setRefreshTokens(tokens);
    }
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const tokens = await this.getRefreshTokens();
    const now = new Date().toISOString();
    const updated = tokens.map(t => 
      t.user_id === userId && !t.revoked_at ? { ...t, revoked_at: now } : t
    );
    await this.setRefreshTokens(updated);
  }

  async getOneTimeTokens(): Promise<OneTimeToken[]> {
    try {
      const data = await AsyncStorage.getItem(DB_PREFIX + 'onetime_tokens');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('DB getOneTimeTokens error:', error);
      return [];
    }
  }

  async setOneTimeTokens(tokens: OneTimeToken[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_PREFIX + 'onetime_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('DB setOneTimeTokens error:', error);
    }
  }

  async createOneTimeToken(token: OneTimeToken): Promise<OneTimeToken> {
    const tokens = await this.getOneTimeTokens();
    tokens.push(token);
    await this.setOneTimeTokens(tokens);
    return token;
  }

  async getOneTimeToken(tokenHash: string, type: 'verify' | 'reset'): Promise<OneTimeToken | null> {
    const tokens = await this.getOneTimeTokens();
    return tokens.find(t => 
      t.token_hash === tokenHash && 
      t.type === type && 
      !t.used_at &&
      new Date(t.expires_at) > new Date()
    ) || null;
  }

  async markOneTimeTokenUsed(tokenHash: string): Promise<void> {
    const tokens = await this.getOneTimeTokens();
    const index = tokens.findIndex(t => t.token_hash === tokenHash);
    if (index !== -1) {
      tokens[index].used_at = new Date().toISOString();
      await this.setOneTimeTokens(tokens);
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    
    const otTokens = await this.getOneTimeTokens();
    const validOT = otTokens.filter(t => new Date(t.expires_at) > now || t.used_at);
    await this.setOneTimeTokens(validOT);

    const refreshTokens = await this.getRefreshTokens();
    const validRT = refreshTokens.filter(t => new Date(t.expires_at) > now || t.revoked_at);
    await this.setRefreshTokens(validRT);
  }
}

export const db = new Database();
