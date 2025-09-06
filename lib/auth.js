import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_LOGIN_URL = `${process.env.NEXT_PUBLIC_API_URL}auth/login`;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "email",
          type: "email",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter an email and password.");
        }

        try {
          const response = await fetch(API_LOGIN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (response.status === 404) {
            throw new Error(
              "Login service is unavailable. Please try again later."
            );
          }
          if (!response.ok) {
            const errorData = await response?.json();
            console.error("API Login Error:", errorData);
            throw new Error(errorData.message || "Invalid Credentials.");
          }

          const userAndTokenData = await response.json();

          const { user, token } = userAndTokenData;

          if (user) {
            return {
              ...user,
              accessToken: token,
            };
          } else {
            throw new Error(
              "Authentication successful, but no user data received from API."
            );
          }
        } catch (error) {
          console.error("Login authorization error:", error);
          throw new Error(
            error.message || "Something went wrong during login."
          );
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return { ...token, ...user };
      }
      return token;
    },
    async session({ session, token }) {
      session.user = { ...session.user, ...token };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
