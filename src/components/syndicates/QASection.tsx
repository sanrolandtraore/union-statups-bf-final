import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import type { DealQuestion } from "@/types/syndicate";

interface Props {
  dealId: string;
  isLead: boolean;
}

const QASection = ({ dealId, isLead }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<DealQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("deal_questions")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });
    setQuestions((data as unknown as DealQuestion[]) || []);
  };

  useEffect(() => { fetchQuestions(); }, [dealId]);

  const askQuestion = async () => {
    if (!newQuestion.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("deal_questions").insert({
      deal_id: dealId,
      asked_by: user.id,
      question: newQuestion.trim(),
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setNewQuestion("");
      fetchQuestions();
    }
    setLoading(false);
  };

  const answerQuestion = async (qId: string) => {
    if (!answerText[qId]?.trim() || !user) return;
    const { error } = await supabase
      .from("deal_questions")
      .update({ answer: answerText[qId].trim(), answered_by: user.id, answered_at: new Date().toISOString() })
      .eq("id", qId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setAnswerText((prev) => ({ ...prev, [qId]: "" }));
      fetchQuestions();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-foreground flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" /> Questions & Réponses
      </h3>

      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">{q.question}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(q.created_at).toLocaleDateString("fr-FR")}
            </p>
            {q.answer ? (
              <div className="mt-2 pl-4 border-l-2 border-primary/30">
                <div className="flex items-center gap-1 text-xs text-primary mb-1">
                  <CheckCircle2 className="h-3 w-3" /> Réponse du Lead
                </div>
                <p className="text-sm text-foreground">{q.answer}</p>
              </div>
            ) : isLead ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={answerText[q.id] || ""}
                  onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Répondre..."
                  className="bg-secondary border-border text-sm"
                  rows={2}
                />
                <Button size="sm" onClick={() => answerQuestion(q.id)} className="bg-gradient-gold text-primary-foreground">
                  Répondre
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">En attente de réponse</p>
            )}
          </div>
        ))}
      </div>

      {!isLead && (
        <div className="space-y-2">
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Poser une question au Lead Investor..."
            className="bg-secondary border-border"
            rows={2}
          />
          <Button onClick={askQuestion} disabled={loading || !newQuestion.trim()} size="sm">
            {loading ? "Envoi..." : "Poser la question"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QASection;
