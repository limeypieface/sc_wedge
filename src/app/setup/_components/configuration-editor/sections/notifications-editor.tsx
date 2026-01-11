"use client";

/**
 * NotificationsEditor
 *
 * Configuration editor for notification preferences.
 */

import { Bell, Mail, Smartphone, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Separator,
} from "@/components/ui";
import { useConfiguration } from "@/lib/contexts";

export function NotificationsEditor() {
  const { configuration, updateSection } = useConfiguration();

  if (!configuration) return null;

  const { notifications } = configuration;

  const eventLabels: Record<keyof typeof notifications.events, { title: string; description: string }> = {
    poCreated: {
      title: "PO Created",
      description: "When a new purchase order is created",
    },
    poApproved: {
      title: "PO Approved",
      description: "When a purchase order is approved",
    },
    poRejected: {
      title: "PO Rejected",
      description: "When a purchase order is rejected",
    },
    shipmentReceived: {
      title: "Shipment Received",
      description: "When a shipment arrives",
    },
    invoiceReceived: {
      title: "Invoice Received",
      description: "When a vendor invoice is received",
    },
    qualityIssue: {
      title: "Quality Issue",
      description: "When a quality problem is detected",
    },
    deliveryDelayed: {
      title: "Delivery Delayed",
      description: "When a delivery is running late",
    },
  };

  return (
    <div className="space-y-8">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.emailEnabled}
              onCheckedChange={(v) =>
                updateSection("notifications", { emailEnabled: v })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">In-App Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Show notifications within the application
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.inAppEnabled}
              onCheckedChange={(v) =>
                updateSection("notifications", { inAppEnabled: v })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest Mode */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Daily Digest</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Combine notifications into a daily summary instead of real-time
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.digestMode}
              onCheckedChange={(v) =>
                updateSection("notifications", { digestMode: v })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Notification Events</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which events trigger notifications.
          </p>

          {Object.entries(notifications.events).map(([key, value], index) => {
            const eventKey = key as keyof typeof notifications.events;
            const { title, description } = eventLabels[eventKey];

            return (
              <div key={key}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {description}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(v) =>
                      updateSection("notifications", {
                        events: { ...notifications.events, [key]: v },
                      })
                    }
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
