import { signUp } from "@/actions/auth"; import { AuthForm } from "@/features/auth/auth-form"; import { AuthPage } from "@/features/auth/auth-page";
export default function SignupPage() { return <AuthPage title="Créer votre espace" description="Chaque donnée restera isolée par utilisateur."><AuthForm action={signUp} mode="signup" /></AuthPage>; }
