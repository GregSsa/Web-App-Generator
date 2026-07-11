import { requestPasswordReset } from "@/actions/auth"; import { AuthForm } from "@/features/auth/auth-form"; import { AuthPage } from "@/features/auth/auth-page";
export default function ForgotPage() { return <AuthPage title="Récupérer l’accès" description="Nous vous enverrons un lien sécurisé."><AuthForm action={requestPasswordReset} mode="forgot" /></AuthPage>; }
