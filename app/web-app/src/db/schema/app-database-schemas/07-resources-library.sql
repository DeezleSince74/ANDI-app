-- Resources & Content Library Tables

-- Resources
CREATE TABLE IF NOT EXISTS core.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    resource_url VARCHAR(500) NOT NULL,
    source VARCHAR(255),
    resource_type resource_type NOT NULL,
    category resource_category DEFAULT 'all',
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    tags TEXT[],
    grade_levels TEXT[],
    subjects TEXT[],
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resource Interactions
CREATE TABLE IF NOT EXISTS core.resource_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES core.resources(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id, interaction_type)
);

-- Create indexes for resources
CREATE INDEX idx_resources_type ON core.resources(resource_type);
CREATE INDEX idx_resources_category ON core.resources(category);
CREATE INDEX idx_resources_is_featured ON core.resources(is_featured);
CREATE INDEX idx_resources_created_by ON core.resources(created_by);
CREATE INDEX idx_resources_tags ON core.resources USING GIN(tags);
CREATE INDEX idx_resources_grade_levels ON core.resources USING GIN(grade_levels);
CREATE INDEX idx_resources_subjects ON core.resources USING GIN(subjects);
CREATE INDEX idx_resources_popularity ON core.resources(likes_count DESC, views_count DESC);
CREATE INDEX idx_resource_interactions_user_id ON core.resource_interactions(user_id);
CREATE INDEX idx_resource_interactions_resource_id ON core.resource_interactions(resource_id);
CREATE INDEX idx_resource_interactions_type ON core.resource_interactions(interaction_type);
CREATE INDEX idx_resource_interactions_created_at ON core.resource_interactions(created_at);