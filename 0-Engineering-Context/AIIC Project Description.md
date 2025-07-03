INTELLECTUAL MERIT

Note:
- AIIC = Artificial Intelligence Instructional Coach
- The AIIC we are building is called ANDI

**Core Innovation**  
The AI Instructional Coach (AIIC) is an AI-powered platform that transforms classroom data into bite-sized recommendations on an easy-to-use dashboard, empowering teachers to optimize instruction, boost engagement, and drive student success. We empower teachers to drive their professional development, helping them feel more confident about the impact of their teaching. 

***The key novelty is our Classroom Impact Quotient (CIQ).*** 

CIQ is a proprietary metric, developed by Logan & Friends, that quantifies classroom engagement by analyzing audio data to capture behavioral, cognitive, and emotional cues. Grounded in research from cognitive science, developmental psychology, and neuroscience, CIQ translates proven learning science principles into practical feedback that allows teachers to enhance learning environments effectively. 

**The CIQ is one of the technical components of the AIIC\!** 

This is how it works: In short, we place a multi-directional microphone in the classroom that records the lesson. During the lesson, the microphone picks up on all conversations throughout the classroom. (These audio recordings are our primary data source). AIIC transcribes that data, analyzes it against CIQ, and produces a dashboard with context-aware, bite-sized recommendations for improving classroom engagement. 

Essentially, we are taking the guesswork out of classroom instruction by collecting reliable classroom data, applying the CIQ to measure classroom engagement, and presenting the analyzed data in an easy-to-use, interactive format. It’s like business intelligence for teachers\!  

By using AI to generate the recommendations, we are able to make the teacher dashboard continuously more accurate and context-aware, and therefore, specific to the needs of both teachers and students (just think \- no two teacher dashboards will ever be the same).

***This Small Business Innovation Research (SBIR) Phase I project will address the following key question: How can we use AI to strengthen the connection between teacher actions and classroom engagement?*** We will conduct rigorous research and iterative user testing to identify (1) the most reliable metrics for measuring classroom engagement and (2) which teacher actions have the most impact on classroom engagement?

AIIC, our platform that will drive this innovation, combines three key technical components:

1. The Classroom Impact Quotient (CIQ) that quantifies classroom engagement through continuous audio analysis to assess the impact of specific teaching strategies on student engagement
2. An automated step-back prompting engine that transforms specific queries into higher-level abstract questions
3. A Retrieval Augmented Generation (RAG) system customized to generate specific recommendations for teachers

The following sections will explain each of the three aforementioned technical components in detail.

**Classroom Impact Quotient (CIQ)**

For as long as we’ve had tape recorders, we’ve always had the ability to record lessons. However, in the past, we were presented with two challenges: (1) once we record the lessons, how will we analyze the vast amount of audio data, and (2) what metrics will we use to measure the data against? AIIC with CIQ integration solves both of these. Unlike traditional, subjective engagement metrics methods, CIQ offers a data-driven approach that revolutionizes teaching by providing a continuous, objective measure of classroom engagement through reliable audio analysis.

CIQ is built on the following, well established theories:

* constructivism (which emphasizes active engagement and problem-solving) (Lijano, H. B., 2018),
* social learning (the value of interaction and collaboration) (Dearing, J. W., & Cox, J. G., 2018),
* metacognitive regulation (awareness of one's own thought processes) (Flavell, J. H.,1979).

More specifically, the CIQ considers the following researched-based indicators that contribute positively to classroom engagement: 

* **Creativity**: Creativity in learning, driven by self-expression, curiosity, and personal development, is key to effective knowledge transfer. CIQ measures behaviors that encourage ideation, allowing teachers to create conditions that enhance curiosity-driven exploration, a well-established driver of deeper understanding and long-term retention.
  * Express Yourself: How will we nurture self-expression? *Create an environment where students can explore their personal creativity.*
  * Play, get messy: What opportunities will we create for experimentation? *Create a dynamic environment that encourages exploration and playful learning.*
  * Learn by doing: What skills will we introduce? *Foster an interactive learning environment that promotes skill development through active participation.*
  * Practice Makes Perfect: Growing from Good to Great. *Encourage continuous improvement through persistent practice and reflection.*
* **Innovation**: Fostering problem-solving and resourcefulness helps students become adaptable thinkers, a skill closely aligned with cognitive flexibility and resilience. CIQ measures how often and effectively students engage in problem-solving, allowing educators to focus on practices that build these essential skills.
  * Hope: Inspiring Possibility How will we inspire a mindset of possibility? *Cultivate an environment that encourages optimism and open-mindedness.*
  * Making Tangible Connections: How will we create real-world connections? *Establish meaningful links between concepts and the real world.*
  * Change-Making: How will we share it with the world? *Communicate innovations and ideas effectively.*
  * Level-up: How will we understand influence/impact? *Evaluate the effectiveness and outcomes of innovations*
  * Revise and reset: How will we keep getting better? Continuously improve through reflection and adaptation.
* **Bloom’s Taxonomy** (Almarode, J., & Vandas, K. 2018): In the CIQ, Bloom’s Taxonomy refers to the level of questioning and prompting initiated by the teacher. CIQ considers all levels to be demonstrations of engagement but recognizes higher levels of questioning as a more impactful contributor to classroom engagement.
  * Factual Knowledge: Basic elements of a discipline that a student must know and be able to work with to solve problems including basic terminology and specific details and elements.
  * Conceptual Knowledge: Interrelationships between basic factual knowledge that demonstrate how elements work together, for example, classifications and categories, principles and generalizations, and theories, models, and structures.
  * Procedural Knowledge: How something is done including the methods of inquiry, skills, algorithms, techniques, and methods needed to investigate, apply, or analyze information.
  * Metacognitive Knowledge: Awareness and knowledge of one’s own cognition including strategies for learning, contextual and conditional knowledge about cognitive tasks, and self-knowledge.
* **Level of Questioning** \- Level of questioning focuses on the types of questions students ask during a lesson. It is measured with the same metrics as Bloom’s Taxonomy but focuses on the students' questioning levels rather than the teachers’.
* **Teacher vs. Student Talk Time**: This refers to the amount of time teachers spend talking in comparison to the amount of time students spend talking during a lesson. Research suggests that on average, teachers should spend 30% of the time talking compared to students’ 70% (Kostadinovska-Stojchevska, Bisera & Popovikj, Ivana, 2019).

***The novel integration of the CIQ indicators into the larger AIIC platform enables advanced behavioral analyses and dynamic metric mapping, linking student learning and engagement to actionable insights. Here is how it works:***

* **Behavioral Analysis** involves capturing and processing the raw classroom audio data and extracting features and identifying patterns that reflect classroom engagement (as identified by the indicators above). This step translates physical behaviors into measurable data points.
  * **Audio-based Feature Extraction for Engagement Metrics (Finding audio clips that demonstrate classroom engagement):** Our system processes classroom audio to extract key indicators of student engagement which are then converted into quantifiable data points.
  * **Pattern Recognition for Teaching Effectiveness (Finding audio clips that demonstrate teacher effectiveness):** The platform then identifies recurring patterns in the audio data that correspond with effective teaching practices (as identified by existing research based teaching frameworks \- ex: Charlotte Danielson’s Framework for Teaching), highlighting moments of peak engagement and areas needing improvement.
* **Metric Mapping** takes these quantified data points and contextualizes them by linking them to high-level educational indicators, such as specific teaching strategies or overall classroom engagement. It essentially translates raw behavioral signals into actionable insights and strategic recommendations for improving instruction.
  * **Correlation Between Teaching Strategies and Student Engagement (Identifying the effective teacher action that triggered the classroom engagement):** By mapping the CIQ metrics against various teaching methods, the platform identifies correlations that reveal which strategies are most effective in fostering student participation and learning.
  * **Translation of CIQ Metrics to Query Abstractions (Turning the correlation between effective teaching and classroom engagement into a recommendation):** The raw engagement data is transformed into high-level abstractions that contextualize specific teaching scenarios, enabling the system to generate relevant, strategic prompts for instructional adjustments.
  * **Dynamic Strategy Effectiveness Measurement (Using the process to make recommendations more accurate and tailored to the specific teachers and students):** The system continually measures the impact of different instructional approaches, allowing for ongoing refinement and optimization of teaching techniques to create a more responsive and effective learning environment.

In education, we often struggle to make a clear connection between teacher actions and student engagement. Much of this is because we have not yet been able to measure engagement in a meaningful way. The CIQ is a metric that will allow us to determine to what extent students are meaningfully engaged in learning in a way that supports both social-emotional learning and cognitive development. This never-before-accomplished feat, will provide teachers with tangible, actionable ways to improve their practice, measure their progress, and actually connect their teaching to student learning.

