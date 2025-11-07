import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface SegmentQuestion {
  field: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

interface Props {
  questions: SegmentQuestion[];
  answers: Record<string, any>;
  onChange: (field: string, value: string) => void;
  loading?: boolean;
  segment: string;
}

export const SegmentQuestionsSection = ({ 
  questions, 
  answers, 
  onChange, 
  loading, 
  segment 
}: Props) => {
  if (loading) {
    return <LoadingSkeleton type="form" />;
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Informações Específicas
          <Badge variant="default" className="ml-auto">
            {segment}
          </Badge>
        </CardTitle>
        <CardDescription>
          Perguntas personalizadas para seu segmento que nos ajudarão a gerar insights mais precisos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question) => (
          <div key={question.field} className="space-y-2">
            <Label htmlFor={question.field}>
              {question.label}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {question.type === 'textarea' ? (
              <Textarea
                id={question.field}
                placeholder={question.placeholder}
                value={answers[question.field] || ''}
                onChange={(e) => onChange(question.field, e.target.value)}
                className="min-h-[80px]"
              />
            ) : (
              <Input
                id={question.field}
                type={question.type}
                placeholder={question.placeholder}
                value={answers[question.field] || ''}
                onChange={(e) => onChange(question.field, e.target.value)}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
