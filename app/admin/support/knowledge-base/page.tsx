"use client";

import * as React from "react";
import { WifiOff, FileText, CheckCircle2, FilePenLine, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { CardSkeleton, TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  category: string | null;
  isPublished: boolean;
  createdAt: string;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = React.useState<Article[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", slug: "", category: "", content: "" });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    api
      .get<{ data: Article[] }>("/support/knowledge-base-articles?limit=100")
      .then((res) => setArticles(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the API"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function togglePublished(article: Article) {
    try {
      const updated = await api.patch<Article>(`/support/knowledge-base-articles/${article.id}`, {
        isPublished: !article.isPublished,
      });
      setArticles((prev) => prev!.map((a) => (a.id === article.id ? updated : a)));
      toast.success(updated.isPublished ? "Article published" : "Article unpublished");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update article");
    }
  }

  async function createArticle() {
    setSaving(true);
    try {
      const created = await api.post<Article>("/support/knowledge-base-articles", {
        title: form.title,
        slug: form.slug,
        category: form.category || null,
        content: form.content || null,
        isPublished: false,
      });
      setArticles((prev) => [created, ...(prev ?? [])]);
      setCreateOpen(false);
      setForm({ title: "", slug: "", category: "", content: "" });
      toast.success("Article created as draft");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create article");
    } finally {
      setSaving(false);
    }
  }

  const published = articles?.filter((a) => a.isPublished).length ?? 0;
  const draft = (articles?.length ?? 0) - published;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Self-service help articles for customers and staff</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New article
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-[#92640a] dark:text-warning">
          <WifiOff className="size-4 shrink-0" />Live API unreachable ({error}) — showing no data.
        </div>
      )}

      {!articles ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard icon={FileText} tone="primary" title="Total articles" value={String(articles.length)} />
          <StatCard icon={CheckCircle2} tone="success" title="Published" value={String(published)} />
          <StatCard icon={FilePenLine} tone="warning" title="Drafts" value={String(draft)} />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!articles ? (
            <TableSkeleton rows={5} cols={4} />
          ) : articles.length === 0 ? (
            <EmptyState title="No articles yet" description="Create your first help article." className="py-16" />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Published</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="text-muted-foreground">{a.category ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={a.isPublished} onCheckedChange={() => togglePublished(a)} />
                        <Badge variant={a.isPublished ? "success" : "secondary"}>{a.isPublished ? "Published" : "Draft"}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New knowledge base article</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea rows={5} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createArticle} disabled={saving || !form.title.trim() || !form.slug.trim()}>
              {saving ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
