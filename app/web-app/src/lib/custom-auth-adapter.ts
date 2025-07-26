import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters";
import { db } from "~/db/client";

/**
 * Custom NextAuth adapter using direct SQL queries
 * Works with our PostgreSQL database without Drizzle
 */
export function createCustomAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      const userId = crypto.randomUUID();
      
      await db.query(`
        INSERT INTO andi_web_user (id, name, email, email_verified, image, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'teacher', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        userId,
        user.name || null,
        user.email,
        user.emailVerified || null,
        user.image || null
      ]);

      return {
        id: userId,
        name: user.name || null,
        email: user.email,
        emailVerified: user.emailVerified || null,
        image: user.image || null,
      };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const result = await db.query(
        'SELECT id, name, email, email_verified, image FROM andi_web_user WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        image: user.image,
      };
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const result = await db.query(
        'SELECT id, name, email, email_verified, image FROM andi_web_user WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        image: user.image,
      };
    },

    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
      const result = await db.query(`
        SELECT u.id, u.name, u.email, u.email_verified, u.image
        FROM andi_web_user u
        INNER JOIN andi_web_account a ON u.id = a.user_id
        WHERE a.provider = $1 AND a.provider_account_id = $2
      `, [provider, providerAccountId]);

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        image: user.image,
      };
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> {
      await db.query(`
        UPDATE andi_web_user 
        SET name = $2, email = $3, email_verified = $4, image = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [
        user.id,
        user.name || null,
        user.email || null,
        user.emailVerified || null,
        user.image || null
      ]);

      const result = await db.query(
        'SELECT id, name, email, email_verified, image FROM andi_web_user WHERE id = $1',
        [user.id]
      );

      const updatedUser = result.rows[0];
      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        emailVerified: updatedUser.email_verified,
        image: updatedUser.image,
      };
    },

    async deleteUser(userId: string): Promise<void> {
      await db.query('DELETE FROM andi_web_user WHERE id = $1', [userId]);
    },

    async linkAccount(account: AdapterAccount): Promise<void> {
      await db.query(`
        INSERT INTO andi_web_account (
          user_id, type, provider, provider_account_id, refresh_token, 
          access_token, expires_at, token_type, scope, id_token, session_state
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        account.userId,
        account.type,
        account.provider,
        account.providerAccountId,
        account.refresh_token || null,
        account.access_token || null,
        account.expires_at || null,
        account.token_type || null,
        account.scope || null,
        account.id_token || null,
        account.session_state || null
      ]);
    },

    async unlinkAccount({ providerAccountId, provider }): Promise<void> {
      await db.query(
        'DELETE FROM andi_web_account WHERE provider = $1 AND provider_account_id = $2',
        [provider, providerAccountId]
      );
    },

    async createSession(session: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      await db.query(`
        INSERT INTO andi_web_session (session_token, user_id, expires)
        VALUES ($1, $2, $3)
      `, [session.sessionToken, session.userId, session.expires]);

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const result = await db.query(`
        SELECT 
          s.session_token, s.user_id, s.expires,
          u.id, u.name, u.email, u.email_verified, u.image
        FROM andi_web_session s
        INNER JOIN andi_web_user u ON s.user_id = u.id
        WHERE s.session_token = $1
      `, [sessionToken]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id,
          expires: row.expires,
        },
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          emailVerified: row.email_verified,
          image: row.image,
        },
      };
    },

    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession | null | undefined> {
      await db.query(`
        UPDATE andi_web_session 
        SET expires = $2 
        WHERE session_token = $1
      `, [session.sessionToken, session.expires]);

      const result = await db.query(
        'SELECT session_token, user_id, expires FROM andi_web_session WHERE session_token = $1',
        [session.sessionToken]
      );

      if (result.rows.length === 0) return null;

      const updatedSession = result.rows[0];
      return {
        sessionToken: updatedSession.session_token,
        userId: updatedSession.user_id,
        expires: updatedSession.expires,
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      await db.query('DELETE FROM andi_web_session WHERE session_token = $1', [sessionToken]);
    },

    async createVerificationToken(token: VerificationToken): Promise<VerificationToken | null | undefined> {
      await db.query(`
        INSERT INTO andi_web_verification_token (identifier, token, expires)
        VALUES ($1, $2, $3)
      `, [token.identifier, token.token, token.expires]);

      return token;
    },

    async useVerificationToken({ identifier, token }): Promise<VerificationToken | null> {
      const result = await db.query(`
        DELETE FROM andi_web_verification_token 
        WHERE identifier = $1 AND token = $2
        RETURNING identifier, token, expires
      `, [identifier, token]);

      if (result.rows.length === 0) return null;

      const deletedToken = result.rows[0];
      return {
        identifier: deletedToken.identifier,
        token: deletedToken.token,
        expires: deletedToken.expires,
      };
    },
  };
}