import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Package, Upload, AlertCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import Navbar from "./Navbar";
import { modelService } from "../services/upload.service";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Model name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  licenseType: z.string({
    required_error: "Please select a license type.",
  }),
  royaltyPercentage: z.coerce.number().min(0).max(100).default(0),
  commercialUse: z.boolean().default(false),
  attributionRequired: z.boolean().default(true),
  tags: z.string().optional(),
  parameters: z.coerce.number().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

type FormData = z.infer<typeof formSchema>;

export default function UploadModelForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      royaltyPercentage: 0,
      commercialUse: false,
      attributionRequired: true,
      tags: "",
      parameters: undefined,
      terms: false,
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Remove a file from the selection
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (values: FormData) => {
    if (files.length === 0) {
      setError("Please select at least one model file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      
      // Add form fields
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'terms') return;
        console.log("formdata", formData)
        
        formData.append(key, value as string);
      });
      
      // Add model files
      files.forEach((file) => {
        formData.append("modelFile", file);
      });

      // Upload the model
      const result = await modelService.uploadModel(formData);
      console.log("Upload successful:", result);

      // Redirect to the model page
      navigate(`/models/${result.id}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const categories = [
    "language",
    "vision",
    "audio",
    "multimodal",
    "generative",
    "classification",
    "reinforcement",
    "other",
  ];

  const licenseTypes = ["MIT", "Apache 2.0", "GPL", "CC BY-NC 4.0", "BSD-3", "Custom"];

  return (
    <div className="h-screen bg-background px-20 py-10">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/models" className="text-sm text-muted-foreground hover:underline">
            Explore
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm">Upload Model</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-xl">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Upload AI Model</h1>
            <p className="text-muted-foreground">Share your model with the community</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-6">Model details</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<FormData>)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* Model name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter model name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* License type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select license type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {licenseTypes.map((license) => (
                              <SelectItem key={license} value={license}>
                                {license}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="royaltyPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Royalty percentage</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              className="w-24" 
                              {...field} 
                            />
                            <span className="ml-2">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Usage permissions</FormLabel>

                    <FormField
                      control={form.control}
                      name="commercialUse"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow commercial use</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="attributionRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Attribution required</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* Why should people use this model?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your model's capabilities, use cases, and advantages..."
                            className="h-40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="nlp, text-generation, fine-tuned, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          Help others discover your model with relevant tags
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parameters"
                    render={({ field: { value, onChange, ...fieldProps }}) => (
                      <FormItem>
                        <FormLabel>Parameters (if applicable)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g. 7000000000" 
                            value={value || ''} 
                            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)} 
                            {...fieldProps} 
                          />
                        </FormControl>
                        <FormDescription>
                          Number of parameters in your model
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <FormLabel className="block mb-2">* Model files</FormLabel>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
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
                      Supported formats: .bin, .onnx, .pt, .safetensors, .h5, .json
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
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove file</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I confirm I have the rights to share this model and the information provided is accurate
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isUploading || files.length === 0}
              >
                {isUploading ? "Uploading..." : "Upload model"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}