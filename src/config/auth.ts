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
        tenant: 'common',
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

          const user = await prisma.user.upsert({
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

          done(null, user);
        } catch (error) {
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
