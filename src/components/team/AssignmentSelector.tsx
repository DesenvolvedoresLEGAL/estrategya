import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface AssignmentSelectorProps {
  companyId: string;
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
}

export const AssignmentSelector = ({ 
  companyId, 
  value, 
  onValueChange,
  label = "Responsável" 
}: AssignmentSelectorProps) => {
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members-select', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      // Get user emails separately
      const membersWithEmails = await Promise.all(
        data.map(async (member) => {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
          return {
            user_id: member.user_id,
            userEmail: userData?.user?.email || 'Email não disponível'
          };
        })
      );
      
      return membersWithEmails.sort((a, b) => a.userEmail.localeCompare(b.userEmail));
    }
  });

  if (isLoading) {
    return <div>Carregando membros...</div>;
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <User className="h-4 w-4" />
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nenhum responsável</SelectItem>
          {teamMembers?.map((member) => (
            <SelectItem key={member.user_id} value={member.user_id}>
              {member.userEmail}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
