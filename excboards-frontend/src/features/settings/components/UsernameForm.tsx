import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api";
import { useChangeUsername } from "../queries";
import { usernameSchema, type UsernameFormValues } from "../schemas";
import { SettingsSection, SettingsSubmit } from "./SettingsSection";

export function UsernameForm({ currentUsername }: { currentUsername: string }) {
  const changeUsername = useChangeUsername();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { newUsername: currentUsername, password: "" },
  });

  async function onSubmit(values: UsernameFormValues) {
    setSaved(false);
    try {
      await changeUsername.mutateAsync(values);
      reset({ newUsername: values.newUsername, password: "" });
      setSaved(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't change username."));
    }
  }

  return (
    <SettingsSection
      title="Username"
      description="Your profile URL changes with your username."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="newUsername">New username</FieldLabel>
            <Input id="newUsername" autoComplete="username" {...register("newUsername")} />
            <FieldError errors={[errors.newUsername]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="usernamePassword">Current password</FieldLabel>
            <Input
              id="usernamePassword"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <SettingsSubmit
            label="Change username"
            isSubmitting={isSubmitting}
            saved={saved}
          />
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
