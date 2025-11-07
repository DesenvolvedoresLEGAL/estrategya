import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  HelpCircle, 
  User, 
  Calendar, 
  MapPin, 
  List, 
  DollarSign 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FiveW2HData {
  what?: string;
  why?: string;
  who?: string;
  when_deadline?: string;
  where_location?: string;
  how?: string;
  how_much?: number;
}

interface FiveW2HDisplayProps {
  data: FiveW2HData;
}

export const FiveW2HDisplay = ({ data }: FiveW2HDisplayProps) => {
  const isEmpty = !data.what && !data.why && !data.who && !data.when_deadline && 
                  !data.where_location && !data.how && !data.how_much;

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          5W2H ainda não preenchido. Use o botão "Preencher com IA" para começar.
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value?: number) => {
    if (!value) return "Não definido";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não definido";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* What */}
      {data.what && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">What (O que)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.what}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Why */}
      {data.why && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Why (Por que)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.why}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Who */}
      {data.who && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Who (Quem)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">
              {data.who}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* When */}
      {data.when_deadline && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">When (Quando)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {formatDate(data.when_deadline)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Where */}
      {data.where_location && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">Where (Onde)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {data.where_location}
            </p>
          </CardContent>
        </Card>
      )}

      {/* How Much */}
      {data.how_much !== null && data.how_much !== undefined && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">How Much (Quanto)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary">
              {formatCurrency(data.how_much)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* How */}
      {data.how && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg">How (Como)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {data.how}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
