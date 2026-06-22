"use client";

import { useState } from "react";
import { Upload, FileText, Smartphone, AlertCircle } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";
import { transactionsApi } from "@/app/lib/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState("file");
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState("CSV"); // CSV, PDF, OCR, SMS
  const [smsText, setSmsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect source type from file extension
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        setSourceType("CSV");
      } else if (ext === "pdf") {
        setSourceType("PDF");
      } else if (["png", "jpg", "jpeg"].includes(ext || "")) {
        setSourceType("OCR");
      } else if (ext === "txt") {
        setSourceType("SMS");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      if (activeTab === "file") {
        if (!file) {
          throw new Error("Please select a file to upload.");
        }
        formData.append("file", file);
        formData.append("source_type", sourceType);
      } else {
        if (!smsText.trim()) {
          throw new Error("Please paste at least one SMS log.");
        }
        formData.append("sms_text", smsText);
        formData.append("source_type", "SMS");
      }

      await transactionsApi.upload(formData);
      
      // Reset State & Close
      setFile(null);
      setSmsText("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to process upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Import Statements & Receipts</DialogTitle>
        <DialogDescription>
          Unified aggregator: Upload PDF, CSV statements, receipt screenshots, or paste transaction SMS blocks.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="file" className="w-full flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              File Statement
            </TabsTrigger>
            <TabsTrigger value="sms" className="w-full flex items-center justify-center gap-2">
              <Smartphone className="h-4 w-4" />
              Paste SMS logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            {/* File Drag Area */}
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-black/20 hover:bg-black/35 transition-all relative group cursor-pointer">
              <input
                type="file"
                id="statement-file-input"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".csv,.pdf,.png,.jpg,.jpeg,.txt"
              />
              <Upload className="h-10 w-10 text-muted-foreground group-hover:text-white transition-colors mb-2" />
              <p className="text-sm font-semibold text-white">
                {file ? file.name : "Click or drag to select file"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports CSV, bank PDF, receipt images (PNG/JPG) or text logs
              </p>
              {file && (
                <div className="mt-2 text-xs text-primary font-semibold">
                  Size: {(file.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>

            {/* Type Selector */}
            <Select
              label="Aggregation Source Type"
              options={[
                { value: "CSV", label: "CSV Bank Statement" },
                { value: "PDF", label: "Bank PDF Statement" },
                { value: "OCR", label: "Image Receipt (OCR Analysis)" },
                { value: "SMS", label: "Uploaded SMS Text File" },
              ]}
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">
                Paste SMS logs (One transaction per line)
              </label>
              <textarea
                placeholder="Example:&#10;Dear Customer, your card X1234 is debited by INR 350.00 at Starbucks on 2026-06-20.&#10;Alert: Spent Rs 1200 on Zomato using Axis Card."
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                className="flex h-36 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-muted-foreground/60 transition-all focus:outline-none focus:ring-1 focus:ring-ring resize-none font-mono text-xs"
              />
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex gap-2">
              <Smartphone className="h-4 w-4 shrink-0 mt-0.5" />
              <span>We'll parse the merchant, amount, dates, and card methods to extract clean transaction logs.</span>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Analyze & Import
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
