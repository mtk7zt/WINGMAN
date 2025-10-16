"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [documentCount] = useState(0);
  const [conversationCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold text-primary">Elroy</h1>
              <span className="text-sm text-muted-foreground">Personal AI Assistant</span>
            </div>
            <Link href="/assistant">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Chatting
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              Personal AI Assistant
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload documents, analyze content, and get intelligent assistance with your assignments
            </p>
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Upload & Manage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Support for PDF, TXT, DOCX files and images with OCR capabilities
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Chat & Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Intelligent conversation with table extraction and content analysis
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Customizable tone, depth, and citation preferences
                  </p>
                </CardContent>
              </Card>
            </div>

            <Link href="/assistant">
              <Button size="lg" className="text-lg px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Document Upload Preview */}
      <section className="py-16 px-4 bg-white/40 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
              Document Upload
            </h3>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Upload PDF files, text documents, or notes for analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-base font-medium">
                    Select Files (PDF, TXT, DOCX)
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles ? `${selectedFiles.length} file(s) selected` : "No file chosen"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube-url" className="text-base font-medium">
                    YouTube Video URL
                  </Label>
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                </div>

                <div className="border border-dashed border-border rounded-lg p-8 text-center bg-muted/30">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-foreground">
                      Uploaded Documents ({documentCount})
                    </h4>
                    <p className="text-muted-foreground">
                      No documents uploaded yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upload files to start analyzing content
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Documents: {documentCount} | Conversations: {conversationCount}
                  </div>
                  <Link href="/assistant">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Start Analysis
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">About Elroy</CardTitle>
                <CardDescription className="text-lg">
                  Advanced AI Assistant for Expert-Level Tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Elroy is a senior generalist AI assistant built for expert-level coding, math, writing, and analysis.
                  It understands documents, extracts tables, performs OCR on images, and produces original, 
                  human-sounding content with proper citations.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-foreground font-medium">
                    Created by mtk, alias Elroy
                  </p>
                </div>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li>• Document understanding: PDF, text, images with OCR</li>
                  <li>• Table detection and Markdown reconstruction</li>
                  <li>• Anti-plagiarism with original writing style</li>
                  <li>• Expert coding, math, essays, and reports</li>
                  <li>• Customizable tone and citation preferences</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white/60 backdrop-blur-sm border-t">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 Elroy Personal AI Assistant. Created by mtk.
          </p>
        </div>
      </footer>
    </div>
  );
}