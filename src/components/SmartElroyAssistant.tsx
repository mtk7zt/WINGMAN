import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Role = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: Role;
  text: string;
  ts: number;
};

type PendingFile = File;

type OpenRouterContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: OpenRouterContentBlock[];
};

type OpenRouterResponse = {
  id: string;
  object: "chat.completion";
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: "assistant";
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_SYSTEM_PROMPT = `
You are "Elroy" — a senior generalist AI assistant built for expert-level coding, math, writing, and analysis.

Core principles:
- Originality & anti-plagiarism:
  - Always produce original, human-sounding writing.
  - Never copy text verbatim from provided materials unless explicitly asked; if quoting, keep it short and cite the source.
  - When users provide documents (text, PDFs, screenshots), extract and understand them, then write in a natural, varied cadence with specific details and judicious structure.
  - Avoid stock phrases and AI-sounding meta-comments (e.g., "As an AI model", "I cannot..."). Be direct, clear, and human.
- Document understanding:
  - If content contains tables, extract them faithfully as Markdown tables and explain key insights.
  - If images/screenshots are provided, perform OCR-style reading and describe layout, text, and any tables; reconstruct tables when possible.
- Coding:
  - Provide concise, correct solutions; explain non-obvious steps; prioritize security and clarity; include runnable snippets where practical.
- Math:
  - Show your reasoning briefly and present a final, clearly boxed answer or a bulleted summary.
- Essays & reports:
  - Establish an appropriate thesis, structure, and flow. Use citations and references when users provide sources.
- Style controls:
  - Adapt to user-selected tone and depth. Avoid filler. Ask clarifying questions when the user's intent is ambiguous.

Safety & compliance:
- Do not produce disallowed content. If asked for risky actions, refuse and suggest safer alternatives.

Output:
- Use clear headings, bullets, and concise paragraphs. Prefer Markdown formatting for code blocks and tables.
`.trim();

export default function SmartElroyAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [tone, setTone] = useState<"neutral" | "friendly" | "formal">("neutral");
  const [depth, setDepth] = useState<"concise" | "balanced" | "detailed">("balanced");
  const [citationMode, setCitationMode] = useState<"auto" | "always" | "never">("auto");
  const [extractTables, setExtractTables] = useState(true);
  const [describeImages, setDescribeImages] = useState(true);

  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const touch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || (navigator as any)?.maxTouchPoints > 0);
    setIsTouch(!!touch);
  }, []);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) appendFiles(files);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const appendFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      const isPdf = f.type === "application/pdf";
      const isText = f.type === "text/plain";
      const isImage = f.type.startsWith("image/");
      return isPdf || isText || isImage;
    });
    setPendingFiles((prev) => [...prev, ...valid]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) appendFiles(files);
  };

  const removePendingFile = (name: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.name !== name));
  };

  function summarizeControls() {
    const toneText =
      tone === "neutral" ? "Neutral tone" : tone === "friendly" ? "Friendly tone" : "Formal tone";
    const depthText =
      depth === "concise" ? "Concise answers" : depth === "balanced" ? "Balanced depth" : "Detailed answers";
    const citeText =
      citationMode === "auto" ? "Citations: auto" : citationMode === "always" ? "Citations: always" : "Citations: never";
    return `${toneText} • ${depthText} • ${citeText} • Tables:${extractTables ? " on" : " off"} • Images:${describeImages ? " on" : " off"}`;
  }

  const readFileAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("File read error"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });

  const readFileAsText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("File read error"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(file);
    });

  const sendMessage = async () => {
    const trimmed = input.trim();
    const hasInput = trimmed.length > 0;
    const hasFiles = pendingFiles.length > 0;
    if (!hasInput && !hasFiles) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text: trimmed.length ? trimmed : "(sent attachments)",
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const userBlocks: OpenRouterContentBlock[] = [];

      const controlDirectives = [
        `Tone: ${tone}`,
        `Depth: ${depth}`,
        `Citations: ${citationMode}`,
        `ExtractTables: ${extractTables ? "true" : "false"}`,
        `DescribeImages: ${describeImages ? "true" : "false"}`,
      ].join(" | ");

      if (hasInput) {
        userBlocks.push({
          type: "text",
          text:
            `User request:\n${trimmed}\n\n` +
            `Assistant controls: ${controlDirectives}\n` +
            `Instructions:\n` +
            `- If attachments contain tables, extract as Markdown tables and summarize insights.\n` +
            `- If images/screenshots are attached, perform OCR-style reading and reconstruct tables when possible.\n` +
            `- Ensure originality; avoid AI-sounding phrasing; cite sources if derived from attachments.\n`,
        });
      } else {
        userBlocks.push({
          type: "text",
          text:
            `User sent attachments without a message.\n` +
            `Assistant controls: ${controlDirectives}\n` +
            `Please extract, summarize, and provide structured insights. If tables are present, render them as Markdown tables.\n`,
        });
      }

      for (const f of pendingFiles) {
        if (f.type.startsWith("image/")) {
          const dataUrl = await readFileAsDataURL(f);
          userBlocks.push({
            type: "image_url",
            image_url: { url: dataUrl },
          });
          userBlocks.push({
            type: "text",
            text: `Attachment: Image "${f.name}". If text or tables exist, extract them.`,
          });
        } else if (f.type === "application/pdf") {
          const dataUrl = await readFileAsDataURL(f);
          userBlocks.push({
            type: "file",
            file: { filename: f.name, file_data: dataUrl },
          });
          userBlocks.push({
            type: "text",
            text: `Attachment: PDF "${f.name}". Read all pages. Extract tables and key sections.`,
          });
        } else if (f.type === "text/plain") {
          const text = await readFileAsText(f);
          userBlocks.push({
            type: "text",
            text:
              `Attachment: Text file "${f.name}". Content below:\n` +
              `----- BEGIN ${f.name} -----\n` +
              text.slice(0, 200000) +
              `\n----- END ${f.name} -----`,
          });
        }
      }

      const history: OpenRouterMessage[] = [];
      history.push({
        role: "system",
        content: [{ type: "text", text: systemPrompt }],
      });
      const recent = messages.slice(-12);
      for (const m of recent) {
        history.push({
          role: m.role,
          content: [{ type: "text", text: m.text }],
        });
      }
      history.push({
        role: "user",
        content: userBlocks,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const resp = await fetch("https://oi-server.onrender.com/chat/completions", {
        method: "POST",
        headers: {
          CustomerId: "cus_T5H02ltiJeUb8v",
          "Content-Type": "application/json",
          Authorization: "Bearer xxx",
        },
        body: JSON.stringify({
          model: "openrouter/claude-sonnet-4",
          messages: history,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        const textErr = await resp.text();
        throw new Error(`API error: ${resp.status} ${textErr}`);
      }
      const data = (await resp.json()) as OpenRouterResponse;
      const content = data?.choices?.[0]?.message?.content ?? "(no response)";
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        text: content,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        text:
          "I ran into an issue reaching the assistant service. Please try again. Details: " +
          (err?.message || String(err)),
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsSending(false);
      setPendingFiles([]);
    }
  };

  const clearChat = () => setMessages([]);
  const exportChat = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elroy-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function Header() {
    return (
      <div className="w-full border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-primary">Elroy</span>
            <span className="text-sm text-muted-foreground">by mtk</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowAbout(true)}>
              About
            </Button>
            <Button variant="secondary" onClick={() => setShowSettings(true)}>
              Settings
            </Button>
            <Button variant="outline" onClick={clearChat}>
              New Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function AboutModal() {
    if (!showAbout) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-primary">About</CardTitle>
            <CardDescription className="text-muted-foreground">
              Project details and credits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground">
              Elroy is a generalist assistant optimized for coding, math, essays, and complex
              documents. It reads text, PDFs, and images/screenshots, detects and reconstructs tables,
              and strives for original, human-sounding output with proper citations.
            </p>
            <div className="rounded-md border border-border p-3 bg-muted">
              <p className="text-foreground">
                Created by mtk • alias Elroy
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              Notes: Avoids AI-sounding phrases, can summarize, extract data from tables, and analyze
              screenshots for text/structure.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={() => setShowAbout(false)}>Close</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  function SettingsModal() {
    if (!showSettings) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-primary">Settings</CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize Elroy's behavior and system prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  onValueChange={(v) => setTone(v as any)}
                  defaultValue={tone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Depth</Label>
                <Select
                  onValueChange={(v) => setDepth(v as any)}
                  defaultValue={depth}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Citations</Label>
                <Select
                  onValueChange={(v) => setCitationMode(v as any)}
                  defaultValue={citationMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Citations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="always">Always</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-foreground">Document intelligence</Label>
                <div className="rounded-md border border-border p-3">
                  <RadioGroup
                    defaultValue={extractTables ? "on" : "off"}
                    onValueChange={(v) => setExtractTables(v === "on")}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on" id="tables-on" />
                      <Label htmlFor="tables-on" className="text-foreground">Extract tables</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="off" id="tables-off" />
                      <Label htmlFor="tables-off" className="text-foreground">Ignore tables</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-foreground">Image analysis</Label>
                <div className="rounded-md border border-border p-3">
                  <RadioGroup
                    defaultValue={describeImages ? "on" : "off"}
                    onValueChange={(v) => setDescribeImages(v === "on")}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on" id="images-on" />
                      <Label htmlFor="images-on" className="text-foreground">Describe/OCR images</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="off" id="images-off" />
                      <Label htmlFor="images-off" className="text-foreground">Skip images</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">System prompt</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[180px]"
                placeholder="System instructions for Elroy"
              />
              <p className="text-sm text-muted-foreground">
                This controls Elroy's overall behavior. You can fine-tune tone, safety, and structure.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={() => setShowSettings(false)}>Close</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  function Composer() {
    return (
      <div className="sticky bottom-0 bg-background border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-4 space-y-3">
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="rounded-md border border-dashed border-border p-3 bg-muted text-muted-foreground"
          >
            Drag & drop PDF, text, or images here
          </div>

          <div className="flex items-start gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything… code, math, essays, reports. Attach files for deeper analysis."
              className="min-h-[80px] flex-1"
            />
            <div className="flex flex-col gap-2 w-36">
              <Input type="file" multiple onChange={onFileChange} />
              <Button onClick={sendMessage} disabled={isSending} className="bg-primary text-primary-foreground">
                {isSending ? "Thinking…" : "Send"}
              </Button>
            </div>
          </div>

          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((f) => (
                <div
                  key={f.name + f.size + f.type}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1"
                >
                  <span className="text-xs text-foreground">{f.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePendingFile(f.name)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {summarizeControls()}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={exportChat}>
                Export
              </Button>
              <Button variant="outline" onClick={clearChat}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function ChatBubble({ m }: { m: ChatMessage }) {
    const isUser = m.role === "user";
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[85%] rounded-lg border border-border px-3 py-2 ${
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          <div className="text-xs opacity-90 mb-1">
            {format(m.ts, "PPP p")}
          </div>
          <div className="whitespace-pre-wrap text-sm">{m.text}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <AboutModal />
      <SettingsModal />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-primary">Meet Elroy</CardTitle>
                <CardDescription className="text-muted-foreground">
                  A precise, original, document-smart assistant for everything you throw its way
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 text-foreground">
                  <li>Understands PDFs, text files, and images/screenshots</li>
                  <li>Detects and reconstructs tables; summarizes key insights</li>
                  <li>Excels at coding, math, essays, and reports</li>
                  <li>Writes in a human voice; avoids AI-sounding phrasing</li>
                </ul>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Tip: Drag and drop files into the composer before sending your question
              </CardFooter>
            </Card>
          ) : null}

          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <ChatBubble key={m.id} m={m} />
              ))}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
        </div>
      </main>

      <Composer />
    </div>
  );
}