import { 
  pgTable, 
  pgSchema, 
  uuid, 
  varchar, 
  text,
  boolean, 
  timestamp,
  integer,
  index,
  foreignKey,
  unique
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { resourceTypeEnum, resourceCategoryEnum, interactionTypeEnum } from './core';

// Use core schema for resources
const coreSchema = pgSchema('core');

// Resources & Content Library
export const resources = coreSchema.table('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  resourceUrl: varchar('resource_url', { length: 500 }).notNull(),
  source: varchar('source', { length: 255 }),
  resourceType: resourceTypeEnum('resource_type').notNull(),
  category: resourceCategoryEnum('category').notNull().default('all'),
  likesCount: integer('likes_count').notNull().default(0),
  viewsCount: integer('views_count').notNull().default(0),
  tags: text('tags').array(),
  gradeLevels: text('grade_levels').array(),
  subjects: text('subjects').array(),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  typeIdx: index('idx_resources_type').on(table.resourceType),
  categoryIdx: index('idx_resources_category').on(table.category),
  isFeaturedIdx: index('idx_resources_is_featured').on(table.isFeatured),
  createdByIdx: index('idx_resources_created_by').on(table.createdBy),
  tagsIdx: index('idx_resources_tags').on(table.tags),
  gradeLevelsIdx: index('idx_resources_grade_levels').on(table.gradeLevels),
  subjectsIdx: index('idx_resources_subjects').on(table.subjects),
  popularityIdx: index('idx_resources_popularity').on(table.likesCount, table.viewsCount),
  createdByFk: foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: 'resources_created_by_fkey'
  }).onDelete('set null'),
}));

export const resourceInteractions = coreSchema.table('resource_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  resourceId: uuid('resource_id').notNull(),
  interactionType: interactionTypeEnum('interaction_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_resource_interactions_user_id').on(table.userId),
  resourceIdIdx: index('idx_resource_interactions_resource_id').on(table.resourceId),
  typeIdx: index('idx_resource_interactions_type').on(table.interactionType),
  createdAtIdx: index('idx_resource_interactions_created_at').on(table.createdAt),
  uniqueInteraction: unique('resource_interactions_user_id_resource_id_interaction_type_key').on(
    table.userId, 
    table.resourceId, 
    table.interactionType
  ),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'resource_interactions_user_id_fkey'
  }).onDelete('cascade'),
  resourceIdFk: foreignKey({
    columns: [table.resourceId],
    foreignColumns: [resources.id],
    name: 'resource_interactions_resource_id_fkey'
  }).onDelete('cascade'),
}));

// Type exports
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type ResourceInteraction = typeof resourceInteractions.$inferSelect;
export type NewResourceInteraction = typeof resourceInteractions.$inferInsert;

// Utility types for resources
export interface ResourceWithInteractions extends Resource {
  userInteraction?: {
    hasLiked: boolean;
    hasBookmarked: boolean;
    hasViewed: boolean;
  };
}

export interface PopularResource {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  category: string;
  likesCount: number;
  viewsCount: number;
  tags: string[];
  isFeatured: boolean;
}

export interface ResourceFilters {
  type?: string;
  category?: string;
  gradeLevels?: string[];
  subjects?: string[];
  tags?: string[];
  isFeatured?: boolean;
  search?: string;
}