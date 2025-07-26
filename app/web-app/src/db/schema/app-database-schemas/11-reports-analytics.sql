-- Reports & Analytics Tables

-- Reports
CREATE TABLE IF NOT EXISTS analytics.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    status report_status DEFAULT 'generating',
    is_tagged BOOLEAN DEFAULT false,
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (date_range_end >= date_range_start),
    CONSTRAINT valid_review CHECK (
        (is_reviewed = false AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
        (is_reviewed = true AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    )
);

-- Create indexes for reports
CREATE INDEX idx_reports_generated_by ON analytics.reports(generated_by);
CREATE INDEX idx_reports_teacher_id ON analytics.reports(teacher_id);
CREATE INDEX idx_reports_type ON analytics.reports(report_type);
CREATE INDEX idx_reports_status ON analytics.reports(status);
CREATE INDEX idx_reports_date_range ON analytics.reports(date_range_start, date_range_end);
CREATE INDEX idx_reports_is_tagged ON analytics.reports(is_tagged);
CREATE INDEX idx_reports_is_reviewed ON analytics.reports(is_reviewed);
CREATE INDEX idx_reports_created_at ON analytics.reports(created_at DESC);