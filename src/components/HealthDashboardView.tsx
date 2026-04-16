import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Server,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { format, subHours } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ServiceHealth {
  serviceName: string;
  status: "operational" | "degraded" | "down" | "maintenance";
  latencyMs: number | null;
  errorRate: number;
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "critical" | "error";
  timestamp: string;
  services: ServiceHealth[];
  summary: {
    total: number;
    operational: number;
    degraded: number;
    down: number;
    maintenance: number;
  };
}

const statusConfig = {
  operational: {
    label: "Opérationnel",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Dégradé",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: AlertTriangle,
  },
  down: {
    label: "Hors ligne",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
  maintenance: {
    label: "Maintenance",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: Clock,
  },
};

const overallStatusConfig = {
  healthy: {
    label: "Tous systèmes opérationnels",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Performance dégradée",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: AlertTriangle,
  },
  critical: {
    label: "Incident en cours",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
  error: {
    label: "Erreur de surveillance",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: AlertCircle,
  },
};

export default function HealthDashboardView() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const { data: healthData, isLoading, refetch } = useQuery<HealthStatus>({
    queryKey: ["system-health"],
    queryFn: async () => {
      const response = await fetch("/api/system-health");
      if (!response.ok) throw new Error("Failed to fetch health status");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: historyData } = useQuery({
    queryKey: ["system-health-history", selectedService],
    queryFn: async () => {
      if (!selectedService) return null;
      const response = await fetch(
        `/api/system-health/history/${selectedService}?limit=24`
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
    enabled: !!selectedService,
  });

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Activity;
    return <Icon className={`h-5 w-5 ${config?.color}`} />;
  };

  const formatLatency = (ms: number | null) => {
    if (ms === null) return "N/A";
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const OverallIcon = healthData
    ? overallStatusConfig[healthData.status]?.icon || Activity
    : Activity;
  const overallConfig = healthData
    ? overallStatusConfig[healthData.status]
    : overallStatusConfig.error;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">État des services</h2>
          <p className="text-muted-foreground">Surveillance en temps réel des services</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={overallConfig.bgColor}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <OverallIcon className={`h-8 w-8 ${overallConfig.color}`} />
            <div>
              <CardTitle className={overallConfig.color}>
                {healthData?.status === "healthy"
                  ? "Tous systèmes opérationnels"
                  : healthData?.status === "degraded"
                  ? "Performance dégradée"
                  : healthData?.status === "critical"
                  ? "Incident en cours"
                  : "État inconnu"}
              </CardTitle>
              <CardDescription>
                Dernière mise à jour:{" "}
                {healthData
                  ? format(new Date(healthData.timestamp), "dd MMM yyyy HH:mm:ss", {
                      locale: fr,
                    })
                  : "Jamais"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      {healthData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.summary.operational}</p>
                  <p className="text-sm text-muted-foreground">Opérationnels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.summary.degraded}</p>
                  <p className="text-sm text-muted-foreground">Dégradés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.summary.down}</p>
                  <p className="text-sm text-muted-foreground">Hors ligne</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.summary.maintenance}</p>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Services
          </CardTitle>
          <CardDescription>
            État de tous les services surveillés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData?.services && healthData.services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Latence</TableHead>
                  <TableHead>Taux d'erreur</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthData.services.map((service) => (
                  <TableRow key={service.serviceName}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        {service.serviceName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${
                          statusConfig[service.status]?.color
                        } border-current`}
                      >
                        {getStatusIcon(service.status)}
                        <span className="ml-1">
                          {statusConfig[service.status]?.label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${
                          (service.latencyMs ?? 0) > 500
                            ? "text-red-600"
                            : (service.latencyMs ?? 0) > 200
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatLatency(service.latencyMs)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${
                          service.errorRate > 5
                            ? "text-red-600"
                            : service.errorRate > 1
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {service.errorRate.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(service.recordedAt), "HH:mm:ss", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedService(
                            selectedService === service.serviceName
                              ? null
                              : service.serviceName
                          )
                        }
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Historique
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée de surveillance disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service History Chart */}
      {selectedService && historyData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historique - {selectedService}</CardTitle>
                <CardDescription>
                  Évolution de la latence sur les dernières heures
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedService(null)}
              >
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {historyData.records && historyData.records.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData.records.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="recordedAt"
                      tickFormatter={(value) =>
                        format(new Date(value), "HH:mm", { locale: fr })
                      }
                    />
                    <YAxis
                      label={{
                        value: "Latence (ms)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      labelFormatter={(value) =>
                        format(new Date(value), "dd MMM HH:mm", { locale: fr })
                      }
                      formatter={(value: any) => [`${value}ms`, "Latence"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="latencyMs"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune donnée historique disponible
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}