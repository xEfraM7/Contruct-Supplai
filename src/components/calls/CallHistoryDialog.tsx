"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Clock,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Call {
  id: string;
  call_id: string;
  from_number: string;
  to_number: string;
  call_status: string;
  duration_ms: number | null;
  transcript: string | null;
  call_summary: string | null;
  user_sentiment: string | null;
  call_successful: boolean | null;
  recording_url: string | null;
  start_timestamp: number | null;
  end_timestamp: number | null;
  disconnection_reason: string | null;
  created_at: string;
}

interface CallHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcontractorId: string;
  subcontractorName: string;
}

export function CallHistoryDialog({
  open,
  onOpenChange,
  subcontractorId,
  subcontractorName,
}: CallHistoryDialogProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

  const fetchCalls = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/calls/subcontractor/${subcontractorId}`
      );
      const result = await response.json();
      if (result.calls) {
        setCalls(result.calls);
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCallDetails = async (callId: string) => {
    setIsRefreshing(callId);
    try {
      const response = await fetch(`/api/calls/${callId}`);
      const result = await response.json();
      if (result.call) {
        // Actualizar la llamada en la lista
        setCalls((prev) =>
          prev.map((call) =>
            call.call_id === callId
              ? {
                  ...call,
                  call_status: result.call.call_status,
                  duration_ms: result.call.duration_ms,
                  transcript: result.call.transcript,
                  call_summary: result.call.call_analysis?.call_summary,
                  user_sentiment: result.call.call_analysis?.user_sentiment,
                  call_successful: result.call.call_analysis?.call_successful,
                  recording_url: result.call.recording_url,
                  end_timestamp: result.call.end_timestamp,
                  disconnection_reason: result.call.disconnection_reason,
                }
              : call
          )
        );
        // Si es la llamada seleccionada, actualizarla también
        if (selectedCall?.call_id === callId) {
          setSelectedCall((prev) =>
            prev
              ? {
                  ...prev,
                  call_status: result.call.call_status,
                  duration_ms: result.call.duration_ms,
                  transcript: result.call.transcript,
                  call_summary: result.call.call_analysis?.call_summary,
                  user_sentiment: result.call.call_analysis?.user_sentiment,
                  call_successful: result.call.call_analysis?.call_successful,
                  recording_url: result.call.recording_url,
                  end_timestamp: result.call.end_timestamp,
                  disconnection_reason: result.call.disconnection_reason,
                }
              : null
          );
        }
      }
    } catch (error) {
      console.error("Error refreshing call:", error);
    } finally {
      setIsRefreshing(null);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCalls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subcontractorId]);

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string }
    > = {
      registered: { label: "Registered", className: "bg-blue-100 text-blue-700" },
      ongoing: { label: "Ongoing", className: "bg-yellow-100 text-yellow-700" },
      ended: { label: "Ended", className: "bg-green-100 text-green-700" },
      error: { label: "Error", className: "bg-red-100 text-red-700" },
      not_connected: { label: "Not Connected", className: "bg-gray-100 text-gray-700" },
    };

    const config = statusConfig[status] || statusConfig.registered;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    const sentimentConfig: Record<
      string,
      { className: string; icon: React.ReactNode }
    > = {
      Positive: {
        className: "bg-green-100 text-green-700",
        icon: <TrendingUp className="w-3 h-3" />,
      },
      Negative: {
        className: "bg-red-100 text-red-700",
        icon: <XCircle className="w-3 h-3" />,
      },
      Neutral: {
        className: "bg-gray-100 text-gray-700",
        icon: <MessageSquare className="w-3 h-3" />,
      },
    };

    const config = sentimentConfig[sentiment] || sentimentConfig.Neutral;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {sentiment}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Call History - {subcontractorName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No calls found for this subcontractor
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <Card
                key={call.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedCall(call)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">
                          {call.from_number} → {call.to_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(call.start_timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(call.call_status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshCallDetails(call.call_id);
                        }}
                        disabled={isRefreshing === call.call_id}
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            isRefreshing === call.call_id ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDuration(call.duration_ms)}</span>
                    </div>
                    {call.user_sentiment && (
                      <div>{getSentimentBadge(call.user_sentiment)}</div>
                    )}
                    {call.call_successful !== null && (
                      <div className="flex items-center gap-2">
                        {call.call_successful ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Successful</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">Unsuccessful</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {call.call_summary && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {call.call_summary}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call Details Modal */}
        {selectedCall && (
          <Dialog
            open={!!selectedCall}
            onOpenChange={() => setSelectedCall(null)}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Call Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Call Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      From
                    </p>
                    <p className="text-sm">{selectedCall.from_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      To
                    </p>
                    <p className="text-sm">{selectedCall.to_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Duration
                    </p>
                    <p className="text-sm">
                      {formatDuration(selectedCall.duration_ms)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(selectedCall.call_status)}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {selectedCall.call_summary && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCall.call_summary}
                    </p>
                  </div>
                )}

                {/* Sentiment & Success */}
                <div className="flex gap-4">
                  {selectedCall.user_sentiment && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Sentiment
                      </p>
                      {getSentimentBadge(selectedCall.user_sentiment)}
                    </div>
                  )}
                  {selectedCall.call_successful !== null && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Result
                      </p>
                      <Badge
                        className={
                          selectedCall.call_successful
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {selectedCall.call_successful
                          ? "Successful"
                          : "Unsuccessful"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Transcript */}
                {selectedCall.transcript && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Transcript</h3>
                    <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {selectedCall.transcript}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Recording */}
                {selectedCall.recording_url && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Recording</h3>
                    <audio controls className="w-full">
                      <source
                        src={selectedCall.recording_url}
                        type="audio/wav"
                      />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Disconnection Reason */}
                {selectedCall.disconnection_reason && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Disconnection Reason
                    </p>
                    <p className="text-sm">
                      {selectedCall.disconnection_reason.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
