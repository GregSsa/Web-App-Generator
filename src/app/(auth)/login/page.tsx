import { signIn } from "@/actions/auth"; import { AuthForm } from "@/features/auth/auth-form"; import { AuthPage } from "@/features/auth/auth-page";
export default function LoginPage() { return <AuthPage title="Bon retour" description="Connectez-vous à votre bibliothèque privée."><AuthForm action={signIn} mode="login" /></AuthPage>; }
