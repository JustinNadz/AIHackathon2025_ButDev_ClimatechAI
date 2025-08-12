import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Thermometer, Droplets, Wind, Zap, Activity } from "lucide-react"

export function LiveDataFeed() {
  const liveData = [
    {
      station: "PAGASA Station - Quezon City",
      type: "weather",
      data: [
        { label: "Temperature", value: "28.5°C", icon: Thermometer, status: "normal" },
        { label: "Rainfall", value: "12.3 mm/hr", icon: Droplets, status: "warning" },
        { label: "Wind Speed", value: "15.2 km/h", icon: Wind, status: "normal" },
      ],
    },
    {
      station: "PHIVOLCS Station - Marikina",
      type: "seismic",
      data: [
        { label: "Ground Motion", value: "0.02 gal", icon: Activity, status: "normal" },
        { label: "Last Event", value: "Mag 2.1", icon: Activity, status: "normal" },
      ],
    },
    {
      station: "Power Grid - Luzon",
      type: "power",
      data: [
        { label: "Voltage", value: "230.5V", icon: Zap, status: "normal" },
        { label: "Load Factor", value: "87.3%", icon: Zap, status: "normal" },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "danger":
        return "bg-red-100 text-red-800"
      default:
        return "bg-green-100 text-green-800"
    }
  }

  return (
    <Card className="border-blue-200 w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Live Data Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {liveData.map((station, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-blue-900">{station.station}</h4>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {station.type}
                </Badge>
              </div>

              <div className="space-y-3">
                {station.data.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{item.value}</span>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {station.type === "power" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Grid Stability</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
