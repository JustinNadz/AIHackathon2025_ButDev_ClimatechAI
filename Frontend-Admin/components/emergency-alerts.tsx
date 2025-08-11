import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Send, Clock } from "lucide-react"

export function EmergencyAlerts() {
  const activeAlerts = [
    {
      id: 1,
      type: "Flood Warning",
      location: "Marikina River Basin",
      severity: "high",
      time: "15 minutes ago",
      message: "Water level rising rapidly. Evacuation recommended for low-lying areas.",
    },
    {
      id: 2,
      type: "Landslide Alert",
      location: "Baguio Mountain Slopes",
      severity: "medium",
      time: "1 hour ago",
      message: "Soil saturation detected. Monitor for ground movement.",
    },
    {
      id: 3,
      type: "Power Grid Alert",
      location: "Metro Manila Grid",
      severity: "low",
      time: "2 hours ago",
      message: "Minor voltage fluctuations detected. Backup systems on standby.",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="border-blue-200 w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Emergency Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 w-full">
        {activeAlerts.map((alert) => (
          <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{alert.type}</h4>
                <p className="text-sm opacity-75">{alert.location}</p>
              </div>
              <div className="flex items-center space-x-1 text-xs opacity-75">
                <Clock className="w-3 h-3" />
                <span>{alert.time}</span>
              </div>
            </div>

            <p className="text-sm mb-3">{alert.message}</p>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {alert.severity.toUpperCase()}
              </Badge>
              <Button size="sm" variant="outline" className="text-xs bg-transparent">
                <Send className="w-3 h-3 mr-1" />
                Send Alert
              </Button>
            </div>
          </div>
        ))}

        <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Emergency Broadcast
        </Button>
      </CardContent>
    </Card>
  )
}
