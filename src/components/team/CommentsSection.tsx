import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Trash2 } from "lucide-react";

interface CommentsSectionProps {
  entityType: string;
  entityId: string;
}

export const CommentsSection = ({ entityType, entityId }: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user emails separately
      const commentsWithEmails = await Promise.all(
        data.map(async (comment) => {
          const { data: userData } = await supabase.auth.admin.getUserById(comment.user_id);
          return {
            ...comment,
            userEmail: userData?.user?.email || 'Usuário'
          };
        })
      );
      
      return commentsWithEmails;
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          user_id: currentUser.id,
          content
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      setNewComment("");
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi publicado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      toast({
        title: "Comentário removido",
        description: "O comentário foi removido com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover comentário",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  if (isLoading) {
    return <div>Carregando comentários...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comentários</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicione um comentário..."
          rows={3}
        />
        <Button type="submit" disabled={addCommentMutation.isPending || !newComment.trim()}>
          {addCommentMutation.isPending ? 'Publicando...' : 'Publicar Comentário'}
        </Button>
      </form>

      <div className="space-y-3">
        {comments?.map((comment) => (
          <Card key={comment.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{comment.userEmail}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
              
              {currentUser?.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}

        {comments?.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </Card>
        )}
      </div>
    </div>
  );
};
