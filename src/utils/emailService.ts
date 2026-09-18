export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  console.log(`Verification email for ${email}: ${appUrl}/api/auth/verify-email?token=${token}`);
}
