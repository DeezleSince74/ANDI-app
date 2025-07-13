# CIQ Framework LLM Analyzer Prompts

## Overview
This document contains the prompts used by various LLM analyzers to process classroom transcripts and generate insights for the Classroom Impact Quotient (CIQ) framework. Each analyzer focuses on specific aspects of the ECI (Equity, Creativity, Innovation) Blueprint.

---

## Master Analysis Prompt

### Classroom Session Analysis
```
You are an expert educational analyst trained in the CIQ (Classroom Impact Quotient) framework. You will analyze a classroom transcript to identify patterns, behaviors, and interactions that contribute to student learning and engagement.

Your analysis should be:
- Non-evaluative and growth-focused
- Evidence-based using specific quotes and examples
- Focused on identifying strengths and opportunities
- Aligned with the ECI Blueprint for Learning (Equity, Creativity, Innovation)

Transcript to analyze:
[TRANSCRIPT]

Provide your analysis in structured JSON format with specific examples and timestamps where applicable.
```

---

## Equity Analyzers

### E1: Roll Call - Identity and Diversity Recognition
```
Analyze this classroom transcript for evidence of how identities, backgrounds, and diverse perspectives are recognized and valued.

Look for:
1. Cultural validation - Teachers acknowledging students' cultural backgrounds
2. Student voice - Opportunities for students to share unique experiences
3. Inclusive language - Correct name pronunciation, positive community references
4. Awareness of marginalized communities - Recognition of systemic barriers
5. Bias mitigation - Growth mindset language, equal engagement patterns
6. Empathy cultivation - Perspective-taking and supportive interactions
7. Storytelling opportunities - Personal narratives and counter-narratives

For each instance found, provide:
- Timestamp
- Speaker
- Quote/description
- Type of equity indicator
- Impact assessment (positive/neutral/needs improvement)

Output format:
{
  "identity_recognition": {
    "score": 0-10,
    "instances": [...],
    "patterns": "overall pattern description",
    "strengths": [...],
    "opportunities": [...]
  }
}
```

### E2: Safety First - Psychological Safety
```
Analyze this classroom transcript for evidence of psychological safety and emotional security.

Identify:
1. Risk-taking encouragement - Students sharing ideas without fear
2. Mistake normalization - Errors treated as learning opportunities  
3. Respectful communication - Tone, language, and interaction patterns
4. Emotional support - Recognition and validation of feelings
5. Safe space indicators - Students expressing vulnerability or uncertainty

For each instance, note:
- Evidence type
- Impact on classroom climate
- Student response/engagement level

Output format:
{
  "psychological_safety": {
    "score": 0-10,
    "risk_taking_instances": [...],
    "supportive_language": [...],
    "climate_description": "text",
    "recommendations": [...]
  }
}
```

### E3: Everything for Everyone - Access and Resources
```
Analyze this transcript for evidence of equitable access to learning opportunities and resources.

Examine:
1. Differentiated instruction - Multiple ways to engage with content
2. Resource distribution - Fair access to materials and attention
3. Accommodation indicators - Support for diverse learning needs
4. Participation opportunities - All students able to contribute
5. Language accessibility - Clear explanations, vocabulary support

Output format:
{
  "access_equity": {
    "score": 0-10,
    "differentiation_examples": [...],
    "participation_balance": {
      "high_participators": count,
      "low_participators": count,
      "teacher_efforts": [...]
    },
    "barriers_identified": [...],
    "inclusive_practices": [...]
  }
}
```

### E4: Can You Hear Me Now - Voice Elevation
```
Analyze student voice and participation patterns in this transcript.

Measure:
1. Talk time distribution - Teacher vs. student, individual student patterns
2. Question quality - Bloom's taxonomy levels for both teacher and student questions
3. Idea validation - How student contributions are received
4. Turn-taking patterns - Who speaks when and for how long
5. Marginalized voice amplification - Efforts to include quiet students

Calculate:
- Teacher talk percentage
- Student talk percentage  
- Number of student-initiated questions
- Depth of student responses

Output format:
{
  "voice_elevation": {
    "score": 0-10,
    "talk_time_ratio": {
      "teacher": percentage,
      "students": percentage
    },
    "participation_data": [...],
    "question_analysis": {
      "student_questions": {
        "total": count,
        "bloom_levels": {...}
      },
      "teacher_questions": {
        "total": count,
        "bloom_levels": {...}
      }
    }
  }
}
```

### E5: Teamwork Makes the Dream Work - Collaboration
```
Analyze collaborative learning and shared thinking in this transcript.

Identify:
1. Peer-to-peer interactions - Students building on each other's ideas
2. Collaborative structures - Group work, think-pair-share, etc.
3. Collective problem-solving - Students working together
4. Idea synthesis - Combining multiple perspectives
5. Supportive behaviors - Students helping each other

Output format:
{
  "collaboration": {
    "score": 0-10,
    "collaborative_instances": [...],
    "peer_support_examples": [...],
    "group_dynamics": "description",
    "collaboration_quality": "assessment"
  }
}
```

---

## Creativity Analyzers

### C6: Express Yourself - Self-Expression
```
Analyze opportunities for creative self-expression in this transcript.

Look for:
1. Personal choice in learning - Student agency in how they engage
2. Creative interpretation - Unique approaches to problems/concepts
3. Artistic expression - Use of drawing, performance, storytelling
4. Opinion sharing - Students expressing personal views
5. Individual voice - Unique perspectives welcomed

Output format:
{
  "self_expression": {
    "score": 0-10,
    "expression_opportunities": [...],
    "student_creativity_examples": [...],
    "teacher_encouragement": [...],
    "constraints_observed": [...]
  }
}
```

### C7: Play, Get Messy - Experimentation
```
Analyze opportunities for experimentation and playful learning.

Identify:
1. Trial and error encouragement - Freedom to experiment
2. Playful activities - Games, simulations, hands-on exploration
3. "Messy" learning - Comfort with uncertainty and process
4. Risk-taking in learning - Trying new approaches
5. Celebration of mistakes - Learning from errors

Output format:
{
  "experimentation": {
    "score": 0-10,
    "playful_moments": [...],
    "experimentation_instances": [...],
    "teacher_flexibility": "assessment",
    "student_engagement_level": "high/medium/low"
  }
}
```

### C8: Learn by Doing - Active Learning
```
Analyze hands-on, experiential learning opportunities.

Look for:
1. Active participation - Students doing, not just listening
2. Skill application - Practice opportunities
3. Real-world connections - Practical applications
4. Project-based elements - Creating or building something
5. Kinesthetic engagement - Movement and manipulation

Output format:
{
  "active_learning": {
    "score": 0-10,
    "hands_on_activities": [...],
    "skill_practice": [...],
    "engagement_type": "description",
    "learning_modalities": [...]
  }
}
```

### C9: Practice Makes Perfect - Skill Development
```
Analyze evidence of deliberate practice and skill refinement.

Examine:
1. Repetition with variation - Multiple practice opportunities
2. Feedback loops - Immediate correction and improvement
3. Progressive challenge - Increasing difficulty
4. Mastery indicators - Evidence of improvement
5. Reflection on practice - Metacognitive discussions

Output format:
{
  "skill_development": {
    "score": 0-10,
    "practice_opportunities": [...],
    "feedback_instances": [...],
    "improvement_evidence": [...],
    "mastery_progression": "description"
  }
}
```

### C10: Imagination Ignited - Bold Thinking
```
Analyze opportunities for imaginative and bold thinking.

Identify:
1. "What if" questions - Hypothetical thinking
2. Creative problem-solving - Novel solutions
3. Imaginative scenarios - Story creation, future thinking
4. Unconventional ideas - Thinking outside the box
5. Dream big moments - Ambitious goal setting

Output format:
{
  "imagination": {
    "score": 0-10,
    "imaginative_moments": [...],
    "bold_ideas": [...],
    "teacher_response_to_creativity": [...],
    "imagination_barriers": [...]
  }
}
```

---

## Innovation Analyzers

### I11: Hope - Inspiring Possibility
```
Analyze how possibility thinking and optimism are fostered.

Look for:
1. Future-oriented discussions - What's possible
2. Growth mindset language - "Yet," "can learn," "will improve"
3. Inspirational examples - Success stories, role models
4. Goal setting - Aspirational thinking
5. Possibility language - "Could," "might," "imagine if"

Output format:
{
  "possibility_mindset": {
    "score": 0-10,
    "hopeful_language": [...],
    "future_orientation": [...],
    "growth_mindset_instances": [...],
    "inspirational_moments": [...]
  }
}
```

### I12: Making Tangible Connections - Real-World Relevance
```
Analyze connections between classroom learning and real-world applications.

Identify:
1. Real-world examples - Current events, community issues
2. Career connections - How learning applies to jobs
3. Life skill applications - Practical uses
4. Community relevance - Local connections
5. Global perspectives - Wider world connections

Output format:
{
  "real_world_connections": {
    "score": 0-10,
    "connection_examples": [...],
    "relevance_to_students": [...],
    "application_discussions": [...],
    "missed_opportunities": [...]
  }
}
```

### I13: Change-Making - Impact Focus
```
Analyze discussions about making change or having impact.

Look for:
1. Problem identification - Recognizing issues to solve
2. Solution generation - Creating change ideas
3. Action planning - Steps to make change
4. Impact awareness - Understanding consequences
5. Agency development - "I/we can make a difference"

Output format:
{
  "change_making": {
    "score": 0-10,
    "problem_solving_instances": [...],
    "student_agency_examples": [...],
    "action_orientation": [...],
    "impact_discussions": [...]
  }
}
```

### I14: Level-Up - Impact Assessment
```
Analyze how learning impact and progress are measured and discussed.

Examine:
1. Self-assessment opportunities - Students evaluating own progress
2. Peer feedback - Students assessing each other
3. Progress celebrations - Recognizing growth
4. Impact reflection - "What did we achieve?"
5. Learning evidence - Demonstrating understanding

Output format:
{
  "impact_assessment": {
    "score": 0-10,
    "assessment_methods": [...],
    "progress_indicators": [...],
    "celebration_moments": [...],
    "reflection_quality": "description"
  }
}
```

### I15: Revise and Reset - Continuous Improvement
```
Analyze evidence of iterative improvement and adaptation.

Identify:
1. Revision opportunities - Improving work based on feedback
2. Process reflection - "What could we do better?"
3. Adaptation examples - Changing approach based on results
4. Improvement mindset - Continuous enhancement focus
5. Learning from failure - Using setbacks as growth

Output format:
{
  "continuous_improvement": {
    "score": 0-10,
    "revision_instances": [...],
    "adaptation_examples": [...],
    "improvement_discussions": [...],
    "failure_as_learning": [...]
  }
}
```

---

## Sentiment and Engagement Analyzer

### Overall Emotional Climate
```
Analyze the emotional tone and engagement level throughout this classroom session.

Assess:
1. Overall sentiment - Positive, neutral, negative ratios
2. Emotional vocabulary - Feeling words used
3. Engagement indicators - Excitement, curiosity, boredom
4. Stress indicators - Frustration, anxiety, pressure
5. Joy in learning - Laughter, enthusiasm, celebration

For each segment, identify:
- Dominant emotion
- Engagement level (1-10)
- Contributing factors
- Shift points (when mood changes)

Output format:
{
  "emotional_climate": {
    "overall_sentiment": "positive/neutral/negative",
    "sentiment_breakdown": {
      "positive": percentage,
      "neutral": percentage,
      "negative": percentage
    },
    "engagement_score": 0-10,
    "emotional_highlights": [...],
    "concerning_moments": [...],
    "joy_indicators": [...]
  }
}
```

---

## Participation Pattern Analyzer

### Comprehensive Participation Analysis
```
Analyze detailed participation patterns and classroom dynamics.

Track:
1. Individual student participation frequency
2. Length of contributions
3. Quality of contributions (surface vs. deep)
4. Interaction patterns (teacher-student, student-student)
5. Quiet student identification
6. Dominant voice patterns
7. Teacher facilitation strategies

Create participation map showing:
- Who speaks to whom
- Frequency and duration
- Content depth
- Inclusion efforts

Output format:
{
  "participation_patterns": {
    "individual_profiles": [
      {
        "student_id": "anonymized",
        "speaking_turns": count,
        "average_length": seconds,
        "contribution_quality": "assessment",
        "interaction_types": [...]
      }
    ],
    "classroom_dynamics": {
      "balanced_participation": true/false,
      "inclusion_strategies": [...],
      "quiet_student_engagement": [...],
      "dominance_patterns": [...]
    },
    "recommendations": [...]
  }
}
```

---

## Meta-Analysis Prompt

### CIQ Score Calculation and Insights
```
Based on all component analyses, calculate the overall CIQ score and provide comprehensive insights.

Synthesize:
1. Weighted scores from all components
2. Key strengths across ECI dimensions
3. Primary growth opportunities
4. Actionable recommendations
5. Progress indicators to track

Consider adaptive weighting based on:
- Teacher's stated goals
- Classroom context
- Student needs identified

Output format:
{
  "ciq_summary": {
    "overall_score": 0-100,
    "component_scores": {
      "equity": score,
      "creativity": score,
      "innovation": score
    },
    "weighted_components": {
      "sis_lms_integration": weighted_score,
      "survey_data": weighted_score,
      "eci_blueprint": weighted_score
    },
    "key_strengths": [
      {
        "area": "component",
        "evidence": "specific examples",
        "impact": "description"
      }
    ],
    "growth_opportunities": [
      {
        "area": "component",
        "current_state": "description",
        "recommended_action": "specific strategy",
        "expected_impact": "outcome"
      }
    ],
    "personalized_recommendations": [
      {
        "recommendation": "text",
        "rationale": "why this matters",
        "implementation_steps": [...],
        "success_indicators": [...]
      }
    ],
    "celebration_points": [
      "specific achievements to recognize"
    ]
  }
}
```

---

## Usage Notes

1. **Transcript Preparation**: Ensure transcripts include speaker identification and timestamps for accurate analysis.

2. **Context Inclusion**: Provide relevant context such as:
   - Grade level
   - Subject matter
   - Class size
   - Lesson objectives
   - Special circumstances

3. **Privacy Considerations**: All student identifiers should be anonymized before analysis.

4. **Iterative Refinement**: These prompts should be refined based on:
   - Accuracy of insights generated
   - Teacher feedback on relevance
   - Student outcome correlations
   - Research updates

5. **Non-Evaluative Tone**: All analyses should maintain a growth-focused, supportive tone that celebrates strengths while identifying opportunities.

6. **Cultural Sensitivity**: Ensure analyses consider cultural contexts and avoid biased interpretations of communication styles or behaviors.