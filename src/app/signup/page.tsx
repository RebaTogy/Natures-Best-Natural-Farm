import AuthForm from "@/components/AuthForm";
import BlurBackground from "@/components/ui/BlurBackground";

export default function SignupPage() {
  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <AuthForm mode="signup" />
    </BlurBackground>
  );
}
