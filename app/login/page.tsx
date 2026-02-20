import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/infra/security/tokenService";
import LoginForm from "./_components/LoginForm";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "__session";

/**
 * /login — Server Component.
 *
 * Runs on the server before anything reaches the browser:
 * - If the user already has a valid session → redirect to /dashboard.
 * - Otherwise → render the login form.
 *
 * This prevents the "flash of login page" for authenticated users and
 * means the check can never be skipped by disabling JavaScript.
 */
export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    try {
      await verifyToken(token);
      redirect("/dashboard");
    } catch {
      // Token invalid/expired — fall through and show the login form
    }
  }

  return (
    <main>
      <h1>Sign in</h1>
      <LoginForm />
    </main>
  );
}
