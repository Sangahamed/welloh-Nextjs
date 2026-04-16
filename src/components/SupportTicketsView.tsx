import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  category: "general" | "technical" | "billing" | "report" | "feedback";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

const statusConfig = {
  open: { label: "Ouvert", variant: "default" as const, icon: AlertCircle },
  in_progress: { label: "En cours", variant: "secondary" as const, icon: Clock },
  waiting_user: { label: "En attente", variant: "outline" as const, icon: Clock },
  resolved: { label: "Résolu", variant: "default" as const, icon: CheckCircle },
  closed: { label: "Fermé", variant: "secondary" as const, icon: CheckCircle },
};

const priorityConfig = {
  low: { label: "Basse", variant: "secondary" as const },
  normal: { label: "Normale", variant: "default" as const },
  high: { label: "Élevée", variant: "destructive" as const },
  urgent: { label: "Urgente", variant: "destructive" as const },
};

const categoryConfig = {
  general: "Général",
  technical: "Technique",
  billing: "Facturation",
  report: "Signalement",
  feedback: "Feedback",
};

export default function SupportTicketsView() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    category: "general" as SupportTicket["category"],
    priority: "normal" as SupportTicket["priority"],
  });

  const queryClient = useQueryClient();

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const response = await fetch("/api/support/tickets");
      if (!response.ok) throw new Error("Failed to fetch tickets");
      return response.json();
    },
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof newTicket) => {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create ticket");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setIsCreating(false);
      setNewTicket({ subject: "", message: "", category: "general", priority: "normal" });
      toast.success("Ticket créé avec succès");
    },
    onError: () => {
      toast.error("Échec de la création du ticket");
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      if (selectedTicket) {
        queryClient.invalidateQueries({ queryKey: ["support-ticket", selectedTicket.id] });
      }
      setNewMessage("");
      toast.success("Message envoyé");
    },
    onError: () => {
      toast.error("Échec de l'envoi du message");
    },
  });

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    createTicketMutation.mutate(newTicket);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    sendMessageMutation.mutate({ ticketId: selectedTicket.id, message: newMessage });
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    // Fetch full ticket with messages
    const response = await fetch(`/api/support/tickets/${ticket.id}`);
    if (response.ok) {
      const fullTicket = await response.json();
      setSelectedTicket(fullTicket);
    }
  };

  if (selectedTicket) {
    const StatusIcon = statusConfig[selectedTicket.status]?.icon || Clock;

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux tickets
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTicket.subject}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <Badge variant={statusConfig[selectedTicket.status]?.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[selectedTicket.status]?.label}
                  </Badge>
                  <Badge variant={priorityConfig[selectedTicket.priority]?.variant}>
                    {priorityConfig[selectedTicket.priority]?.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {categoryConfig[selectedTicket.category]}
                  </span>
                </CardDescription>
              </div>
              <span className="text-sm text-muted-foreground">
                Créé le {format(new Date(selectedTicket.createdAt), "dd MMM yyyy", { locale: fr })}
              </span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedTicket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.senderId === selectedTicket.userId ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${
                      msg.senderId === selectedTicket.userId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div
                    className={`flex-1 rounded-lg p-3 ${
                      msg.senderId === selectedTicket.userId
                        ? "bg-primary/10"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support</h2>
          <p className="text-muted-foreground">Contactez notre équipe support</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau ticket de support</DialogTitle>
              <DialogDescription>
                Décrivez votre problème et nous vous répondrons dans les plus brefs délais.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Sujet</label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Ex: Problème de connexion"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Catégorie</label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(v) => setNewTicket({ ...newTicket, category: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                      <SelectItem value="billing">Facturation</SelectItem>
                      <SelectItem value="report">Signalement</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Priorité</label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <Textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Décrivez votre problème en détail..."
                  rows={4}
                />
              </div>
              <Button
                onClick={handleCreateTicket}
                disabled={createTicketMutation.isPending}
                className="w-full"
              >
                Créer le ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun ticket de support</p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez un ticket pour contacter le support
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => {
            const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSelectTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <Badge variant={statusConfig[ticket.status]?.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[ticket.status]?.label}
                        </Badge>
                        <Badge variant={priorityConfig[ticket.priority]?.variant} className="text-xs">
                          {priorityConfig[ticket.priority]?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {ticket.message}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground ml-4">
                      {format(new Date(ticket.createdAt), "dd MMM", { locale: fr })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}