import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { prisma } from './database';
import { env } from './env';

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

          // Timeout to prevent infinite hang if DB adapter stalls
          const timeoutMs = 15000;
          const upsertPromise = prisma.user.upsert({
            where: { microsoftId },
            update: {
              nombre,
              avatar,
            },
            create: {
              microsoftId,
              email,
              nombre,
              avatar,
              rol: 'tecnico',
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`DB upsert timed out after ${timeoutMs}ms`)), timeoutMs),
          );

          const user = await Promise.race([upsertPromise, timeoutPromise]);
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
