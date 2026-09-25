import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api";
import { useChangeEmail } from "../queries";
import { emailSchema, type EmailFormValues } from "../schemas";
import { SettingsSection, SettingsSubmit } from "./SettingsSection";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const changeEmail = useChangeEmail();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: currentEmail, password: "" },
  });

  async function onSubmit(values: EmailFormValues) {
    setSaved(false);
    try {
      await changeEmail.mutateAsync(values);
      reset({ newEmail: values.newEmail, password: "" });
      setSaved(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't change email."));
    }
  }

  return (
    <SettingsSection title="Email">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="newEmail">New email</FieldLabel>
            <Input id="newEmail" type="email" autoComplete="email" {...register("newEmail")} />
            <FieldError errors={[errors.newEmail]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="emailPassword">Current password</FieldLabel>
            <Input
              id="emailPassword"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <SettingsSubmit
            label="Change email"
            isSubmitting={isSubmitting}
            saved={saved}
          />
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
