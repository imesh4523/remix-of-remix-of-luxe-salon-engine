import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Filter, Clock, CheckCircle, XCircle,
  AlertTriangle, Send, User, Shield, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useSupportTickets,
  useTicketMessages,
  useSendTicketMessage,
  useUpdateTicketStatus,
  useRealtimeTickets,
  SupportTicket,
} from '@/hooks/useAdminData';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/20 text-info',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/20 text-destructive animate-pulse',
};

const statusIcons = {
  open: <Clock className="h-4 w-4 text-warning" />,
  in_progress: <AlertTriangle className="h-4 w-4 text-info" />,
  resolved: <CheckCircle className="h-4 w-4 text-success" />,
  closed: <XCircle className="h-4 w-4 text-muted-foreground" />,
};

export const SupportTickets = () => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { data: tickets, isLoading } = useSupportTickets(statusFilter);
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(selectedTicket?.id);
  const sendMessage = useSendTicketMessage();
  const updateStatus = useUpdateTicketStatus();

  // Subscribe to realtime updates
  useRealtimeTickets();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedTicket || !message.trim() || !user) return;

    await sendMessage.mutateAsync({
      ticketId: selectedTicket.id,
      senderId: user.id,
      message: message.trim(),
      isAdmin: true,
    });

    // If ticket was open, move to in_progress
    if (selectedTicket.status === 'open') {
      await updateStatus.mutateAsync({
        ticketId: selectedTicket.id,
        status: 'in_progress',
        assignedAdminId: user.id,
      });
    }

    setMessage('');
  };

  const handleUpdateStatus = async (status: SupportTicket['status']) => {
    if (!selectedTicket) return;
    await updateStatus.mutateAsync({ ticketId: selectedTicket.id, status });
    setSelectedTicket({ ...selectedTicket, status });
  };

  const openCount = tickets?.filter(t => t.status === 'open').length || 0;
  const inProgressCount = tickets?.filter(t => t.status === 'in_progress').length || 0;

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Ticket List */}
      <Card className={cn(
        "glass-card border-border/50 flex-shrink-0 transition-all duration-300",
        selectedTicket ? "w-80 hidden lg:block" : "w-full lg:w-96"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Support Tickets
            </CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-warning/20 text-warning">{openCount} Open</Badge>
              <Badge className="bg-info/20 text-info">{inProgressCount} Active</Badge>
            </div>
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mt-4">
            <TabsList className="glass-card w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
              <TabsTrigger value="in_progress" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-2">
          <ScrollArea className="h-[calc(100vh-22rem)]">
            {isLoading ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : tickets && tickets.length > 0 ? (
              <div className="space-y-2 p-2">
                <AnimatePresence>
                  {tickets.map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedTicket(ticket)}
                      className={cn(
                        "p-3 rounded-xl cursor-pointer transition-all border",
                        selectedTicket?.id === ticket.id
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted/30 border-transparent hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{statusIcons[ticket.status]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={cn("text-xs", priorityColors[ticket.priority])}>
                              {ticket.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tickets found</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Panel */}
      {selectedTicket ? (
        <Card className="glass-card border-border/50 flex-1 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h3 className="font-serif text-lg font-semibold">{selectedTicket.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    Ticket #{selectedTicket.id.slice(0, 8)} • {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[selectedTicket.priority]}>
                  {selectedTicket.priority}
                </Badge>
                <Button
                  size="sm"
                  variant={selectedTicket.status === 'resolved' ? 'outline' : 'default'}
                  onClick={() => handleUpdateStatus(selectedTicket.status === 'resolved' ? 'in_progress' : 'resolved')}
                  className="gap-2"
                >
                  {selectedTicket.status === 'resolved' ? (
                    <>
                      <Clock className="h-4 w-4" />
                      Reopen
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Resolve
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-3/4" />
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {/* Initial ticket description */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                      <p className="text-sm">{selectedTicket.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(selectedTicket.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Chat messages */}
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        msg.is_admin && "flex-row-reverse"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={msg.is_admin ? 'bg-primary/20 text-primary' : 'bg-muted'}>
                          {msg.is_admin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "rounded-2xl p-3 max-w-[80%]",
                          msg.is_admin
                            ? "bg-primary/20 rounded-tr-none"
                            : "bg-muted/50 rounded-tl-none"
                        )}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t border-border/50 p-4">
            <div className="flex gap-3">
              <Textarea
                placeholder="Type your response..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-muted/50 min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessage.isPending}
                className="self-end shadow-glow-rose"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center glass-card rounded-2xl border border-border/50">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a ticket to view conversation</p>
          </div>
        </div>
      )}
    </div>
  );
};
