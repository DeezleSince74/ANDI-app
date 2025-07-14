"use client"
import Link from "next/link"
import { format } from "date-fns"
import { Mic, Upload, ChevronRight } from "lucide-react"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"

interface LogbookEntry {
  id: string
  title: string
  date: Date
  duration: string
  type: "recorded" | "uploaded"
  insightsAvailable?: Date
}

const mockEntries: LogbookEntry[] = [
  {
    id: "1",
    title: "Workshop: Building Classroom Routines",
    date: new Date("2024-03-22T14:00:00"),
    duration: "1 hr 20 mins",
    type: "recorded",
  },
  {
    id: "2",
    title: "Student Presentations on Space",
    date: new Date("2024-03-21T13:00:00"),
    duration: "58 mins",
    type: "recorded",
  },
  {
    id: "3",
    title: "Math Review: Fractions & Decimals",
    date: new Date("2024-03-20T10:15:00"),
    duration: "1 hr 10 mins",
    type: "recorded",
  },
  {
    id: "4",
    title: "Group Discussion on Environmental Science",
    date: new Date("2024-03-18T09:00:00"),
    duration: "1 hr 05 mins",
    type: "uploaded",
  },
  {
    id: "5",
    title: "Reading Circle - The Giver",
    date: new Date("2024-03-19T11:30:00"),
    duration: "45 mins",
    type: "recorded",
  },
  {
    id: "6",
    title: "Review Session: Revolutionary War",
    date: new Date("2024-03-15T11:00:00"),
    duration: "1 hr 05 mins",
    type: "recorded",
  },
  {
    id: "7",
    title: "Geometry Lesson: Angles & Triangles",
    date: new Date("2024-03-13T10:00:00"),
    duration: "1 hr 15 mins",
    type: "uploaded",
  },
]

const thisWeekEntries = mockEntries.filter(entry => {
  const entryDate = entry.date
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  return entryDate >= weekStart
})

const lastWeekEntries = mockEntries.filter(entry => {
  const entryDate = entry.date
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  const lastWeekStart = new Date(weekStart.setDate(weekStart.getDate() - 7))
  return entryDate >= lastWeekStart && entryDate < weekStart
})

export default function LogbookPage() {
  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Logbook</h1>

      {/* This Week Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">This week</h2>
          {thisWeekEntries.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Insights available on {format(new Date("2024-03-23"), "EEE, MMM d")}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {thisWeekEntries.map((entry) => (
            <Card key={entry.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{entry.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(entry.date, "EEE, MMM d · h:mm a")}</span>
                      <span>{entry.duration}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {entry.type === "recorded" ? (
                      <>
                        <Mic className="w-3 h-3 mr-1" />
                        Recorded
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        Uploaded
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Last Week Section */}
      {lastWeekEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Last Week</h2>
            <Button variant="link" asChild className="text-primary">
              <Link href="/insights">
                View Insights
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {lastWeekEntries.map((entry) => (
              <Card key={entry.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{entry.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{format(entry.date, "EEE, MMM d · h:mm a")}</span>
                        <span>{entry.duration}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {entry.type === "recorded" ? (
                        <>
                          <Mic className="w-3 h-3 mr-1" />
                          Recorded
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-1" />
                          Uploaded
                        </>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}