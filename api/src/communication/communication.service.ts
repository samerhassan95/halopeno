import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const OPEN_LIKE = ['OPEN', 'IN_PROGRESS'];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [tickets, contactMessages, complaints, articles] = await Promise.all([
      this.prisma.supportTicket.findMany({
        include: { replies: { orderBy: { createdAt: 'asc' } } },
      }),
      this.prisma.contactMessage.findMany({ select: { status: true, createdAt: true } }),
      this.prisma.complaint.findMany({ select: { status: true, createdAt: true } }),
      this.prisma.knowledgeBaseArticle.findMany({ select: { isPublished: true } }),
    ]);

    const openTickets = tickets.filter((t) => OPEN_LIKE.includes(t.status)).length;
    const unassignedTickets = tickets.filter((t) => !t.assignedTo && OPEN_LIKE.includes(t.status)).length;
    const overdueTickets = tickets.filter(
      (t) => t.slaDueAt && t.slaDueAt < now && OPEN_LIKE.includes(t.status),
    ).length;

    const responseTimes: number[] = [];
    const resolutionTimes: number[] = [];
    for (const t of tickets) {
      const firstAgentReply = t.replies.find((r) => r.authorType === 'agent' && !r.isInternal);
      if (firstAgentReply) {
        responseTimes.push((firstAgentReply.createdAt.getTime() - t.createdAt.getTime()) / 3_600_000);
      }
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') {
        resolutionTimes.push((t.updatedAt.getTime() - t.createdAt.getTime()) / 3_600_000);
      }
    }
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

    const statusCounts = new Map<string, number>();
    const priorityCounts = new Map<string, number>();
    const trendMap = new Map<string, number>();
    for (const t of tickets) {
      statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
      priorityCounts.set(t.priority, (priorityCounts.get(t.priority) ?? 0) + 1);
      if (t.createdAt >= thirtyDaysAgo) {
        const key = dayKey(t.createdAt);
        trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
      }
    }

    return {
      kpis: {
        openTickets,
        unassignedTickets,
        overdueTickets,
        newContactMessages: contactMessages.filter((m) => m.status === 'new').length,
        openComplaints: complaints.filter((c) => c.status === 'open').length,
        avgResponseTimeHours: Math.round(avg(responseTimes) * 10) / 10,
        avgResolutionTimeHours: Math.round(avg(resolutionTimes) * 10) / 10,
        publishedArticles: articles.filter((a) => a.isPublished).length,
        totalTickets: tickets.length,
      },
      ticketsByStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      ticketsByPriority: Array.from(priorityCounts.entries()).map(([priority, count]) => ({ priority, count })),
      ticketsTrend: Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentTickets: tickets
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 8)
        .map((t) => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          assignedTo: t.assignedTo,
          createdAt: t.createdAt,
        })),
    };
  }
}
