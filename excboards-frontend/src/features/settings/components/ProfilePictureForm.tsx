import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImageUpIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api";
import { useChangePfp } from "../queries";
import { PFP_ACCEPT, pfpSchema, type PfpFormValues } from "../schemas";
import { SettingsSection, SettingsSubmit } from "./SettingsSection";

export function ProfilePictureForm({
  username,
  currentUrl,
}: {
  username: string;
  currentUrl?: string;
}) {
  const changePfp = useChangePfp();
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PfpFormValues>({
    resolver: zodResolver(pfpSchema),
    defaultValues: { password: "" },
  });

  const picture = watch("picture");
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    if (!picture) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(picture);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [picture]);

  async function onSubmit(values: PfpFormValues) {
    setSaved(false);
    try {
      await changePfp.mutateAsync(values);
      reset({ password: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSaved(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't update profile picture."));
    }
  }

  const shownUrl = previewUrl ?? currentUrl;

  return (
    <SettingsSection
      title="Profile picture"
      description="JPEG, PNG or WebP, up to 5 MB."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-3">
          <Field>
            <div className="flex items-center gap-4">
              <Avatar className="size-16 shrink-0">
                {shownUrl && <AvatarImage src={shownUrl} />}
                <AvatarFallback className="text-xl">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Controller
                control={control}
                name="picture"
                render={({ field }) => (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={PFP_ACCEPT}
                      className="sr-only"
                      tabIndex={-1}
                      onChange={(e) => {
                        setSaved(false);
                        field.onChange(e.target.files?.[0]);
                      }}
                    />
                    <div className="min-w-0 space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageUpIcon />
                        Choose image
                      </Button>
                      {field.value && (
                        <p className="truncate text-xs text-muted-foreground">
                          {field.value.name}
                        </p>
                      )}
                    </div>
                  </>
                )}
              />
            </div>
            <FieldError errors={[errors.picture]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="pfpPassword">Current password</FieldLabel>
            <Input
              id="pfpPassword"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <SettingsSubmit
            label="Update picture"
            isSubmitting={isSubmitting}
            saved={saved}
          />
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
