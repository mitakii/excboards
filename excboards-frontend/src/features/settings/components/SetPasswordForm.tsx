import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api";
import { useSetPassword } from "../queries";
import { setPasswordSchema, type SetPasswordFormValues } from "../schemas";
import { SettingsSection, SettingsSubmit } from "./SettingsSection";

/** Shown to accounts created through Google; once set, the page swaps in PasswordForm. */
export function SetPasswordForm() {
  const setPassword = useSetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: SetPasswordFormValues) {
    try {
      await setPassword.mutateAsync(values);
      toast.success("Password set. You can now also sign in with your username.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't set password."));
    }
  }

  return (
    <SettingsSection
      title="Password"
      description="Your account signs in with Google. Set a password to also sign in with your username. At least 8 characters, with an uppercase letter, a lowercase letter and a digit."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
            />
            <FieldError errors={[errors.newPassword]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>
          <SettingsSubmit label="Set password" isSubmitting={isSubmitting} saved={false} />
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
