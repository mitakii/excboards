import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import { useRegister } from "./queries";
import { registerSchema, type RegisterFormValues } from "./schemas";

function matchField(key: string): "username" | "email" | "password" | null {
  const k = key.toLowerCase();
  if (k.includes("username")) return "username";
  if (k.includes("email")) return "email";
  if (k.includes("password")) return "password";
  return null;
}

export function RegisterPage() {
  const registerUser = useRegister();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerUser.mutateAsync(values);
      navigate("/login", { replace: true });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      let matchedAny = false;
      for (const [key, message] of Object.entries(fieldErrors ?? {})) {
        const field = matchField(key);
        if (field) {
          setError(field, { message });
          matchedAny = true;
        }
      }
      if (!matchedAny) {
        setError("root", { message: getErrorMessage(err, "Registration failed.") });
      }
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input id="username" autoComplete="username" {...register("username")} />
                <FieldError errors={[errors.username]} />
              </Field>

              <Field className="mt-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field className="mt-2">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
                <FieldError errors={[errors.password]} />
              </Field>

              <Field className="mt-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  Register
                </Button>
                <FieldError errors={[errors.root]} />
                <FieldDescription className="text-center">
                  Already have an account? <Link to="/login">Log in</Link>
                </FieldDescription>
              </Field>
            </form>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
