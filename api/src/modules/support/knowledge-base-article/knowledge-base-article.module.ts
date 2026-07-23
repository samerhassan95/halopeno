import { Module } from '@nestjs/common';
import { KnowledgeBaseArticleController } from './knowledge-base-article.controller';
import { KnowledgeBaseArticleService } from './knowledge-base-article.service';

@Module({
  controllers: [KnowledgeBaseArticleController],
  providers: [KnowledgeBaseArticleService],
  exports: [KnowledgeBaseArticleService],
})
export class KnowledgeBaseArticleModule {}
