import { redirect } from 'next/navigation';

// Legacy route — forward to the new auth flow.
export default function SignInRedirect() {
  redirect('/auth/signin');
}
