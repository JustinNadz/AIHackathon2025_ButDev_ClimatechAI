"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function KnowledgePage() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [text, setText] = useState("")
  const [status, setStatus] = useState<string>("")
  const [busy, setBusy] = useState(false)

  const uploadFiles = async () => {
    if (!files || files.length === 0) { setStatus("Choose files first."); return }
    setBusy(true)
    setStatus("")
    try {
      const form = new FormData()
      Array.from(files).forEach((f) => form.append("files", f))
      const res = await fetch("/api/rag/ingest", { method: "POST", body: form })
      const data = await res.json()
      setStatus(`Added ${data?.added ?? 0} chunks from files.`)
    } catch (e: any) {
      setStatus(e?.message || "Upload failed")
    } finally { setBusy(false) }
  }

  const submitText = async () => {
    const t = text.trim()
    if (!t) { setStatus("Enter text to ingest."); return }
    setBusy(true)
    setStatus("")
    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [t] })
      })
      const data = await res.json()
      setStatus(`Added ${data?.added ?? 0} chunks from text.`)
      setText("")
    } catch (e: any) {
      setStatus(e?.message || "Ingestion failed")
    } finally { setBusy(false) }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Ingestion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Upload documents (TXT, MD, etc.)</label>
              <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="block" />
              <Button disabled={busy} onClick={uploadFiles}>Ingest Files</Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Paste knowledge text</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full rounded-md border p-2 text-sm bg-white" />
              <Button disabled={busy} onClick={submitText}>Ingest Text</Button>
            </div>

            {status && <p className="text-sm text-blue-700">{status}</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


