import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api";
import { useChangePassword } from "../queries";
import { passwordSchema, type PasswordFormValues } from "../schemas";
import { SettingsSection, SettingsSubmit } from "./SettingsSection";

export function PasswordForm() {
  const changePassword = useChangePassword();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: PasswordFormValues) {
    setSaved(false);
    try {
      await changePassword.mutateAsync(values);
      reset();
      setSaved(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't change password."));
    }
  }

  return (
    <SettingsSection
      title="Password"
      description="At least 8 characters, with an uppercase letter, a lowercase letter and a digit."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="oldPassword">Current password</FieldLabel>
            <Input
              id="oldPassword"
              type="password"
              autoComplete="current-password"
              {...register("oldPassword")}
            />
            <FieldError errors={[errors.oldPassword]} />
          </Field>
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
          <SettingsSubmit
            label="Change password"
            isSubmitting={isSubmitting}
            saved={saved}
          />
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
