"use client";

import {
  BarChart,
  ClipboardCheck,
  Lightbulb,
  SearchX,
  Wrench,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  RadialBar,
  RadialBarChart,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type AnalysisResult } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AnalysisReportProps {
  result: AnalysisResult;
}

export function AnalysisReport({ result }: AnalysisReportProps) {
  const chartData = [{ name: "Match Score", score: result.matchScore, fill: "hsl(var(--chart-1))" }];
  const chartConfig = {
    score: {
      label: "Match Score",
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <Card>
        <CardHeader className="items-center pb-0">
          <CardTitle className="font-headline">Overall Match Score</CardTitle>
          <CardDescription>
            How well your resume aligns with the job description.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[250px]"
          >
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={-270}
              innerRadius="70%"
              outerRadius="100%"
              barSize={20}
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
              />
              <RadialBar
                dataKey="score"
                background
                cornerRadius={10}
              />
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                dataKey="score"
                tick={false}
              />
              <Tooltip content={<ChartTooltipContent hideLabel />} />
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
         <div className="flex-1 text-center text-5xl font-bold tracking-tighter leading-none mt-[-2rem] pb-6">
            {result.matchScore}%
          </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart className="w-6 h-6 text-accent" />
            <CardTitle className="font-headline">Analysis Metrics</CardTitle>
          </div>
          <CardDescription>A breakdown of the analysis.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <p className="text-3xl font-bold">
              {result.metrics.keywordsInResume}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Keywords Found
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <p className="text-3xl font-bold">
              {result.metrics.totalKeywordsInJobDescription}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Total Keywords
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-accent" />
            <CardTitle className="font-headline">Matched Keywords</CardTitle>
          </div>
          <CardDescription>
            Keywords found in both your resume and the job description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.matchedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.matchedKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No direct keyword matches found. Consider adding more relevant terms.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SearchX className="w-6 h-6 text-destructive" />
            <CardTitle className="font-headline">Skills Gap</CardTitle>
          </div>
          <CardDescription>
            Skills and experiences from the job description that are missing from your resume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{result.missingSkills}</p>
        </CardContent>
      </Card>

      {result.keyImprovements && result.keyImprovements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Wrench className="w-6 h-6 text-accent" />
              <CardTitle className="font-headline">Key Improvements</CardTitle>
            </div>
            <CardDescription>
              Actionable suggestions to make your resume stronger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {result.keyImprovements.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left">{item.title}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-wrap">
                    {item.suggestion}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-accent" />
            <CardTitle className="font-headline">AI Feedback Summary</CardTitle>
          </div>
          <CardDescription>
            A summary of the analysis and overall feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{result.feedback}</p>
        </CardContent>
      </Card>
    </div>
  );
}
