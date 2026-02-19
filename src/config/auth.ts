import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './database';
import { env } from './env';

export function configureAuth() {
  // Only configure if Google OAuth credentials are available
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn('[Auth] Google OAuth credentials not configured. Auth disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              nombre: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            },
            create: {
              googleId: profile.id,
              email,
              nombre: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              rol: 'tecnico', // Default role, admin must be set manually
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
