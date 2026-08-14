import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, HelpCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  resource_type: string;
  target_role: string | null;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"guides" | "faq" | "docs">("guides");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Ressources — Union'S";
    const fetchData = async () => {
      const [{ data: res }, { data: faq }] = await Promise.all([
        supabase.from("resources").select("*").eq("is_published", true).order("sort_order"),
        supabase.from("faq_items").select("*").eq("is_published", true).order("sort_order"),
      ]);
      setResources(res || []);
      setFaqItems(faq || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const guides = resources.filter(r => r.resource_type === "guide");
  const docs = resources.filter(r => r.resource_type === "documentation");

  const renderMarkdown = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h2 key={i} className="mb-4 mt-6 font-display text-2xl font-semibold text-foreground">{line.slice(2)}</h2>;
      if (line.startsWith("## ")) return <h3 key={i} className="mb-3 mt-5 font-display text-xl font-semibold text-foreground">{line.slice(3)}</h3>;
      if (line.startsWith("### ")) return <h4 key={i} className="mb-2 mt-4 font-display text-lg font-semibold text-foreground">{line.slice(4)}</h4>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1 text-muted-foreground list-disc">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="mb-2 text-muted-foreground leading-relaxed">{line}</p>;
    });
  };

  const faqCategories = [...new Set(faqItems.map(f => f.category))];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-6 pb-20 pt-28">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-display text-4xl font-bold text-foreground">Ressources</h1>
          <p className="text-muted-foreground">Guides, FAQ et documentation pour réussir dans l'écosystème startup africain</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex justify-center gap-2">
          {[
            { id: "guides" as const, label: "Guides Startup", icon: BookOpen },
            { id: "faq" as const, label: "FAQ", icon: HelpCircle },
            { id: "docs" as const, label: "Documentation", icon: FileText },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "bg-gradient-gold text-primary-foreground" : ""}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Guides */}
            {activeTab === "guides" && (
              <div className="space-y-4">
                {guides.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Aucun guide disponible</div>
                ) : guides.map((guide, i) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedResource(expandedResource === guide.id ? null : guide.id)}
                      className="flex w-full items-center justify-between p-6 text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h3 className="font-display text-lg font-semibold text-foreground">{guide.title}</h3>
                        </div>
                        {guide.description && <p className="text-sm text-muted-foreground">{guide.description}</p>}
                        {guide.target_role && (
                          <Badge variant="secondary" className="mt-2 text-xs">{guide.target_role}</Badge>
                        )}
                      </div>
                      {expandedResource === guide.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    {expandedResource === guide.id && guide.content && (
                      <div className="border-t border-border px-6 pb-6 pt-4">
                        {renderMarkdown(guide.content)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* FAQ */}
            {activeTab === "faq" && (
              <div className="space-y-8">
                {faqCategories.map(category => (
                  <div key={category}>
                    <h3 className="mb-4 font-display text-lg font-semibold text-foreground capitalize">{category}</h3>
                    <div className="space-y-2">
                      {faqItems.filter(f => f.category === category).map(item => (
                        <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                            className="flex w-full items-center justify-between p-4 text-left"
                          >
                            <span className="pr-4 font-medium text-foreground">{item.question}</span>
                            {expandedFaq === item.id ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          </button>
                          {expandedFaq === item.id && (
                            <div className="border-t border-border px-4 pb-4 pt-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {faqItems.length === 0 && (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Aucune question fréquente</div>
                )}
              </div>
            )}

            {/* Documentation */}
            {activeTab === "docs" && (
              <div className="space-y-4">
                {docs.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Aucune documentation disponible</div>
                ) : docs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedResource(expandedResource === doc.id ? null : doc.id)}
                      className="flex w-full items-center justify-between p-6 text-left"
                    >
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">{doc.title}</h3>
                        {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
                      </div>
                      {expandedResource === doc.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    {expandedResource === doc.id && doc.content && (
                      <div className="border-t border-border px-6 pb-6 pt-4">
                        {renderMarkdown(doc.content)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Resources;
