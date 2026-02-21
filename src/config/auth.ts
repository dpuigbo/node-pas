import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { prisma } from './database';
import { env } from './env';

/** Upsert user with timeout and retry */
async function upsertUserWithRetry(
  microsoftId: string,
  email: string,
  nombre: string,
  avatar: string | null,
  retries = 2,
): Promise<any> {
  const timeoutMs = 10000;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const upsertPromise = prisma.user.upsert({
        where: { microsoftId },
        update: { nombre, avatar },
        create: { microsoftId, email, nombre, avatar, rol: 'tecnico' },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`DB upsert timed out after ${timeoutMs}ms (attempt ${attempt}/${retries})`)), timeoutMs),
      );

      const user = await Promise.race([upsertPromise, timeoutPromise]);
      return user;
    } catch (err) {
      console.error(`[Auth] Upsert attempt ${attempt}/${retries} failed:`, (err as Error).message);
      if (attempt === retries) throw err;
      // Small wait before retry
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export function configureAuth() {
  if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) {
    console.warn('[Auth] Microsoft OAuth credentials not configured. Auth disabled.');
    return;
  }

  passport.use(
    new MicrosoftStrategy(
      {
        clientID: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        callbackURL: env.MICROSOFT_CALLBACK_URL,
        tenant: env.MICROSOFT_TENANT_ID || 'common',
        scope: ['user.read', 'profile', 'email', 'openid'],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: Function) => {
        try {
          const email = profile._json?.email || profile.emails?.[0]?.value || profile.upn || profile._json?.preferred_username;
          if (!email) {
            return done(new Error('No se encontro email en el perfil de Microsoft'));
          }

          const microsoftId = profile.oid || profile.id;
          const nombre = profile.displayName || email.split('@')[0];
          const avatar = null;

          console.log('[Auth] Microsoft callback — upserting user:', { microsoftId, email, nombre });

          const user = await upsertUserWithRetry(microsoftId, email, nombre, avatar);
          console.log('[Auth] User upserted successfully:', user.id);

          done(null, user);
        } catch (error) {
          console.error('[Auth] Microsoft callback error:', error);
          done(error as Error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
