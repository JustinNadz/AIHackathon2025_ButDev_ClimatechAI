"use client"

import { useState } from "react"
import { Search, MapPin, Star, Clock, Users, Compass, Mountain, Building, TreePine } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ExploreSection() {
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    { icon: Building, name: "Cities", count: "1,234", color: "from-blue-500 to-blue-600" },
    { icon: Mountain, name: "Nature", count: "856", color: "from-green-500 to-green-600" },
    { icon: Star, name: "Popular", count: "2,341", color: "from-yellow-500 to-yellow-600" },
    { icon: TreePine, name: "Parks", count: "567", color: "from-emerald-500 to-emerald-600" },
  ]

  const popularPlaces = [
    {
      id: 1,
      name: "Central Park",
      location: "New York, USA",
      rating: 4.8,
      visitors: "2.3M",
      image: "/central-park-autumn.png",
      description: "Iconic urban park in Manhattan with lakes, walking paths, and recreational areas.",
    },
    {
      id: 2,
      name: "Golden Gate Bridge",
      location: "San Francisco, USA",
      rating: 4.9,
      visitors: "1.8M",
      image: "/golden-gate-bridge.png",
      description: "Famous suspension bridge connecting San Francisco to Marin County.",
    },
    {
      id: 3,
      name: "Times Square",
      location: "New York, USA",
      rating: 4.6,
      visitors: "3.1M",
      image: "/times-square-night.png",
      description: "Bustling commercial intersection known for its bright lights and Broadway theaters.",
    },
    {
      id: 4,
      name: "Yellowstone National Park",
      location: "Wyoming, USA",
      rating: 4.9,
      visitors: "4.2M",
      image: "/yellowstone-geysers.png",
      description: "America's first national park featuring geysers, hot springs, and diverse wildlife.",
    },
  ]

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent mb-4">
            Explore Amazing Places
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover incredible destinations, hidden gems, and popular attractions around the world
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for places, cities, or attractions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-blue-100 focus:border-blue-300 bg-white/80 backdrop-blur-sm"
            />
            <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl">
              Search
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm border-blue-100"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.count} places</p>
            </Card>
          ))}
        </div>

        {/* Popular Places */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Star className="h-6 w-6 text-yellow-500 mr-2" />
            Popular Destinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularPlaces.map((place) => (
              <Card
                key={place.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white/90 backdrop-blur-sm"
              >
                <div className="relative">
                  <img
                    src={place.image || "/placeholder.svg"}
                    alt={place.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{place.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">{place.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {place.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Users className="h-3 w-3 mr-1" />
                    {place.visitors} visitors
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{place.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all duration-300 cursor-pointer">
            <Compass className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Discover Nearby</h3>
            <p className="text-sm opacity-90">Find interesting places around your current location</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all duration-300 cursor-pointer">
            <Clock className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Recently Viewed</h3>
            <p className="text-sm opacity-90">Revisit places you've explored recently</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition-all duration-300 cursor-pointer">
            <Star className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Favorites</h3>
            <p className="text-sm opacity-90">Your saved and bookmarked locations</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
