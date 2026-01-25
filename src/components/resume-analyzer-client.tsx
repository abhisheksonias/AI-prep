"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type AnalysisResult, analyzeResume } from "@/app/actions";
import { AnalysisReport } from "@/components/analysis-report";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";

const formSchema = z.object({
  resumeText: z.string().min(100, "Please paste your full resume text."),
  jobDescription: z.string().min(50, "Please paste the full job description."),
});

export function ResumeAnalyzerClient() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] =
    React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeText: "",
      jobDescription: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);
    const result = await analyzeResume(values.resumeText, values.jobDescription);

    if (result.success && result.data) {
      setAnalysisResult(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description:
          result.error || "An unknown error occurred. Please try again.",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Get Your Resume Job-Ready
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Paste your resume and a job description to get instant AI-powered
            feedback.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <CardDescription>
                Provide your resume and the target job description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="resumeText"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Resume Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your resume text here..."
                            className="h-48 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste the job description here..."
                            className="h-48 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Analyzing..." : "Analyze Resume"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="space-y-8">
            {isLoading ? (
              <AnalysisSkeleton />
            ) : analysisResult ? (
              <AnalysisReport result={analysisResult} />
            ) : (
              <Card className="flex items-center justify-center h-[400px]">
                <div className="text-center p-8">
                  <h3 className="text-xl font-semibold">
                    Your Analysis Awaits
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Fill out the form to see your resume's match score, keyword
                    analysis, and improvement suggestions.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
