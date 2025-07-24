import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        await connectToDatabase();

        const user = await User.findOne({
          $or: [
            { email: credentials.email.toLowerCase() },
            { username: credentials.email.toLowerCase() },
          ],
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        if (!user.password) {
          throw new Error('Email registered via Google. Use Google to sign in.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(), // This will be objectIDMongo
          email: user.email,
          username: user.username,
        };
      },
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: profile.email });
        if (!existingUser) {
          const newUser = await User.create({
            username: profile.name,
            email: profile.email,
            googleId: profile.sub,
          });
          user.id = newUser._id.toString(); // objectIDMongo
        } else {
          user.id = existingUser._id.toString(); // objectIDMongo
          user.username = existingUser.username;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id; // objectIDMongo
        token.email = user.email;
        token.username = user.username || user.name;
        token.objectIDMongo = user.id; // explicitly add it as objectIDMongo too
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          username: token.username,
        };
        session.objectIDMongo = token.objectIDMongo; // MongoDB ID here
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET_KEY,
};

export default authOptions;
