"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Loader2 } from "lucide-react";
import { UptimeKumaMonitor } from "@/lib/uptime-kuma-api";

export interface MonitorFormData {
  name: string;
  url: string;
  type: "http" | "https" | "tcp" | "ping" | "dns";
  heartbeatInterval: number;
  retries: number;
  heartbeatRetryInterval: number;
  requestTimeout: number;
  httpMethod?: string;
  bodyEncoding?: string;
  body?: string;
}

interface MonitorFormDialogProps {
  monitor?: UptimeKumaMonitor;
  onSave: (data: MonitorFormData) => Promise<void>;
  children?: React.ReactNode;
}

export function MonitorFormDialog({ monitor, onSave, children }: MonitorFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MonitorFormData>({
    name: "",
    url: "",
    type: "https",
    heartbeatInterval: 60,
    retries: 0,
    heartbeatRetryInterval: 60,
    requestTimeout: 48,
    httpMethod: "GET",
    bodyEncoding: "JSON",
    body: "",
  });

  // Load monitor data if editing
  useEffect(() => {
    if (monitor && open) {
      setFormData({
        name: monitor.name,
        url: monitor.url,
        type: monitor.type,
        heartbeatInterval: 60,
        retries: 0,
        heartbeatRetryInterval: 60,
        requestTimeout: 48,
        httpMethod: "GET",
        bodyEncoding: "JSON",
        body: "",
      });
    } else if (!monitor && open) {
      // Reset form for new monitor
      setFormData({
        name: "",
        url: "",
        type: "https",
        heartbeatInterval: 60,
        retries: 0,
        heartbeatRetryInterval: 60,
        requestTimeout: 48,
        httpMethod: "GET",
        bodyEncoding: "JSON",
        body: "",
      });
    }
  }, [monitor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      setOpen(false);
    } catch (error) {
      console.error("Failed to save monitor:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Monitor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{monitor ? "Edit Monitor" : "Add New Monitor"}</DialogTitle>
          <DialogDescription>
            Configure a new monitor to track website availability and response times
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* General Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">General</h3>
              
              <div className="space-y-2">
                <Label htmlFor="type">Monitor Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="ping">Ping</SelectItem>
                    <SelectItem value="dns">DNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Friendly Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="New Monitor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartbeatInterval">
                  Heartbeat Interval (Check every {formData.heartbeatInterval} seconds)
                </Label>
                <Input
                  id="heartbeatInterval"
                  type="number"
                  min="10"
                  value={formData.heartbeatInterval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heartbeatInterval: parseInt(e.target.value) || 60,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {Math.floor(formData.heartbeatInterval / 60)} minute
                  {formData.heartbeatInterval !== 60 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retries">Retries</Label>
                <Input
                  id="retries"
                  type="number"
                  min="0"
                  value={formData.retries}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retries: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum retries before the service is marked as down and a notification is sent
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartbeatRetryInterval">
                  Heartbeat Retry Interval (Retry every {formData.heartbeatRetryInterval} seconds)
                </Label>
                <Input
                  id="heartbeatRetryInterval"
                  type="number"
                  min="10"
                  value={formData.heartbeatRetryInterval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heartbeatRetryInterval: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestTimeout">
                  Request Timeout (Timeout after {formData.requestTimeout} seconds)
                </Label>
                <Input
                  id="requestTimeout"
                  type="number"
                  min="1"
                  value={formData.requestTimeout}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requestTimeout: parseInt(e.target.value) || 48,
                    })
                  }
                />
              </div>
            </div>

            {/* HTTP Options Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">HTTP Options</h3>

              <div className="space-y-2">
                <Label htmlFor="httpMethod">Method</Label>
                <Select
                  value={formData.httpMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, httpMethod: value })
                  }
                >
                  <SelectTrigger id="httpMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyEncoding">Body Encoding</Label>
                <Select
                  value={formData.bodyEncoding}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bodyEncoding: value })
                  }
                >
                  <SelectTrigger id="bodyEncoding">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="Text">Text</SelectItem>
                    <SelectItem value="XML">XML</SelectItem>
                    <SelectItem value="Form-Data">Form-Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Example: {`{"key": "value"}`}
                </p>
              </div>

              {/* Notifications and Proxy placeholders */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-2">Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Not available, please set up.
                  </p>
                  <Button type="button" variant="outline" size="sm" disabled>
                    Set Up Notification
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Proxy</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Not available, please set up.
                  </p>
                  <Button type="button" variant="outline" size="sm" disabled>
                    Set Up Proxy
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {monitor ? "Update Monitor" : "Create Monitor"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

