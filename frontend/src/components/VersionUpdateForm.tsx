import { useState } from "react";
import { modelService } from "../services/model.service";
import { Button } from "./ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const versionFormSchema = z.object({
  commitMessage: z.string().min(1, "Commit message is required"),
  parameters: z.coerce.number().optional(),
});

type VersionFormValues = z.infer<typeof versionFormSchema>;

interface VersionUpdateFormProps {
  modelId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VersionUpdateForm: React.FC<VersionUpdateFormProps> = ({ 
  modelId, 
  onSuccess, 
  onCancel 
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionFormSchema),
    defaultValues: {
      commitMessage: "",
      parameters: undefined,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: VersionFormValues) => {
    if (files.length === 0) {
      setError("Please select at least one file for this version");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("commitMessage", values.commitMessage);
      
      if (values.parameters) {
        formData.append("parameters", String(values.parameters));
      }
      
      // Add all selected files
      files.forEach((file) => {
        formData.append("modelFile", file);
      });

      // Call the service method to upload
      await modelService.createModelVersion(modelId, formData);
      
      // Handle success
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error uploading new version:", err);
      setError(err instanceof Error ? err.message : "Failed to upload version. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Add New Version</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6">
            <div>
              <FormLabel>Model Files</FormLabel>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="modelFiles"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="modelFiles"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Drag files here or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Upload all files for this version
                  </span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Files selected ({files.length})
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm py-1 px-2 bg-muted/50 rounded-md mb-1"
                      >
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="commitMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commit Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the changes in this version..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly describe what's new or different in this version.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parameters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Parameters (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 70000000"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Total number of parameters in the model, if applicable.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload Version"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default VersionUpdateForm;