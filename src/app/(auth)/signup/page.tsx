import { AuthForm } from "@/app/(auth)/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Card className="border-border/60 bg-card/70 shadow-lg backdrop-blur-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start watching videos together in seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="signup" />
      </CardContent>
    </Card>
  );
}
