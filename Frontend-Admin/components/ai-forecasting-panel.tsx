import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp } from "lucide-react"

export function AIForecastingPanel() {
  const forecasts = [
    {
      type: "Flood Risk",
      probability: 75,
      timeframe: "6-12 hours",
      confidence: 92,
      status: "high",
    },
    {
      type: "Landslide Risk",
      probability: 35,
      timeframe: "24-48 hours",
      confidence: 78,
      status: "medium",
    },
    {
      type: "Power Outage",
      probability: 15,
      timeframe: "12-24 hours",
      confidence: 85,
      status: "low",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return "bg-red-500"
    if (probability >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <Card className="border-blue-200 w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          AI Forecasting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 w-full">
        {forecasts.map((forecast, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-900">{forecast.type}</h4>
              <Badge className={getStatusColor(forecast.status)}>{forecast.status} risk</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Probability</span>
                <span className="font-bold">{forecast.probability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProbabilityColor(forecast.probability)}`}
                  style={{ width: `${forecast.probability}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span>Timeframe: {forecast.timeframe}</span>
              <span>Confidence: {forecast.confidence}%</span>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">Model Accuracy</span>
            </div>
            <span className="font-bold text-blue-900">94.2%</span>
          </div>
          <Progress value={94.2} className="mt-2 h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
