import { OnboardingContent, OnboardingGoal } from "@/types/onboarding"

// Mock data for now - will be replaced with API calls
export async function getOnboardingContent(screenName: string): Promise<OnboardingContent[]> {
  // This will be replaced with an actual API call
  const mockData: Record<string, OnboardingContent[]> = {
    'grade_levels': [
      { id: '1', screen_name: 'grade_levels', content_type: 'option', content_key: 'pre-k', content_value: 'Pre-K', display_order: 1, is_active: true },
      { id: '2', screen_name: 'grade_levels', content_type: 'option', content_key: 'kindergarten', content_value: 'Kindergarten', display_order: 2, is_active: true },
      { id: '3', screen_name: 'grade_levels', content_type: 'option', content_key: '1st', content_value: '1st Grade', display_order: 3, is_active: true },
      { id: '4', screen_name: 'grade_levels', content_type: 'option', content_key: '2nd', content_value: '2nd Grade', display_order: 4, is_active: true },
      { id: '5', screen_name: 'grade_levels', content_type: 'option', content_key: '3rd', content_value: '3rd Grade', display_order: 5, is_active: true },
      { id: '6', screen_name: 'grade_levels', content_type: 'option', content_key: '4th', content_value: '4th Grade', display_order: 6, is_active: true },
      { id: '7', screen_name: 'grade_levels', content_type: 'option', content_key: '5th', content_value: '5th Grade', display_order: 7, is_active: true },
      { id: '8', screen_name: 'grade_levels', content_type: 'option', content_key: '6th', content_value: '6th Grade', display_order: 8, is_active: true },
      { id: '9', screen_name: 'grade_levels', content_type: 'option', content_key: '7th', content_value: '7th Grade', display_order: 9, is_active: true },
      { id: '10', screen_name: 'grade_levels', content_type: 'option', content_key: '8th', content_value: '8th Grade', display_order: 10, is_active: true },
      { id: '11', screen_name: 'grade_levels', content_type: 'option', content_key: '9th', content_value: '9th Grade', display_order: 11, is_active: true },
      { id: '12', screen_name: 'grade_levels', content_type: 'option', content_key: '10th', content_value: '10th Grade', display_order: 12, is_active: true },
      { id: '13', screen_name: 'grade_levels', content_type: 'option', content_key: '11th', content_value: '11th Grade', display_order: 13, is_active: true },
      { id: '14', screen_name: 'grade_levels', content_type: 'option', content_key: '12th', content_value: '12th Grade', display_order: 14, is_active: true },
      { id: '15', screen_name: 'grade_levels', content_type: 'option', content_key: 'college', content_value: 'College/University', display_order: 15, is_active: true },
      { id: '16', screen_name: 'grade_levels', content_type: 'option', content_key: 'other', content_value: 'Other', display_order: 16, is_active: true },
    ],
    'subjects_taught': [
      { id: '17', screen_name: 'subjects_taught', content_type: 'option', content_key: 'language_arts', content_value: 'Language Arts/English', display_order: 1, is_active: true, metadata: { category: 'core' } },
      { id: '18', screen_name: 'subjects_taught', content_type: 'option', content_key: 'mathematics', content_value: 'Mathematics', display_order: 2, is_active: true, metadata: { category: 'core' } },
      { id: '19', screen_name: 'subjects_taught', content_type: 'option', content_key: 'science', content_value: 'Science', display_order: 3, is_active: true, metadata: { category: 'core' } },
      { id: '20', screen_name: 'subjects_taught', content_type: 'option', content_key: 'social_studies', content_value: 'Social Studies & History', display_order: 4, is_active: true, metadata: { category: 'core' } },
      { id: '21', screen_name: 'subjects_taught', content_type: 'option', content_key: 'foreign_languages', content_value: 'Foreign Languages', display_order: 5, is_active: true, metadata: { category: 'specialized' } },
      { id: '22', screen_name: 'subjects_taught', content_type: 'option', content_key: 'fine_arts', content_value: 'Fine Arts/Music/Drama', display_order: 6, is_active: true, metadata: { category: 'specialized' } },
      { id: '23', screen_name: 'subjects_taught', content_type: 'option', content_key: 'physical_education', content_value: 'Physical Education & Health', display_order: 7, is_active: true, metadata: { category: 'specialized' } },
      { id: '24', screen_name: 'subjects_taught', content_type: 'option', content_key: 'career_technical', content_value: 'Career & Technical Education', display_order: 8, is_active: true, metadata: { category: 'technical' } },
      { id: '25', screen_name: 'subjects_taught', content_type: 'option', content_key: 'stem_electives', content_value: 'STEM Electives', display_order: 9, is_active: true, metadata: { category: 'technical' } },
      { id: '26', screen_name: 'subjects_taught', content_type: 'option', content_key: 'media_communication', content_value: 'Media and Communication', display_order: 10, is_active: true, metadata: { category: 'technical' } },
      { id: '27', screen_name: 'subjects_taught', content_type: 'option', content_key: 'honors_ap', content_value: 'Honors & Advanced Placement', display_order: 11, is_active: true, metadata: { category: 'advanced' } },
      { id: '28', screen_name: 'subjects_taught', content_type: 'option', content_key: 'ib_program', content_value: 'International Baccalaureate Program', display_order: 12, is_active: true, metadata: { category: 'advanced' } },
    ],
    'teaching_styles': [
      { id: '29', screen_name: 'teaching_styles', content_type: 'option', content_key: 'lunchtime_mentor', content_value: 'Lunchtime Mentor', display_order: 1, is_active: true, metadata: { description: 'Creates safe, welcoming space where students feel valued' } },
      { id: '30', screen_name: 'teaching_styles', content_type: 'option', content_key: 'high_energy_entertainer', content_value: 'High-Energy Entertainer', display_order: 2, is_active: true, metadata: { description: 'Transforms lessons into exciting experiences' } },
      { id: '31', screen_name: 'teaching_styles', content_type: 'option', content_key: 'life_coach', content_value: 'Life Coach', display_order: 3, is_active: true, metadata: { description: 'Inspires students to see potential and tackle challenges' } },
      { id: '32', screen_name: 'teaching_styles', content_type: 'option', content_key: 'chill_teacher', content_value: 'Chill Teacher', display_order: 4, is_active: true, metadata: { description: 'Keeps classroom calm and focused with laid-back approach' } },
    ],
    'personal_interests': [
      { id: '33', screen_name: 'personal_interests', content_type: 'option', content_key: 'outdoor_activities', content_value: 'Outdoor Activities', display_order: 1, is_active: true },
      { id: '34', screen_name: 'personal_interests', content_type: 'option', content_key: 'sports', content_value: 'Sports', display_order: 2, is_active: true },
      { id: '35', screen_name: 'personal_interests', content_type: 'option', content_key: 'traveling', content_value: 'Traveling', display_order: 3, is_active: true },
      { id: '36', screen_name: 'personal_interests', content_type: 'option', content_key: 'reading', content_value: 'Reading', display_order: 4, is_active: true },
      { id: '37', screen_name: 'personal_interests', content_type: 'option', content_key: 'writing', content_value: 'Writing', display_order: 5, is_active: true },
      { id: '38', screen_name: 'personal_interests', content_type: 'option', content_key: 'cooking_baking', content_value: 'Cooking/Baking', display_order: 6, is_active: true },
      { id: '39', screen_name: 'personal_interests', content_type: 'option', content_key: 'gardening', content_value: 'Gardening', display_order: 7, is_active: true },
      { id: '40', screen_name: 'personal_interests', content_type: 'option', content_key: 'music', content_value: 'Music', display_order: 8, is_active: true },
      { id: '41', screen_name: 'personal_interests', content_type: 'option', content_key: 'art_craft', content_value: 'Art and Craft', display_order: 9, is_active: true },
      { id: '42', screen_name: 'personal_interests', content_type: 'option', content_key: 'photography', content_value: 'Photography', display_order: 10, is_active: true },
      { id: '43', screen_name: 'personal_interests', content_type: 'option', content_key: 'yoga_meditation', content_value: 'Yoga/Meditation', display_order: 11, is_active: true },
      { id: '44', screen_name: 'personal_interests', content_type: 'option', content_key: 'fitness_exercise', content_value: 'Fitness & Exercise', display_order: 12, is_active: true },
      { id: '45', screen_name: 'personal_interests', content_type: 'option', content_key: 'movies_tv', content_value: 'Watching Movies/TV Shows', display_order: 13, is_active: true },
      { id: '46', screen_name: 'personal_interests', content_type: 'option', content_key: 'gaming', content_value: 'Gaming', display_order: 14, is_active: true },
    ],
    'teaching_strengths': [
      { id: '47', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'communication_skills', content_value: 'Communication Skills', display_order: 1, is_active: true },
      { id: '48', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'subject_expertise', content_value: 'Subject Matter Expertise', display_order: 2, is_active: true },
      { id: '49', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'adaptability', content_value: 'Adaptability', display_order: 3, is_active: true },
      { id: '50', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'problem_solving', content_value: 'Problem-Solving Skills', display_order: 4, is_active: true },
      { id: '51', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'cultural_competence', content_value: 'Cultural Competence', display_order: 5, is_active: true },
      { id: '52', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'classroom_management', content_value: 'Classroom Management', display_order: 6, is_active: true },
      { id: '53', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'lesson_planning', content_value: 'Effective Lesson Planning', display_order: 7, is_active: true },
      { id: '54', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'empathy_eq', content_value: 'Empathy and Emotional Intelligence', display_order: 8, is_active: true },
      { id: '55', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'collaboration', content_value: 'Collaboration and Teamwork', display_order: 9, is_active: true },
      { id: '56', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'patience', content_value: 'Patience and Perseverance', display_order: 10, is_active: true },
      { id: '57', screen_name: 'teaching_strengths', content_type: 'option', content_key: 'creativity_innovation', content_value: 'Creativity and Innovation', display_order: 11, is_active: true },
    ],
  }

  return mockData[screenName] || []
}

export async function getOnboardingGoals(): Promise<OnboardingGoal[]> {
  // This will be replaced with an actual API call
  return [
    // Equity goals
    { id: '1', category: 'equity', title: 'Increase Student Voice', description: 'Ensure all students have opportunities to share their thoughts and ideas', display_order: 1, is_active: true },
    { id: '2', category: 'equity', title: 'Create Inclusive Environment', description: 'Build a classroom where every student feels valued and respected', display_order: 2, is_active: true },
    { id: '3', category: 'equity', title: 'Address Learning Gaps', description: 'Identify and support students who need additional assistance', display_order: 3, is_active: true },
    { id: '4', category: 'equity', title: 'Foster Cultural Awareness', description: 'Celebrate diversity and integrate culturally responsive teaching', display_order: 4, is_active: true },
    
    // Creativity goals
    { id: '5', category: 'creativity', title: 'Encourage Creative Expression', description: 'Provide opportunities for students to express themselves creatively', display_order: 5, is_active: true },
    { id: '6', category: 'creativity', title: 'Design Engaging Activities', description: 'Develop innovative lessons that spark curiosity and imagination', display_order: 6, is_active: true },
    { id: '7', category: 'creativity', title: 'Support Risk-Taking', description: 'Create safe spaces for students to experiment and learn from mistakes', display_order: 7, is_active: true },
    { id: '8', category: 'creativity', title: 'Integrate Arts & Projects', description: 'Incorporate creative projects and artistic elements into curriculum', display_order: 8, is_active: true },
    
    // Innovation goals
    { id: '9', category: 'innovation', title: 'Connect to Real World', description: 'Help students see how learning applies to their lives and future', display_order: 9, is_active: true },
    { id: '10', category: 'innovation', title: 'Integrate Technology', description: 'Use digital tools to enhance learning experiences', display_order: 10, is_active: true },
    { id: '11', category: 'innovation', title: 'Promote Critical Thinking', description: 'Develop activities that challenge students to think deeply', display_order: 11, is_active: true },
    { id: '12', category: 'innovation', title: 'Encourage Problem-Solving', description: 'Guide students to find creative solutions to complex challenges', display_order: 12, is_active: true },
  ]
}

export async function getOnboardingInstructions(screenName: string): Promise<{ main: string; subtitle?: string; helper?: string }> {
  const instructions: Record<string, { main: string; subtitle?: string; helper?: string }> = {
    'grade_levels': {
      main: 'Which grade levels do you teach?',
      subtitle: "This helps us provide tools and resources suited to your students' needs",
      helper: 'Select all that apply'
    },
    'teaching_experience': {
      main: 'How many years have you been teaching?',
      subtitle: 'Your experience level helps us tailor our focus areas and strategies to your journey'
    },
    'subjects_taught': {
      main: 'What subjects do you teach?',
      subtitle: "Let's focus on the subjects that matter most to you and your students",
      helper: 'Select all that apply'
    },
    'teaching_styles': {
      main: 'How would you describe your teaching style?',
      subtitle: 'Understanding your approach helps us provide tailored recommendations',
      helper: 'Select up to 3'
    },
    'personal_interests': {
      main: 'What are your personal interests?',
      subtitle: "We'll recommend activities and strategies that align with your passions and teaching style",
      helper: 'Select all that apply'
    },
    'teaching_strengths': {
      main: 'What are your greatest strengths as a teacher?',
      subtitle: 'This helps us suggest focus areas and personalized feedback for your growth',
      helper: 'Select all that apply'
    },
    'goal_setting': {
      main: "Let's set your goals",
      subtitle: 'Based on your responses, ANDI will help shape your personalized path using our CIQ framework',
      helper: 'Select 4 goals total: one from Equity, one from Creativity, one from Innovation, and one additional goal of your choice'
    },
    'photo_upload': {
      main: 'Add your photo',
      subtitle: 'Help your students and colleagues recognize you. You can always change this later.',
      helper: 'Upload a clear, professional photo'
    },
    'voice_sample_intro': {
      main: 'Voice Sample Recording',
      subtitle: 'Help ANDI understand your speaking style and tone. This allows us to differentiate your voice from your students during classroom recordings.',
      helper: 'This takes less than 2 minutes'
    },
    'voice_sample_recording': {
      main: 'Please read the following phrase:',
    }
  }

  return instructions[screenName] || { main: '' }
}