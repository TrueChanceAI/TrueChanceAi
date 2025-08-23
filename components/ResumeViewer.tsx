"use client";

import { useState } from "react";
import { getResumeSignedUrl } from "@/lib/utils";

interface ResumeViewerProps {
  filePath: string;
  fileName?: string;
}

export default function ResumeViewer({ filePath, fileName }: ResumeViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewResume = async () => {
    if (!filePath) {
      setError("No file path provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = await getResumeSignedUrl(filePath);
      if (url) {
        setSignedUrl(url);
        // Open in new tab
        window.open(url, '_blank');
      } else {
        setError("Failed to generate download link");
      }
    } catch (err) {
      setError("Error accessing resume file");
      console.error("Error getting resume URL:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!filePath) {
      setError("No file path provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = await getResumeSignedUrl(filePath);
      if (url) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError("Failed to generate download link");
      }
    } catch (err) {
      setError("Error downloading resume file");
      console.error("Error downloading resume:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleViewResume}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "View Resume"}
        </button>
        <button
          onClick={handleDownloadResume}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Download Resume"}
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
      {signedUrl && (
        <p className="text-green-600 text-sm">
          ✅ Resume link generated successfully
        </p>
      )}
    </div>
  );
} 