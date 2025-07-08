import { auth } from "~/server/auth"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "~/components/ui/button"

// Mock data for now - TODO: Replace with real data from database/datawarehouse
const classroomActivities = [
  {
    id: 1,
    title: "Mind Map Madness",
    description: "Encourage students to create a collaborative mind map on the topic you're teaching. Use sticky notes or a digital tool like Jamboard. Prompt them to link ideas, ask questions, and explore connections together.",
  },
  {
    id: 2,
    title: "Think-Pair-Share",
    description: "Pose a thought-provoking question to the class. Give students time to think individually, then pair up to discuss their ideas. Finally, have pairs share their insights with the whole class.",
  },
  {
    id: 3,
    title: "Gallery Walk",
    description: "Create stations around the room with different prompts or problems. Students rotate through stations in small groups, adding their thoughts and building on others' ideas.",
  },
]

const achievements = [
  {
    id: 1,
    title: "Practice Prodigy",
    icon: "🏆",
    progress: 3,
    total: 10,
    description: "Complete 10 consecutive practice sessions without skipping a day.",
  },
]

const triviaQuestions = [
  {
    id: 1,
    question: "On average, how much time does a teacher typically pause after asking a question?",
    answers: ["<1 Second", "1-2 Seconds", "3-5 Seconds", ">5 Seconds"],
    currentIndex: 0,
  },
]

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
      </div>

      {/* Try this in your classroom carousel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Try this in your classroom</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-2xl font-bold">{classroomActivities[0].title}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {classroomActivities[0].description}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Your Teaching Trends */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Your Teaching Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Overall Performance */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Overall Performance</p>
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold mb-8">Classroom Maestro</h3>
                  {/* TODO: Add gauge chart component */}
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    [Performance Gauge]
                  </div>
                </div>
              </div>
              
              {/* Domain Performance */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Domain Performance</p>
                <div className="py-8">
                  {/* TODO: Add donut chart component */}
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    [Domain Chart]
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-600" />
                      <span className="text-sm">Equity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-600" />
                      <span className="text-sm">Creativity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-600" />
                      <span className="text-sm">Innovation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.map((achievement) => (
              <div key={achievement.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{achievement.title}</h4>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.progress}/{achievement.total}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trivia Time */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Trivia Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              {triviaQuestions[0].question}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {triviaQuestions[0].answers.map((answer, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-sm h-auto py-3 px-3"
                >
                  {answer}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1 pt-2">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Framework Performance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Framework Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Performance metrics across the CIQ framework will be displayed here.
            </p>
            {/* TODO: Add framework performance visualization */}
            <div className="h-48 flex items-center justify-center text-muted-foreground mt-4">
              [Framework Performance Chart]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}