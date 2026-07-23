"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wand2, Sparkles, Scissors, Maximize2, Languages, Save, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AI_TOOLS } from "@/lib/ai-studio/tools";
import { mockGenerate, mockShorten, mockExpand, mockTranslate, type GenerateInput } from "@/lib/ai-studio/mock-generate";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

function ContentGeneratorInner() {
  const searchParams = useSearchParams();
  const [contentType, setContentType] = React.useState(searchParams.get("type") ?? AI_TOOLS[0].type);
  const [topic, setTopic] = React.useState("");
  const [tone, setTone] = React.useState("friendly");
  const [language, setLanguage] = React.useState("en");
  const [audience, setAudience] = React.useState("");
  const [keywords, setKeywords] = React.useState("");
  const [length, setLength] = React.useState<GenerateInput["length"]>("medium");
  const [creativity, setCreativity] = React.useState(60);
  const [output, setOutput] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function currentInput(): GenerateInput {
    return { contentType, topic, tone, language, audience, keywords, length };
  }

  function generate() {
    if (!topic.trim()) {
      toast.error("Give the generator a product or topic first");
      return;
    }
    setOutput(mockGenerate(currentInput()));
  }

  async function saveToHistory() {
    if (!output) {
      toast.error("Generate something first");
      return;
    }
    setSaving(true);
    try {
      await api.post("/ai-studio/ai-generation-logs", {
        feature: contentType,
        inputJson: currentInput(),
        outputText: output,
        model: "template-v1",
      });
      toast.success("Saved to generation history");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-[26px]">
          <Wand2 className="size-6 text-primary" /> AI Content Generator
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Generate on-brand content in seconds — no provider connected yet, so output uses local templates (configure a real provider in AI Settings)</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
        <Card className="h-fit">
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Content type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{AI_TOOLS.map((t) => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Product or topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Vine Fire jalapeño jar" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ar">Arabic</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Target audience</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. spice lovers, gift shoppers" />
            </div>
            <div className="space-y-1.5">
              <Label>Keywords</Label>
              <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="comma, separated, keywords" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Length</Label>
                <Select value={length} onValueChange={(v) => setLength(v as GenerateInput["length"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="short">Short</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="long">Long</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Creativity ({creativity}%)</Label>
                <input type="range" min={0} max={100} value={creativity} onChange={(e) => setCreativity(Number(e.target.value))} className="mt-2.5 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full gap-2" onClick={generate}><Sparkles className="size-4" /> Generate</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader><CardTitle>Output</CardTitle><CardDescription>Review, refine and save</CardDescription></CardHeader>
          <CardContent>
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={12}
              placeholder="Generated content will appear here…"
              className="w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!output} onClick={generate}><RotateCcw className="size-3.5" /> Regenerate</Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!output} onClick={() => setOutput(mockShorten(output))}><Scissors className="size-3.5" /> Shorten</Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!output} onClick={() => setOutput(mockExpand(output))}><Maximize2 className="size-3.5" /> Expand</Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!output} onClick={() => setOutput(mockTranslate(output, language === "en" ? "ar" : "en"))}><Languages className="size-3.5" /> Translate</Button>
            <Button size="sm" className="ml-auto gap-1.5" disabled={!output || saving} onClick={saveToHistory}><Save className="size-3.5" /> {saving ? "Saving…" : "Save"}</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ContentGeneratorPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>
      <ContentGeneratorInner />
    </Suspense>
  );
}
