import { AuthForm } from "@/app/(auth)/auth-form";
import { signInDemo } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to host or join a watch party.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AuthForm mode="login" next={next} />

        <div className="relative py-1 text-center">
          <span className="bg-card px-2 text-xs uppercase tracking-wide text-muted-foreground">
            or
          </span>
        </div>

        <form action={signInDemo}>
          <Button type="submit" variant="secondary" className="w-full">
            Try the demo →
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Demo signs you in as <strong>Demo Host</strong> — no signup needed.
        </p>
      </CardContent>
    </Card>
  );
}
