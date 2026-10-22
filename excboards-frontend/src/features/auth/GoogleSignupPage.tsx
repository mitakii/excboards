import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, getErrorStatus, getFieldErrors } from "@/lib/api";
import { useGoogleRegister } from "./queries";
import { googleSignupSchema, type GoogleSignupFormValues } from "./schemas";
import type { GoogleSignupState } from "./google";

export function GoogleSignupPage() {
  const location = useLocation();
  const state = location.state as GoogleSignupState | null;

  // router state is lost on reload; the user just has to click the Google button again
  if (!state?.idToken) return <Navigate to="/login" replace />;

  return <GoogleSignupForm {...state} />;
}

function GoogleSignupForm({
  idToken,
  suggestedUsername,
  from,
}: GoogleSignupState) {
  const registerUser = useGoogleRegister();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GoogleSignupFormValues>({
    resolver: zodResolver(googleSignupSchema),
    defaultValues: { username: suggestedUsername },
  });

  async function onSubmit({ username }: GoogleSignupFormValues) {
    try {
      await registerUser.mutateAsync({ idToken, username });
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      if (getErrorStatus(err) === 401) {
        setError("root", {
          message: "Your Google sign-in expired. Please sign in again.",
        });
        return;
      }
      const usernameError = Object.entries(getFieldErrors(err) ?? {}).find(
        ([key]) => key.toLowerCase().includes("username")
      );
      if (usernameError) setError("username", { message: usernameError[1] });
      else
        setError("root", { message: getErrorMessage(err, "Sign-up failed.") });
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Choose a username</CardTitle>
          <CardDescription>
            This is how others will see you. You can change it later in
            settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  autoComplete="username"
                  autoFocus
                  {...register("username")}
                />
                <FieldError errors={[errors.username]} />
              </Field>

              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  Continue
                </Button>
                <FieldError errors={[errors.root]} />
                <FieldDescription className="text-center">
                  <Link to="/login" replace>
                    Cancel
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
